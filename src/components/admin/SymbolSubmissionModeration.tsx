import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Eye, Loader2, Search, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';

declare global {
  interface Window {
    posthog?: any;
  }
}

type SymbolSubmission = Tables<'symbol_submissions'> & {
  profile?: { display_name: string; avatar_url: string | null } | null;
};

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const PAGE_SIZE = 20;

export const SymbolSubmissionModeration = () => {
  const [submissions, setSubmissions] = useState<SymbolSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectingBulk, setRejectingBulk] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<SymbolSubmission | null>(null);

  // Stats
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, today: 0 });

  useEffect(() => {
    // Track admin page view
    window.posthog?.capture('admin_page_viewed');
    
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    loadSubmissions();
    loadStats();

    const channel = supabase
      .channel('symbol-submission-moderation')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'symbol_submissions'
      }, () => {
        loadSubmissions();
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, searchQuery, currentPage, dateRange]);

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, approved, rejected, todayCount] = await Promise.all([
      supabase.from('symbol_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('symbol_submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('symbol_submissions').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('symbol_submissions').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);

    setStats({
      pending: pending.count || 0,
      approved: approved.count || 0,
      rejected: rejected.count || 0,
      today: todayCount.count || 0,
    });
  };

  const loadSubmissions = async () => {
    setLoading(true);
    setSelectedIds(new Set());

    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('symbol_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery.trim()) {
      query = query.ilike('description', `%${searchQuery.trim()}%`);
    }

    if (dateRange.from) {
      query = query.gte('created_at', dateRange.from.toISOString());
    }
    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endOfDay.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      toast.error('Failed to load submissions');
      console.error(error);
      setLoading(false);
      return;
    }

    setTotalCount(count || 0);

    // Fetch profiles separately
    const userIds = [...new Set((data || []).map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const submissionsWithProfiles = (data || []).map(s => ({
      ...s,
      profile: profileMap.get(s.user_id) || null
    }));

    setSubmissions(submissionsWithProfiles);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('symbol_submissions')
      .update({ 
        status: 'approved',
        moderated_by: currentUserId,
        moderated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to approve submission');
    } else {
      window.posthog?.capture('admin_submission_approved', { symbol_id: id });
      toast.success('Symbol approved');
      
      // Trigger notification (fire and forget)
      supabase.functions.invoke('notify-admin', {
        body: { submissionId: id, action: 'approved' }
      }).catch(console.error);
      
      loadSubmissions();
      loadStats();
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectingBulk(false);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const openBulkRejectModal = () => {
    if (selectedIds.size === 0) {
      toast.error('No submissions selected');
      return;
    }
    setRejectingBulk(true);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (rejectionReason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    setBulkLoading(true);

    if (rejectingBulk) {
      const { error } = await supabase
        .from('symbol_submissions')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          moderated_by: currentUserId,
          moderated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedIds));

      if (error) {
        toast.error('Failed to reject submissions');
      } else {
        window.posthog?.capture('admin_bulk_action', { 
          action_type: 'reject', 
          count: selectedIds.size 
        });
        toast.success(`${selectedIds.size} submissions rejected`);
        setSelectedIds(new Set());
      }
    } else if (rejectingId) {
      const { error } = await supabase
        .from('symbol_submissions')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          moderated_by: currentUserId,
          moderated_at: new Date().toISOString()
        })
        .eq('id', rejectingId);

      if (error) {
        toast.error('Failed to reject submission');
      } else {
        window.posthog?.capture('admin_submission_rejected', { 
          symbol_id: rejectingId,
          reason_length: rejectionReason.trim().length
        });
        toast.success('Symbol rejected');
        
        // Trigger notification
        supabase.functions.invoke('notify-admin', {
          body: { submissionId: rejectingId, action: 'rejected', reason: rejectionReason.trim() }
        }).catch(console.error);
      }
    }

    setBulkLoading(false);
    setRejectModalOpen(false);
    setRejectingId(null);
    loadSubmissions();
    loadStats();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error('No submissions selected');
      return;
    }

    setBulkLoading(true);

    const { error } = await supabase
      .from('symbol_submissions')
      .update({ 
        status: 'approved',
        moderated_by: currentUserId,
        moderated_at: new Date().toISOString()
      })
      .in('id', Array.from(selectedIds));

    setBulkLoading(false);

    if (error) {
      toast.error('Failed to approve submissions');
    } else {
      window.posthog?.capture('admin_bulk_action', { 
        action_type: 'approve', 
        count: selectedIds.size 
      });
      toast.success(`${selectedIds.size} submissions approved`);
      setSelectedIds(new Set());
      loadSubmissions();
      loadStats();
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map(s => s.id)));
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Symbol Submissions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and moderate user-submitted symbols
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-500">{stats.today}</div>
          <div className="text-sm text-muted-foreground">Today</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-destructive">{stats.rejected}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1); }} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending
                {stats.pending > 0 && <Badge variant="secondary" className="ml-2">{stats.pending}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search descriptions..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[280px] justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  <span>Filter by date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  setCurrentPage(1);
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
              {(dateRange.from || dateRange.to) && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setCurrentPage(1);
                    }}
                  >
                    Clear dates
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      {/* Bulk Actions */}
      {submissions.length > 0 && (
        <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === submissions.length && submissions.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} of {submissions.length} selected
            </span>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="default"
              onClick={handleBulkApprove}
              disabled={selectedIds.size === 0 || bulkLoading}
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={openBulkRejectModal}
              disabled={selectedIds.size === 0 || bulkLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Reject Selected
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading submissions...</span>
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No submissions found</p>
        </Card>
      ) : (
        <>
          {/* Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left w-12">
                    <Checkbox
                      checked={selectedIds.size === submissions.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left w-20">Image</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Submitter</th>
                  <th className="p-3 text-left w-24">Status</th>
                  <th className="p-3 text-left w-32">Date</th>
                  <th className="p-3 text-left w-20">Votes</th>
                  <th className="p-3 text-left w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr 
                    key={submission.id} 
                    className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      selectedIds.has(submission.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(submission.id)}
                        onCheckedChange={() => toggleSelect(submission.id)}
                      />
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => { setViewingSubmission(submission); setViewModalOpen(true); }}
                        className="block w-16 h-16 bg-white rounded border overflow-hidden hover:ring-2 ring-primary transition-all"
                      >
                        <img
                          src={submission.image_url}
                          alt="Symbol"
                          className="w-full h-full object-contain"
                        />
                      </button>
                    </td>
                    <td className="p-3">
                      <p className="text-sm line-clamp-2 max-w-xs" title={submission.description || ''}>
                        {submission.description || <span className="text-muted-foreground italic">No description</span>}
                      </p>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{submission.profile?.display_name || 'Anonymous'}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(submission.status)}>
                        {submission.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        👍 {submission.upvotes} 👎 {submission.downvotes}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setViewingSubmission(submission); setViewModalOpen(true); }}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(submission.id)}
                          disabled={submission.status === 'approved'}
                          className="text-green-500 hover:text-green-600"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openRejectModal(submission.id)}
                          disabled={submission.status === 'rejected'}
                          className="text-destructive hover:text-destructive"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission{rejectingBulk ? 's' : ''}</DialogTitle>
            <DialogDescription>
              {rejectingBulk 
                ? `Provide a reason for rejecting ${selectedIds.size} submissions.`
                : 'Provide a reason for rejecting this submission.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason (minimum 10 characters)..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {rejectionReason.length}/10 characters minimum
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={rejectionReason.trim().length < 10 || bulkLoading}
            >
              {bulkLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {viewingSubmission && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4">
                <img
                  src={viewingSubmission.image_url}
                  alt="Symbol"
                  className="w-full aspect-square object-contain"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div><Badge variant={getStatusBadgeVariant(viewingSubmission.status)}>{viewingSubmission.status}</Badge></div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Submitter</label>
                  <p>{viewingSubmission.profile?.display_name || 'Anonymous'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="text-sm">{viewingSubmission.description || 'No description'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Votes</label>
                  <p>👍 {viewingSubmission.upvotes} / 👎 {viewingSubmission.downvotes}</p>
                </div>
                {viewingSubmission.tags && viewingSubmission.tags.length > 0 && (
                  <div>
                    <label className="text-sm text-muted-foreground">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingSubmission.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {viewingSubmission.source_method && (
                  <div>
                    <label className="text-sm text-muted-foreground">Source Method</label>
                    <p>{viewingSubmission.source_method}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Submitted</label>
                  <p>{new Date(viewingSubmission.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewingSubmission?.status === 'pending' && (
              <>
                <Button 
                  variant="default" 
                  onClick={() => { handleApprove(viewingSubmission.id); setViewModalOpen(false); }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => { openRejectModal(viewingSubmission.id); setViewModalOpen(false); }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
