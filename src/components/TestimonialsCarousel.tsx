import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { useModeStore } from '@/stores/modeStore';

const testimonials = [
  {
    text: "First hit: sober speckle test passed, then on breakthrough I watched Japanese characters rain down the wall.",
    author: "Alex R.",
  },
  {
    text: "Chase Hughes was right. It's like pulling up the developer console of the universe.",
    author: "Sarah T.",
  },
  {
    text: "Repeated exactly with three friends in the same room: same symbols, same spot.",
    author: "Mike L.",
  },
  {
    text: "The consistency is what got me. Five separate sessions, different days, same exact patterns.",
    author: "Jordan K.",
  },
  {
    text: "I've been a skeptic my whole life. This experiment changed everything.",
    author: "Dr. Emma C.",
  },
];

export const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { mode } = useModeStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Only show testimonials in Explorer mode
  if (mode === 'research') {
    return null;
  }

  return (
    <section className="relative py-24 px-4 border-t border-border/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-medium tracking-wide uppercase mb-4">Community</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            What Replicators Say
          </h2>
        </div>

        <div className="relative min-h-[200px]">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`absolute inset-0 p-8 md:p-12 transition-all duration-500 ${
                index === currentIndex 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <div className="space-y-6 text-center">
                <Quote className="w-8 h-8 text-primary mx-auto" />
                <blockquote className="text-xl md:text-2xl font-light leading-relaxed text-foreground">
                  "{testimonial.text}"
                </blockquote>
                <p className="text-muted-foreground font-light">— {testimonial.author}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-primary w-8' : 'bg-muted w-2 hover:bg-muted-foreground'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
