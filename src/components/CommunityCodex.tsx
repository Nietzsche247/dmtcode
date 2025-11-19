import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Target, Users, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

const glyphs = [
  {
    id: 1,
    symbol: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=100&h=100&fit=crop",
    agreement: 87,
    description: "Katakana-like symbol, appears across multiple surfaces",
    upvotes: 243,
    tags: [
      { name: "Wall", votes: 156 },
      { name: "Skin", votes: 89 },
      { name: "Outdoors", votes: 67 },
    ]
  },
  {
    id: 2,
    symbol: "https://images.unsplash.com/photo-1635070041409-e63e783e6f1f?w=100&h=100&fit=crop",
    agreement: 76,
    description: "Rotating geometric pattern, consistent reports",
    upvotes: 198,
    tags: [
      { name: "Wall", votes: 134 },
      { name: "Bathroom", votes: 56 },
      { name: "Grass", votes: 43 },
    ]
  },
  {
    id: 3,
    symbol: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=100&h=100&fit=crop",
    agreement: 82,
    description: "Angular script formation, surface-independent",
    upvotes: 221,
    tags: [
      { name: "Skin", votes: 145 },
      { name: "Outdoors", votes: 98 },
      { name: "Wall", votes: 76 },
    ]
  },
];

export const CommunityCodex = () => {
  const [glyphVotes, setGlyphVotes] = useState<Record<number, number>>({});
  const [tagVotes, setTagVotes] = useState<Record<string, number>>({});

  const handleGlyphUpvote = (id: number) => {
    setGlyphVotes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handleTagUpvote = (glyphId: number, tagName: string) => {
    const key = `${glyphId}-${tagName}`;
    setTagVotes(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  };

  return (
    <section id="codex" className="relative py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            Reality's Living Code – Community-Verified Glyph Codex
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            30×30 px emoji-scale glyphs with upvoting and surface/environment tagging
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {glyphs.map((glyph) => (
            <Card key={glyph.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-[30px] h-[30px] bg-secondary/20 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={glyph.symbol} 
                      alt={`Glyph ${glyph.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{glyph.agreement}% Agreement</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 h-7 px-2"
                        onClick={() => handleGlyphUpvote(glyph.id)}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {glyph.upvotes + (glyphVotes[glyph.id] || 0)}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">{glyph.description}</p>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground font-semibold">Observed on:</div>
                  <div className="flex flex-wrap gap-2">
                    {glyph.tags.map((tag) => {
                      const tagKey = `${glyph.id}-${tag.name}`;
                      const currentVotes = tag.votes + (tagVotes[tagKey] || 0);
                      return (
                        <Button
                          key={tag.name}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 gap-1 text-xs"
                          onClick={() => handleTagUpvote(glyph.id, tag.name)}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {tag.name} ({currentVotes})
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center pt-8">
          <Button size="lg" className="glow-button">
            Upload Your Symbols
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Login required to upload and contribute to the codex
          </p>
        </div>
      </div>
    </section>
  );
};
