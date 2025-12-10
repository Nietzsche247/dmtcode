import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Plus, History, AlertTriangle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ChangelogEntry {
  id: string;
  event_name: string;
  previous_quarter: string | null;
  previous_year: number | null;
  previous_probability: number | null;
  new_quarter: string;
  new_year: number;
  new_probability: number | null;
  trigger_reason: string;
  updated_at: string;
}

interface FalsificationCriterion {
  id: string;
  event_name: string;
  criterion: string;
  consequence: string;
  deadline: string | null;
  status: string;
}

interface MarketDisagreement {
  id: string;
  event_name: string;
  market_source: string;
  their_position: string;
  our_position: string;
  reasoning: string;
}

interface Forecast {
  event_name: string;
  quarter: string;
  year: number;
  probability: number;
}

export const ForecastChangelog = () => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [falsification, setFalsification] = useState<FalsificationCriterion[]>([]);
  const [disagreements, setDisagreements] = useState<MarketDisagreement[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'changelog' | 'falsification' | 'disagreements'>('changelog');
  
  // Form state for new changelog entry
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [newQuarter, setNewQuarter] = useState<string>('Q1');
  const [newYear, setNewYear] = useState<number>(2025);
  const [newProbability, setNewProbability] = useState<number>(50);
  const [triggerReason, setTriggerReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [changelogRes, falsificationRes, disagreementsRes] = await Promise.all([
        supabase.from('forecast_changelog').select('*').order('updated_at', { ascending: false }),
        supabase.from('falsification_criteria').select('*').order('event_name'),
        supabase.from('market_disagreements').select('*').order('event_name')
      ]);

      if (changelogRes.data) setChangelog(changelogRes.data);
      if (falsificationRes.data) setFalsification(falsificationRes.data);
      if (disagreementsRes.data) setDisagreements(disagreementsRes.data);
      
      // Build unique event names from changelog for dropdown
      const uniqueEvents = [...new Set(changelogRes.data?.map(c => c.event_name) || [])];
      setForecasts(uniqueEvents.map(name => ({ event_name: name, quarter: 'Q1', year: 2025, probability: 50 })));
    } catch (error) {
      console.error('Failed to fetch forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentForecast = forecasts.find(f => f.event_name === selectedEvent);

  const handleSubmitChange = async () => {
    if (!selectedEvent || !triggerReason.trim()) {
      toast({ title: "Error", description: "Please select an event and provide a trigger reason.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Insert changelog entry
      const { error: changelogError } = await supabase.from('forecast_changelog').insert({
        event_name: selectedEvent,
        previous_quarter: currentForecast?.quarter || null,
        previous_year: currentForecast?.year || null,
        previous_probability: currentForecast?.probability || null,
        new_quarter: newQuarter,
        new_year: newYear,
        new_probability: newProbability,
        trigger_reason: triggerReason
      });

      if (changelogError) throw changelogError;

      // Track PostHog event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('forecast_updated', {
          event_name: selectedEvent,
          previous_quarter: currentForecast?.quarter,
          previous_year: currentForecast?.year,
          previous_probability: currentForecast?.probability,
          new_quarter: newQuarter,
          new_year: newYear,
          new_probability: newProbability,
          trigger_reason: triggerReason
        });
      }

      toast({ title: "Success", description: "Forecast change logged successfully." });
      
      // Reset form
      setSelectedEvent('');
      setTriggerReason('');
      setNewQuarter('Q1');
      setNewYear(2025);
      setNewProbability(50);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to log change:', error);
      toast({ title: "Error", description: "Failed to log forecast change.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateFalsificationStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('falsification_criteria')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Status updated." });
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      triggered: 'bg-red-500/20 text-red-400',
      passed: 'bg-green-500/20 text-green-400'
    };
    return <Badge className={colors[status] || 'bg-muted'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Forecast Management</h2>
          <p className="text-muted-foreground">Track changes, falsification criteria, and market disagreements</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === 'changelog' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('changelog')}
        >
          <History className="w-4 h-4 mr-2" />
          Changelog ({changelog.length})
        </Button>
        <Button
          variant={activeTab === 'falsification' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('falsification')}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Falsification ({falsification.length})
        </Button>
        <Button
          variant={activeTab === 'disagreements' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('disagreements')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Disagreements ({disagreements.length})
        </Button>
      </div>

      {activeTab === 'changelog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Change Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Log New Change
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(forecasts.map(f => f.event_name))].map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentForecast && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">Current Position:</p>
                  <p className="font-medium">{currentForecast.quarter} {currentForecast.year} ({currentForecast.probability}%)</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Quarter</Label>
                  <Select value={newQuarter} onValueChange={setNewQuarter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>New Year</Label>
                  <Input
                    type="number"
                    value={newYear}
                    onChange={e => setNewYear(parseInt(e.target.value))}
                    min={2024}
                    max={2050}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>New Probability: {newProbability}%</Label>
                <Slider
                  value={[newProbability]}
                  onValueChange={([v]) => setNewProbability(v)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger Reason *</Label>
                <Textarea
                  value={triggerReason}
                  onChange={e => setTriggerReason(e.target.value)}
                  placeholder="What triggered this update?"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSubmitChange} 
                disabled={submitting || !selectedEvent || !triggerReason.trim()}
                className="w-full"
              >
                {submitting ? 'Logging...' : 'Log Change'}
              </Button>
            </CardContent>
          </Card>

          {/* Changelog Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : changelog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No changes logged yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>New</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changelog.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium max-w-[150px] truncate" title={entry.event_name}>
                          {entry.event_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {entry.previous_quarter} {entry.previous_year}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {entry.new_quarter} {entry.new_year}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={entry.trigger_reason}>
                          {entry.trigger_reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.updated_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'falsification' && (
        <Card>
          <CardHeader>
            <CardTitle>Falsification Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            {falsification.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No falsification criteria defined</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Criterion</TableHead>
                    <TableHead>Consequence</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {falsification.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">{item.event_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.criterion}>{item.criterion}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={item.consequence}>{item.consequence}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.deadline || '—'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Select value={item.status} onValueChange={(v) => updateFalsificationStatus(item.id, v)}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="triggered">Triggered</SelectItem>
                            <SelectItem value="passed">Passed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'disagreements' && (
        <Card>
          <CardHeader>
            <CardTitle>Market Disagreements</CardTitle>
          </CardHeader>
          <CardContent>
            {disagreements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No market disagreements recorded</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Their Position</TableHead>
                    <TableHead>Our Position</TableHead>
                    <TableHead>Reasoning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disagreements.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">{item.event_name}</TableCell>
                      <TableCell><Badge variant="outline">{item.market_source}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{item.their_position}</TableCell>
                      <TableCell>{item.our_position}</TableCell>
                      <TableCell className="max-w-[250px] truncate" title={item.reasoning}>{item.reasoning}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
