import { useEffect, useRef } from "react";

export function FallingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Star properties
    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      twinkle: number;
      twinkleSpeed: number;
    }

    const stars: Star[] = [];
    const numStars = 50;

    // Create stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        // Update position
        star.y += star.speed;
        star.twinkle += star.twinkleSpeed;

        // Reset star when it goes off screen
        if (star.y > canvas.height) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }

        // Calculate twinkling effect
        const twinkleOpacity = star.opacity + Math.sin(star.twinkle) * 0.3;

        // Draw star with glow effect
        const gradient = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          star.size * 3
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${twinkleOpacity})`);
        gradient.addColorStop(0.3, `rgba(174, 205, 255, ${twinkleOpacity * 0.8})`);
        gradient.addColorStop(1, `rgba(174, 205, 255, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw central bright point
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60 dark:opacity-40"
      style={{
        background: "transparent",
      }}
    />
  );
}