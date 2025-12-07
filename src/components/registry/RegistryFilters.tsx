import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

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
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
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
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most_upvoted">Most Upvoted</SelectItem>
                    <SelectItem value="most_validated">Most Validated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1" />
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
                    {tag}
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
