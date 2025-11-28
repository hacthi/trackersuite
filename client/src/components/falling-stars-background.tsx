import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Star {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
  opacity: number;
}

export function FallingStarsBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate initial stars
    const generateStars = () => {
      const newStars: Star[] = [];
      for (let i = 0; i < 20; i++) {
        newStars.push({
          id: i,
          left: Math.random() * 100,
          animationDuration: 3 + Math.random() * 4, // 3-7 seconds
          size: 2 + Math.random() * 3, // 2-5px
          opacity: 0.3 + Math.random() * 0.7, // 0.3-1.0
        });
      }
      setStars(newStars);
    };

    generateStars();

    // Regenerate stars periodically to create continuous effect
    const interval = setInterval(generateStars, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className={cn(
            "absolute rounded-full bg-gradient-to-br from-white via-blue-200 to-indigo-300 dark:from-slate-100 dark:via-blue-200 dark:to-purple-300",
            "animate-falling-star shadow-sm"
          )}
          style={{
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDuration: `${star.animationDuration}s`,
            animationDelay: `${Math.random() * 2}s`,
            filter: 'blur(0.5px)',
            boxShadow: '0 0 6px rgba(147, 197, 253, 0.8), 0 0 12px rgba(147, 197, 253, 0.4)',
          }}
        />
      ))}
      
      {/* Additional twinkling stars for depth */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={`twinkle-${i}`}
          className="absolute rounded-full bg-white dark:bg-slate-200 animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '1px',
            height: '1px',
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            boxShadow: '0 0 3px rgba(255, 255, 255, 0.8)',
          }}
        />
      ))}
      
      {/* Ambient light effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-50/20 to-indigo-50/30 dark:from-transparent dark:via-slate-800/20 dark:to-indigo-900/30 pointer-events-none" />
    </div>
  );
}