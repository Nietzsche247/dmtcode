import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { FilterState } from './types';
import { emptyFilters } from './types';

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  contentTypes: string[];
  authorityTypes: string[];
  tags: string[];
  years: string[];
}

export const BibliographyFilters = ({ value, onChange, contentTypes, authorityTypes, tags, years }: Props) => {
  const update = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <Input
          placeholder="Search title or author"
          value={value.search}
          onChange={(e) => update({ search: e.target.value })}
          className="lg:col-span-2"
        />

        <Select value={value.contentType} onValueChange={(v) => update({ contentType: v })}>
          <SelectTrigger><SelectValue placeholder="Content type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All content types</SelectItem>
            {contentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.authorityType} onValueChange={(v) => update({ authorityType: v })}>
          <SelectTrigger><SelectValue placeholder="Authority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All authorities</SelectItem>
            {authorityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.stance} onValueChange={(v) => update({ stance: v as FilterState['stance'] })}>
          <SelectTrigger><SelectValue placeholder="Stance" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stances</SelectItem>
            <SelectItem value="supportive">Supportive</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="skeptical">Skeptical</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.year} onValueChange={(v) => update({ year: v })}>
          <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => update({ tag: 'all' })}
            className={`text-xs px-2 py-1 rounded border ${value.tag === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-muted-foreground hover:border-foreground/40'}`}
          >
            All tags
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update({ tag: t })}
              className={`text-xs px-2 py-1 rounded border ${value.tag === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-muted-foreground hover:border-foreground/40'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilters)}>Reset filters</Button>
      </div>
    </div>
  );
};
