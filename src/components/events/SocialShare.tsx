import { Twitter, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialShareProps {
  title: string;
  description?: string;
  entityType: "event" | "trial" | "retreat";
}

const SocialShare = ({ title, description, entityType }: SocialShareProps) => {
  const currentUrl = window.location.href;
  const shareText = `${title}${description ? ` - ${description.slice(0, 100)}...` : ''}`;
  
  const getUtmUrl = (platform: string) => {
    const url = new URL(currentUrl);
    url.searchParams.set('utm_source', platform);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', `${entityType}_share`);
    return url.toString();
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${shareText} ${getUtmUrl('twitter')}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(getUtmUrl('linkedin'));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${shareText}\n\n${getUtmUrl('email')}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Share:</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleTwitterShare}
        className="h-8 w-8"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLinkedInShare}
        className="h-8 w-8"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleEmailShare}
        className="h-8 w-8"
        aria-label="Share via email"
      >
        <Mail className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SocialShare;
