import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    text: "First hit – sober speckle test passed, then on breakthrough I watched Japanese characters rain down the wall. Mind blown.",
    author: "Alex R.",
  },
  {
    text: "Chase Hughes was right. It's like pulling up the developer console of the universe.",
    author: "Sarah T.",
  },
  {
    text: "Repeated exactly with three friends in the same room – same symbols, same spot.",
    author: "Mike L.",
  },
  {
    text: "The consistency is what got me. Five separate sessions, different days, same exact patterns on my hand.",
    author: "Jordan K.",
  },
  {
    text: "I've been a skeptic my whole life. This experiment changed everything. The glyphs are real and they're consistent.",
    author: "Dr. Emma C.",
  },
];

export const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <h2 className="text-4xl md:text-5xl font-bold text-center">
          What Replicators Are Saying
        </h2>

        <div className="relative min-h-[250px] md:min-h-[200px]">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`absolute inset-0 p-8 md:p-12 bg-card border-border transition-all duration-700 ${
                index === currentIndex 
                  ? 'opacity-100 transform translate-y-0' 
                  : 'opacity-0 transform translate-y-4 pointer-events-none'
              }`}
            >
              <div className="space-y-6">
                <Quote className="w-10 h-10 text-primary" />
                <blockquote className="text-xl md:text-2xl font-light leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
                <p className="text-lg text-muted-foreground">— {testimonial.author}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary w-8' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
