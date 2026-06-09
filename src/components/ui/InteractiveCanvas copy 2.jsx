import React, { useEffect, useRef } from "react";

// Mathematical helper to calculate target coordinates for the card outline
const getCardTarget = (i, N, rect) => {
  const x = rect.left - 4;
  const y = rect.top - 4;
  const width = rect.width + 8;
  const height = rect.height + 8;

  const perimeter = 2 * (width + height);
  const dist = (i / N) * perimeter;

  let tx = x;
  let ty = y;

  if (dist < width) {
    tx = x + dist;
    ty = y;
  } else if (dist < width + height) {
    tx = x + width;
    ty = y + (dist - width);
  } else if (dist < 2 * width + height) {
    tx = x + width - (dist - width - height);
    ty = y + height;
  } else {
    tx = x;
    ty = y + height - (dist - 2 * width - height);
  }

  return { x: tx, y: ty };
};

// Mathematical helper to calculate target coordinates for the cursor swarm
const getSwarmTarget = (i, N, cx, cy, time) => {
  const ringIndex = i % 4; // 4 concentric rings
  const ringCount = Math.ceil(N / 4);
  const indexInRing = Math.floor(i / 4);

  // Nested nested rings layout
  const R = 15 + ringIndex * 13;
  // Alternate rotation direction per ring for gyroscope visual style
  const dir = ringIndex % 2 === 0 ? 1 : -1;
  const theta = (indexInRing / ringCount) * Math.PI * 2 + (time * 0.00085 * dir);

  return {
    x: cx + R * Math.cos(theta),
    y: cy + R * Math.sin(theta)
  };
};

// Enhanced green gradient color palette - rich, vibrant greens with luminosity
const GREEN_PALETTE = [
  "#6EE7B7", "#34D399", "#10B981", "#4ADE80", "#A3E635",
  "#86EFAC", "#22C55E", "#2DD4BF", "#059669", "#16A34A",
  "#48FF9E", "#B9FBC0", "#7CFF9E", "#3BE074", "#00D26A"
];

export const InteractiveCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    const maxParticles = 220; // Rich particle density for lush grain effect
    const mouse = { x: null, y: null };
    let activeProgress = 0; // Fades and morphs shapes on card hover
    let activeCardRect = null;

    // Viewport-wide canvas sizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    class Particle {
      constructor(index) {
        this.index = index;
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        // Varied particle sizes for organic grain texture
        this.size = Math.random() * 1.8 + 0.8;
        // Assign a rich green from palette with slight variation
        const colorIdx = Math.floor(Math.random() * GREEN_PALETTE.length);
        this.baseColor = GREEN_PALETTE[colorIdx];
        this.secondaryColor = GREEN_PALETTE[(colorIdx + 5) % GREEN_PALETTE.length];
        this.phase = Math.random() * Math.PI * 2;
        this.glowIntensity = 0.5 + Math.random() * 0.6;
        this.pulseSpeed = 0.005 + Math.random() * 0.008;
      }

      draw(ctx, time) {
        ctx.save();

        // Create radial gradient for each particle -> gem-like grain appearance
        const gradient = ctx.createRadialGradient(
          this.x - 1, this.y - 1, 0.5,
          this.x, this.y, this.size * 1.3
        );

        // Dynamic brightness that pulses gently
        const pulse = 0.6 + Math.sin(time * this.pulseSpeed + this.phase) * 0.3;

        gradient.addColorStop(0, `rgba(180, 255, 160, ${0.8 + pulse * 0.2})`);
        gradient.addColorStop(0.5, this.baseColor);
        gradient.addColorStop(1, `rgba(20, 100, 30, 0.6)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;

        // Luminous neon green glow - enhanced for "gradient grain" radiance
        ctx.shadowBlur = 8 + Math.sin(time * 0.012 + this.phase) * 3;
        ctx.shadowColor = `rgba(74, 222, 128, ${0.7 + Math.sin(time * 0.01 + this.phase) * 0.25})`;
        ctx.fill();

        // Tiny bright core for extra sparkle
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(this.x - 0.4, this.y - 0.4, this.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 255, 190, 0.95)`;
        ctx.fill();

        ctx.restore();
      }

      update(cx, cy, rect, progress, time) {
        // Calculate the two target shapes
        const targetSwarm = getSwarmTarget(this.index, maxParticles, cx, cy, time);

        let tx = targetSwarm.x;
        let ty = targetSwarm.y;

        if (rect && progress > 0.01) {
          const targetCard = getCardTarget(this.index, maxParticles, rect);
          // Interpolate target from swarm cursor to card outline
          tx = targetSwarm.x + (targetCard.x - targetSwarm.x) * progress;
          ty = targetSwarm.y + (targetCard.y - targetSwarm.y) * progress;
        }

        // Add soft organic drift to make grains feel "alive" - enhanced jitter
        const jitterX = Math.sin(time * 0.0055 + this.phase) * 1.3;
        const jitterY = Math.cos(time * 0.0052 + this.phase * 1.1) * 1.2;

        // Smooth easing towards targets
        this.x += (tx + jitterX - this.x) * 0.09;
        this.y += (ty + jitterY - this.y) * 0.09;
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(i));
      }
    };
    init();

    const animate = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Default target coords at center of viewport if mouse hasn't entered yet
      const activeX = mouse.x !== null ? mouse.x : window.innerWidth / 2;
      const activeY = mouse.y !== null ? mouse.y : window.innerHeight / 2;

      // Track hovered card under viewport coordinates
      let cardEl = null;
      if (mouse.x !== null && mouse.y !== null) {
        const hoverEl = document.elementFromPoint(mouse.x, mouse.y);
        cardEl = hoverEl ? hoverEl.closest(".group") : null;
      }

      if (cardEl) {
        activeCardRect = cardEl.getBoundingClientRect();
        activeProgress += (1 - activeProgress) * 0.08;
      } else {
        activeProgress += (0 - activeProgress) * 0.08;
        if (activeProgress < 0.01) {
          activeCardRect = null;
        }
      }

      // Draw all particles with enhanced green gradient styling
      particles.forEach((p) => {
        p.update(activeX, activeY, activeCardRect, activeProgress, time || 0);
        p.draw(ctx, time || 0);
      });

      // Add subtle ambient glow around cursor when not hovering cards
      if (mouse.x !== null && mouse.y !== null && activeProgress < 0.2) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const auraGrad = ctx.createRadialGradient(mouse.x, mouse.y, 5, mouse.x, mouse.y, 55);
        auraGrad.addColorStop(0, "rgba(74, 222, 128, 0.08)");
        auraGrad.addColorStop(0.5, "rgba(34, 197, 94, 0.04)");
        auraGrad.addColorStop(1, "rgba(20, 100, 40, 0)");
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();
        ctx.restore();
      }

      // Occasional shimmer particles for extra "gradient grain" magic
      if (Math.random() < 0.08) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 8; i++) {
          const sx = (Math.sin(time * 0.02 + i) * 500 + time * 0.5) % canvas.width;
          const sy = (Math.cos(time * 0.017 + i * 2) * 400 + time * 0.3) % canvas.height;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 255, 130, 0.6)`;
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate(0);

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-30"
    />
  );
};

export default InteractiveCanvas;