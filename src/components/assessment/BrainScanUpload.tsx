import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Image, FileText, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrainScanUploadProps {
  assessmentId: string;
  onUploadComplete: (url: string) => void;
}

export function BrainScanUpload({ assessmentId, onUploadComplete }: BrainScanUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    scan_type: '',
    scan_date: '',
    notes: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/dicom'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.dcm')) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP) or DICOM');
      return;
    }

    // Validate file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to upload files');
        return;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/scans/${assessmentId}/${timestamp}.${ext}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assessments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assessments')
        .getPublicUrl(filePath);

      // Update assessment with scan URL
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          brain_scan_url: urlData.publicUrl
        })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      toast.success('Brain scan uploaded successfully');
      onUploadComplete(urlData.publicUrl);
      
      // Reset form
      setFile(null);
      setPreview(null);
      setMetadata({ scan_type: '', scan_date: '', notes: '' });

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload brain scan');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="h-5 w-5" />
          Brain Scan Upload
        </CardTitle>
        <CardDescription>
          Upload neuroimaging data (fMRI, EEG, or other scans) for your assessment record
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors hover:border-primary/50
            ${file ? 'border-primary bg-primary/5' : 'border-border'}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.dcm"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {file ? (
            <div className="space-y-3">
              {preview ? (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-h-48 mx-auto rounded-lg"
                />
              ) : (
                <FileText className="h-16 w-16 mx-auto text-primary" />
              )}
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">{file.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">
                  JPEG, PNG, WebP, or DICOM (max 50MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Form */}
        {file && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scan Type</Label>
                <Input
                  value={metadata.scan_type}
                  onChange={(e) => setMetadata(prev => ({ ...prev, scan_type: e.target.value }))}
                  placeholder="e.g., fMRI, EEG, PET"
                />
              </div>
              <div className="space-y-2">
                <Label>Scan Date</Label>
                <Input
                  type="date"
                  value={metadata.scan_date}
                  onChange={(e) => setMetadata(prev => ({ ...prev, scan_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={metadata.notes}
                onChange={(e) => setMetadata(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional context about this scan..."
                className="min-h-[80px]"
              />
            </div>
            <Button 
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isUploading ? 'Uploading...' : 'Upload Scan'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
