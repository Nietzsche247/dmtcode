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
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-secondary/30 border border-primary/30 rounded-lg p-4">
                  <img 
                    src="https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fc288309a-200d-40f9-b70b-59bc97165a44_1498x832.png"
                    alt="Katakana-style raining code symbols observed during DMT breakthrough experiences by 91% of replicators using 650nm red laser with diffraction grating"
                    className="w-full h-48 object-cover rounded"
                  />
                  <p className="text-center text-sm text-primary mt-2 font-semibold">91% agreement</p>
                  <p className="text-center text-xs text-muted-foreground">Katakana-style raining code</p>
                </div>
                <div className="bg-secondary/30 border border-primary/30 rounded-lg p-4">
                  <img 
                    src="https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F95a51b04-e3b9-4f4e-914f-af9e1be604f7_1362x864.png"
                    alt="Geometric entity script glyphs consistently reported across independent DMT replications with 88% agreement rate using Danny Goler's laser method"
                    className="w-full h-48 object-cover rounded"
                  />
                  <p className="text-center text-sm text-primary mt-2 font-semibold">88% agreement</p>
                  <p className="text-center text-xs text-muted-foreground">Geometric entity script</p>
                </div>
                <div className="bg-secondary/30 border border-primary/30 rounded-lg p-4">
                  <img 
                    src="https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ffb39c1a1-2ccb-4a64-96fb-04c1b2098fdf_2480x1634.jpeg"
                    alt="Rainbow tunnel of symbols and moving code patterns seen by 85% of DMT code experiment participants on various surfaces"
                    className="w-full h-48 object-cover rounded"
                  />
                  <p className="text-center text-sm text-primary mt-2 font-semibold">85% agreement</p>
                  <p className="text-center text-xs text-muted-foreground">Rainbow tunnel of symbols</p>
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
