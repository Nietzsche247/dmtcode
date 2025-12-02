import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ICalExportProps {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  url?: string;
}

const ICalExport = ({ title, description, startDate, endDate, location, url }: ICalExportProps) => {
  const generateICalFile = () => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DMT Code Project//Events//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@dmtcode.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${title}`,
      description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
      location ? `LOCATION:${location}` : '',
      url ? `URL:${url}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track GA4 event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ical_export', {
        event_name: title,
        event_category: 'engagement'
      });
    }

    toast.success("Calendar event downloaded!");
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={generateICalFile}
      className="w-full"
    >
      <Download className="w-4 h-4 mr-2" />
      Add to Calendar (.ics)
    </Button>
  );
};

export default ICalExport;
