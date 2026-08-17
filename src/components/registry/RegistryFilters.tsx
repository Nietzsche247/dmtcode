import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { tagLabel } from '@/lib/tags';

const TAG_PRESETS = [
  'geometric', 'alphabetic', 'spiral', 'mandala', 'grid', 'flowing', 
  'static', 'moving', 'layered', '3D', 'repeating', 'unique',
  'hieroglyphic', 'binary', 'mathematical', 'organic', 'mechanical'
];

interface RegistryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sourceFilter: string;
  onSourceChange: (source: string) => void;
  doseFilter: string;
  onDoseChange: (dose: string) => void;
  recordFilter: string;
  onRecordChange: (record: string) => void;
  soberBaselineCount: number;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const RegistryFilters = ({
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceChange,
  doseFilter,
  onDoseChange,
  recordFilter,
  onRecordChange,
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  soberBaselineCount,
}: RegistryFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search symbols by description or tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 h-12 bg-card/50 border-border focus:border-primary"
        />
      </div>

      {/* Collapsible Filters */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-center gap-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  Active
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-4">
          <div className="p-4 bg-card/30 border border-border rounded-lg space-y-4">
            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Source Method</label>
                <Select value={sourceFilter} onValueChange={onSourceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    <SelectItem value="laser_650nm">650nm Laser</SelectItem>
                    <SelectItem value="closed_eye">Closed Eye</SelectItem>
                    <SelectItem value="open_eye">Open Eye</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="most_validated">Most recognized</SelectItem>
                    <SelectItem value="most_upvoted">Most upvoted</SelectItem>
                    <SelectItem value="most_responses">Most responded to</SelectItem>
                    <SelectItem value="resonance">Community resonance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Record Type</label>
                <Select value={recordFilter} onValueChange={onRecordChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All records" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All records</SelectItem>
                    <SelectItem value="null_report">Null reports only</SelectItem>
                    <SelectItem value="sober">Sober baseline only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Dose Level</label>
                <Select value={doseFilter} onValueChange={onDoseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any dose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any dose</SelectItem>
                    <SelectItem value="none">None reported as zero</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="unreported">Not stated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Null reports and sober-baseline records sit in the same list as everything else and are
              tagged in place. There is no priming or co-witness field on these records today, so no
              filter is offered for either.
            </p>

            {/* Sober baseline chip. Contributor declared and unverified. */}
            <div>
              <Badge
                variant={recordFilter === 'sober_baseline_declared' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  recordFilter === 'sober_baseline_declared'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:border-primary hover:text-primary'
                }`}
                onClick={() =>
                  onRecordChange(recordFilter === 'sober_baseline_declared' ? 'all' : 'sober_baseline_declared')
                }
              >
                Sober baseline ({soberBaselineCount})
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Contributor declared, not independently verified.
              </p>
            </div>


            {/* Tags Multi-Select */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Filter by Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAG_PRESETS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedTags.includes(tag) 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'hover:border-primary hover:text-primary'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tagLabel(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
