import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, TrendingUp, Calendar } from 'lucide-react';

export const CommunityCodex = () => {
  return (
    <section className="relative py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            The Living DMT Scripture
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Community-Verified Glyph Codex – Help build the first crowdsourced dictionary of Reality's Code
          </p>
        </div>

        <Card className="p-8 md:p-12 bg-card border-primary/30 glow-border">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/50 rounded-full">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Coming Q1 2026 – Early Access for Subscribers</span>
              </div>
              
              <p className="text-lg leading-relaxed max-w-2xl mx-auto">
                Upload your observed symbols (photo/drawing + surface + dose notes) and help us map the most commonly reported glyphs across thousands of replicators worldwide
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3 p-6 bg-background/50 rounded-lg border border-border">
                <Upload className="w-10 h-10 text-primary mx-auto" />
                <h3 className="font-semibold text-lg">Upload Your Symbols</h3>
                <p className="text-sm text-muted-foreground">
                  Photo, drawing, or detailed description with context (surface type, timing, dosage notes)
                </p>
              </div>

              <div className="text-center space-y-3 p-6 bg-background/50 rounded-lg border border-border">
                <TrendingUp className="w-10 h-10 text-primary mx-auto" />
                <h3 className="font-semibold text-lg">Community Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Upvote/downvote system to identify the most commonly observed patterns across experiences
                </p>
              </div>

              <div className="text-center space-y-3 p-6 bg-background/50 rounded-lg border border-border">
                <div className="text-3xl font-bold text-primary mx-auto">87%</div>
                <h3 className="font-semibold text-lg">Agreement Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  See which glyphs are most consistently reported across independent replications
                </p>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <div className="bg-secondary/30 border border-primary/30 rounded-lg p-6">
                <p className="text-center text-sm text-muted-foreground">
                  Example: "87% of replicators see this exact sequence on skin surfaces"
                </p>
                <div className="mt-4 flex justify-center gap-4 flex-wrap">
                  <div className="w-16 h-16 border-2 border-primary/50 rounded flex items-center justify-center text-2xl font-bold">
                    Ψ
                  </div>
                  <div className="w-16 h-16 border-2 border-primary/50 rounded flex items-center justify-center text-2xl font-bold">
                    ⟁
                  </div>
                  <div className="w-16 h-16 border-2 border-primary/50 rounded flex items-center justify-center text-2xl font-bold">
                    ⧈
                  </div>
                  <div className="w-16 h-16 border-2 border-primary/50 rounded flex items-center justify-center text-2xl font-bold">
                    ⊗
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary"
                >
                  Join Waitlist for Early Access
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
