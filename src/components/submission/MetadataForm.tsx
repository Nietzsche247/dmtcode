import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, ArrowRight, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContextTermPicker } from '@/components/context/ContextTermPicker';

const TAG_PRESETS = [
  'geometric', 'alphabetic', 'spiral', 'mandala', 'grid', 'flowing', 
  'static', 'moving', 'layered', '3D', 'repeating', 'unique',
  'katakana-like', 'hieroglyphic', 'binary', 'mathematical', 
  'organic', 'mechanical', 'alien', 'familiar'
];

const SOURCE_METHODS = [
  { value: 'laser_650nm', label: '650nm Laser Protocol' },
  { value: 'closed_eye', label: 'Closed Eye Visuals' },
  { value: 'open_eye', label: 'Open Eye Visuals' },
  { value: 'other', label: 'Other Method' },
];

const DOSE_LEVELS = [
  { value: 'threshold', label: 'Threshold' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'heroic', label: 'Heroic' },
];

const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'Seen Once' },
  { value: 'multiple', label: 'Multiple Times' },
  { value: 'persistent', label: 'Persistent/Ongoing' },
];

const VALENCE_OPTIONS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'mixed', label: 'Mixed' },
];

const formSchema = z.object({
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(500, 'Description must be less than 500 characters'),
  sourceMethod: z.string().refine(
    (val) => ['laser_650nm', 'closed_eye', 'open_eye', 'other'].includes(val),
    { message: 'Please select a source method' }
  ),
  surfaceType: z.string().optional(),
  wavelength: z.string().optional(),
  doseLevel: z.string().optional(),
  durationSeconds: z.number().min(1).optional().nullable(),
  recurrence: z.string().optional(),
  emotionalValence: z.string().optional(),
});

export interface SymbolMetadata {
  description: string;
  tags: string[];
  sourceMethod: 'laser_650nm' | 'closed_eye' | 'open_eye' | 'other';
  surfaceType?: string;
  wavelength?: string;
  doseLevel?: 'threshold' | 'low' | 'medium' | 'high' | 'heroic';
  durationSeconds?: number;
  recurrence?: 'once' | 'multiple' | 'persistent';
  emotionalValence?: 'positive' | 'neutral' | 'negative' | 'mixed';
}

interface MetadataFormProps {
  onSubmit: (data: SymbolMetadata) => void;
  initialData?: SymbolMetadata | null;
  onBack: () => void;
}

export const MetadataForm = ({ onSubmit, initialData, onBack }: MetadataFormProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [customTagInput, setCustomTagInput] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || '',
      sourceMethod: initialData?.sourceMethod,
      surfaceType: initialData?.surfaceType || '',
      wavelength: initialData?.wavelength || '650nm',
      doseLevel: initialData?.doseLevel,
      durationSeconds: initialData?.durationSeconds || null,
      recurrence: initialData?.recurrence,
      emotionalValence: initialData?.emotionalValence,
    },
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedTags.length === 0) {
      form.setError('root', { message: 'Please select at least one tag' });
      return;
    }

    onSubmit({
      description: data.description,
      tags: selectedTags,
      sourceMethod: data.sourceMethod as 'laser_650nm' | 'closed_eye' | 'open_eye' | 'other',
      surfaceType: data.surfaceType,
      wavelength: data.wavelength,
      doseLevel: data.doseLevel as 'threshold' | 'low' | 'medium' | 'high' | 'heroic' | undefined,
      durationSeconds: data.durationSeconds ?? undefined,
      recurrence: data.recurrence as 'once' | 'multiple' | 'persistent' | undefined,
      emotionalValence: data.emotionalValence as 'positive' | 'neutral' | 'negative' | 'mixed' | undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the symbol you observed in detail. Include any notable features, patterns, or impressions..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50-500 characters required</span>
                  <span className={cn(
                    field.value.length < 50 ? 'text-destructive' :
                    field.value.length > 500 ? 'text-destructive' : ''
                  )}>
                    {field.value.length}/500
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags * (select at least one)</Label>
            
            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="default"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Preset tags */}
            <div className="flex flex-wrap gap-2">
              {TAG_PRESETS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full border transition-all min-h-[36px]",
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                aria-label="Add custom tag"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
          </div>
        </div>

        {/* Context Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Context</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sourceMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Method *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How was this observed?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SOURCE_METHODS.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="surfaceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surface Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., wall, ceiling, skin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wavelength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wavelength</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 650nm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Experience Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Experience Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="doseLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dose Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOSE_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (seconds)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="How long did it last?"
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How often seen?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emotionalValence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emotional Valence</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How did it feel?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VALENCE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Drawing
          </Button>
          
          <Button type="submit" className="gap-2">
            Preview Submission
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};