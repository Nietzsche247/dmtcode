import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const seedTheories = [
  {
    id: 1,
    title: "Simulation Source Code Theory",
    author: "Community Aggregate",
    summary: "Hypothesis that glyphs represent the underlying code or programming language of our simulated reality. Proponents cite consistency across independent observers and surface-independence as evidence that these symbols exist 'behind' physical matter rather than being projected onto it.",
    supportPercent: 64,
    upvotes: 2847,
    comments: 412,
    tags: ["simulation", "programming", "consistency"],
  },
  {
    id: 2,
    title: "Cross-Dimensional Communication Patterns",
    author: "Community Aggregate",
    summary: "Theory proposing glyphs are a form of communication or written language from intelligences existing in dimensions beyond our three spatial dimensions. Supported by reports of post-session integration tools 'showing' or 'teaching' the symbols, and apparent intelligent responses to observer attention.",
    supportPercent: 52,
    upvotes: 1923,
    comments: 289,
    tags: ["communication", "hyperdimensional", "patterns"],
  },
  {
    id: 3,
    title: "Enhanced Laser Speckle Pareidolia + Neurovisual Amplification",
    author: "Community Aggregate",
    summary: "Skeptical hypothesis suggesting glyphs emerge from the brain's pattern recognition systems interpreting random laser speckle patterns. Challenges include explaining surface-independence, inter-observer consistency, and why symbols appear to respond to mental focus.",
    supportPercent: 19,
    upvotes: 891,
    comments: 178,
    tags: ["neuroscience", "skeptical", "pareidolia"],
  },
  {
    id: 4,
    title: "Ancient or Human-Independent Script",
    author: "Community Aggregate",
    summary: "Theory that glyphs may represent an ancient writing system or script that exists independently of human creation. Consistency across observers suggests accessing a shared visual/symbolic substrate that predates modern human consciousness.",
    supportPercent: 41,
    upvotes: 1654,
    comments: 321,
    tags: ["ancient", "script", "archeology"],
  },
  {
    id: 5,
    title: "Quantum Consciousness Interface",
    author: "Community Aggregate",
    summary: "Theory that DMT allows perception of quantum-level information structures normally hidden from consciousness. Glyphs may represent wavefunction patterns, entanglement networks, or other quantum phenomena made visible through altered neurochemistry.",
    supportPercent: 37,
    upvotes: 1432,
    comments: 256,
    tags: ["quantum", "physics", "consciousness"],
  },
];

export const TheoriesSection = () => {
  const [theories] = useState(seedTheories);

  return (
    <section id="theories" className="relative py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            Community Theories Blog
          </h2>
          <h3 className="text-2xl font-semibold text-primary">
            Structured Analysis of Symbol Reproducibility
          </h3>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            Community-submitted explanatory theories for reported visual symbols. Logged-in users can post. Each theory scored by replication rate, inter-observer agreement, and surface-independence to assess reproducibility.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-primary pt-2">
            <TrendingUp className="w-4 h-4" />
            <span>Based on 3,247 independent replicator reports</span>
          </div>
        </div>

        <div className="grid gap-6">
          {theories.map((theory) => (
            <Card key={theory.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-bold">{theory.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Aggregated by {theory.author}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-3xl font-bold text-primary">
                      {theory.supportPercent}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Community Support
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {theory.summary}
                </p>

                <div className="flex flex-wrap gap-2">
                  {theory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs bg-secondary/50 text-secondary-foreground rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    {theory.upvotes.toLocaleString()}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {theory.comments} comments
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center pt-8">
          <Button size="lg" className="glow-button">
            Submit Your Theory (Login Required)
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            All submissions are moderated for scientific rigor and respectful discourse
          </p>
        </div>
      </div>
    </section>
  );
};
