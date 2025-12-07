import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X, Eye, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type SymbolSubmission = Tables<'symbol_submissions'> & {
  profile?: { display_name: string; avatar_url: string | null } | null;
};

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const SymbolSubmissionModeration = () => {
  const [submissions, setSubmissions] = useState<SymbolSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();

    const channel = supabase
      .channel('symbol-submission-moderation')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'symbol_submissions'
      }, () => {
        loadSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const loadSubmissions = async () => {
    setLoading(true);
    setSelectedIds(new Set());

    let query = supabase
      .from('symbol_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load submissions');
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch profiles separately for display names
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

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('symbol_submissions')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error(`Failed to ${newStatus === 'approved' ? 'approve' : 'reject'} submission`);
    } else {
      toast.success(`Submission ${newStatus}`);
      loadSubmissions();
    }
  };

  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedIds.size === 0) {
      toast.error('No submissions selected');
      return;
    }

    setBulkLoading(true);

    const { error } = await supabase
      .from('symbol_submissions')
      .update({ status: action })
      .in('id', Array.from(selectedIds));

    setBulkLoading(false);

    if (error) {
      toast.error(`Failed to bulk ${action === 'approved' ? 'approve' : 'reject'}`);
    } else {
      toast.success(`${selectedIds.size} submissions ${action}`);
      setSelectedIds(new Set());
      loadSubmissions();
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

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading submissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Symbol Submissions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user-submitted symbols for the registry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Shown</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
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

      {/* Bulk Actions Bar */}
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
              onClick={() => handleBulkAction('approved')}
              disabled={selectedIds.size === 0 || bulkLoading}
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('rejected')}
              disabled={selectedIds.size === 0 || bulkLoading}
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <X className="w-4 h-4 mr-1" />}
              Reject Selected
            </Button>
          </div>
        </Card>
      )}

      {/* Submissions Grid */}
      {submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No submissions found with current filter</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {submissions.map((submission) => (
            <Card 
              key={submission.id} 
              className={`p-4 space-y-3 transition-all ${
                selectedIds.has(submission.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Selection & Status Header */}
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={selectedIds.has(submission.id)}
                  onCheckedChange={() => toggleSelect(submission.id)}
                  aria-label={`Select submission ${submission.id}`}
                />
                <Badge variant={getStatusBadgeVariant(submission.status)}>
                  {submission.status}
                </Badge>
              </div>

              {/* Symbol Image */}
              <div className="aspect-square w-full bg-white rounded-lg overflow-hidden border">
                <img
                  src={submission.image_url}
                  alt={`Symbol submission`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Meta Info */}
              <div className="space-y-2">
                {submission.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {submission.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>👍 {submission.upvotes}</span>
                  <span>👎 {submission.downvotes}</span>
                  {submission.source_method && (
                    <Badge variant="outline" className="text-xs">
                      {submission.source_method}
                    </Badge>
                  )}
                </div>

                {submission.tags && submission.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {submission.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {submission.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{submission.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    by {submission.profile?.display_name || 'Anonymous'}
                  </span>
                  <span>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {submission.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatusChange(submission.id, 'approved')}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(submission.id, 'rejected')}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {submission.status !== 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(submission.id, 'approved')}
                    disabled={submission.status === 'approved'}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(submission.id, 'rejected')}
                    disabled={submission.status === 'rejected'}
                    className="flex-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
