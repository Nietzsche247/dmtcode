import { Card } from '@/components/ui/card';
import { FileImage, CheckCircle, ThumbsUp, Award } from 'lucide-react';

interface StatsSectionProps {
  totalSubmissions: number;
  validationsGiven: number;
  validationsReceived: number;
  reputationScore: number;
}

export const StatsSection = ({
  totalSubmissions,
  validationsGiven,
  validationsReceived,
  reputationScore,
}: StatsSectionProps) => {
  const stats = [
    {
      label: 'Submissions',
      value: totalSubmissions,
      icon: FileImage,
      description: 'Symbols you\'ve submitted',
    },
    {
      label: 'Validations Given',
      value: validationsGiven,
      icon: CheckCircle,
      description: 'Symbols you\'ve validated',
    },
    {
      label: 'Validations Received',
      value: validationsReceived,
      icon: ThumbsUp,
      description: 'Validations on your symbols',
    },
    {
      label: 'Reputation',
      value: reputationScore,
      icon: Award,
      description: 'Net upvotes on your work',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 bg-card/50 border-border hover:border-primary/50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};