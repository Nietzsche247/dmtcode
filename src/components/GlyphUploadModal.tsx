// Retired component. Uploads now flow through the registry submission
// wizard writing to `symbol_submissions`.
interface GlyphUploadModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const GlyphUploadModal = (_props: GlyphUploadModalProps) => null;
