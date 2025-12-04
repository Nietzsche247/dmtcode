import { Check, X, Minus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const bundles = [
  { id: 'starter', name: 'Fractal Starter', price: 85, tier: 'entry' },
  { id: 'gateway', name: 'Gateway Research', price: 1200, tier: 'mid', popular: true },
  { id: 'complete', name: 'Complete Symbol', price: 2300, tier: 'high' },
  { id: 'ceremony', name: 'Extended Ceremony', price: 3500, tier: 'premium' },
];

type FeatureValue = boolean | string | 'partial';

interface Feature {
  name: string;
  category: string;
  starter: FeatureValue;
  gateway: FeatureValue;
  complete: FeatureValue;
  ceremony: FeatureValue;
}

const features: Feature[] = [
  // Equipment
  { name: '650nm/660nm Light Device', category: 'Equipment', starter: false, gateway: true, complete: true, ceremony: true },
  { name: 'Full-body Light Mat', category: 'Equipment', starter: false, gateway: false, complete: true, ceremony: true },
  { name: 'Recovery Equipment', category: 'Equipment', starter: false, gateway: false, complete: true, ceremony: false },
  { name: 'Diffraction Grating', category: 'Equipment', starter: false, gateway: 'partial', complete: true, ceremony: true },
  
  // Documentation
  { name: 'Research Journal', category: 'Documentation', starter: true, gateway: true, complete: true, ceremony: true },
  { name: 'Intention Card Deck', category: 'Documentation', starter: true, gateway: false, complete: true, ceremony: false },
  { name: 'Protocol Guide Access', category: 'Documentation', starter: false, gateway: true, complete: true, ceremony: true },
  
  // Ceremonial
  { name: 'Sacred Attire', category: 'Ceremonial', starter: false, gateway: true, complete: true, ceremony: true },
  { name: 'Incense & Grounding', category: 'Ceremonial', starter: true, gateway: false, complete: false, ceremony: false },
  { name: 'Grounding Stone', category: 'Ceremonial', starter: true, gateway: false, complete: false, ceremony: false },
  { name: 'Quartz Roller', category: 'Ceremonial', starter: false, gateway: true, complete: false, ceremony: false },
  
  // Experience
  { name: 'Legal Ceremony Access', category: 'Experience', starter: false, gateway: false, complete: false, ceremony: true },
  { name: 'Integration Support', category: 'Experience', starter: false, gateway: false, complete: false, ceremony: true },
  { name: 'Priority Community Access', category: 'Experience', starter: false, gateway: false, complete: true, ceremony: true },
  { name: 'Direct Researcher Support', category: 'Experience', starter: false, gateway: false, complete: false, ceremony: true },
];

const renderValue = (value: FeatureValue) => {
  if (value === true) {
    return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
  }
  if (value === false) {
    return <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />;
  }
  if (value === 'partial') {
    return <Minus className="w-5 h-5 text-amber-500 mx-auto" />;
  }
  return <span className="text-sm text-muted-foreground">{value}</span>;
};

export const BundleComparisonTable = () => {
  const navigate = useNavigate();
  
  const categories = [...new Set(features.map(f => f.category))];

  return (
    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-[200px] text-foreground font-bold bg-card">Features</TableHead>
            {bundles.map((bundle) => (
              <TableHead key={bundle.id} className="text-center min-w-[120px] bg-card">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-foreground font-bold text-sm">{bundle.name}</span>
                  {bundle.popular && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      Popular
                    </Badge>
                  )}
                  <span className="text-primary font-bold">${bundle.price}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <>
              <TableRow key={`cat-${category}`} className="bg-muted/30 hover:bg-muted/30 border-border/50">
                <TableCell colSpan={5} className="font-semibold text-muted-foreground text-xs uppercase tracking-wider py-2">
                  {category}
                </TableCell>
              </TableRow>
              {features
                .filter(f => f.category === category)
                .map((feature) => (
                  <TableRow key={feature.name} className="border-border/30 hover:bg-muted/10">
                    <TableCell className="font-medium text-sm">{feature.name}</TableCell>
                    <TableCell className="text-center">{renderValue(feature.starter)}</TableCell>
                    <TableCell className="text-center">{renderValue(feature.gateway)}</TableCell>
                    <TableCell className="text-center">{renderValue(feature.complete)}</TableCell>
                    <TableCell className="text-center">{renderValue(feature.ceremony)}</TableCell>
                  </TableRow>
                ))}
            </>
          ))}
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableCell></TableCell>
            {bundles.map((bundle) => (
              <TableCell key={bundle.id} className="text-center py-4">
                <Button
                  size="sm"
                  variant={bundle.popular ? 'default' : 'outline'}
                  className="rounded-full text-xs"
                  onClick={() => navigate(`/bundles/${bundle.id}`)}
                >
                  View Bundle
                </Button>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
