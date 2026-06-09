import React, { useEffect, useRef } from "react";

// Spiral burst layout — particles radiate outward in fibonacci-like arms
const getSpiralTarget = (i, N, cx, cy, time) => {
  const goldenAngle = 2.399963; // golden ratio angle in radians
  const r = Math.sqrt(i / N) * 60;
  const theta = i * goldenAngle + time * 0.0004;
  return {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
  };
};

// Card border trace — unchanged functionally
const getCardTarget = (i, N, rect) => {
  const x = rect.left - 4;
  const y = rect.top - 4;
  const width = rect.width + 8;
  const height = rect.height + 8;
  const perimeter = 2 * (width + height);
  const dist = (i / N) * perimeter;
  let tx = x, ty = y;
  if (dist < width) {
    tx = x + dist; ty = y;
  } else if (dist < width + height) {
    tx = x + width; ty = y + (dist - width);
  } else if (dist < 2 * width + height) {
    tx = x + width - (dist - width - height); ty = y + height;
  } else {
    tx = x; ty = y + height - (dist - 2 * width - height);
  }
  return { x: tx, y: ty };
};

// Cream + dark green palette
const PALETTE = [
  "#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D",
  "#42e842ff", "#33f802ff", "#bbf367ff", "#081C15", "#3A7D44",
  "#4E9B57", "#6AB274", "#F5F0E8", "#EAE4D4", "#2D6A4F",
];

const hexToRgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

export const InteractiveCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    const maxParticles = 180;
    const mouse = { x: null, y: null };
    let activeProgress = 0;
    let activeCardRect = null;

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
        this.size = Math.random() * 1.6 + 0.5;
        const colorIdx = Math.floor(Math.random() * PALETTE.length);
        this.color = PALETTE[colorIdx];
        this.rgb = hexToRgb(this.color);
        this.phase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.003 + Math.random() * 0.006;
      }

      draw(ctx, time) {
        ctx.save();
        const pulse = 0.6 + Math.sin(time * this.pulseSpeed + this.phase) * 0.4;
        const { r, g, b } = this.rgb;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.8 + pulse * 0.2})`;
        ctx.shadowBlur = 0;
        ctx.fill();

        // Cream core
        ctx.beginPath();
        ctx.arc(this.x - 0.3, this.y - 0.3, this.size * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,240,228,0.85)`;
        ctx.fill();

        ctx.restore();
      }

      update(cx, cy, rect, progress, time) {
        const targetSpiral = getSpiralTarget(this.index, maxParticles, cx, cy, time);

        let tx = targetSpiral.x;
        let ty = targetSpiral.y;

        if (rect && progress > 0.01) {
          const targetCard = getCardTarget(this.index, maxParticles, rect);
          tx = targetSpiral.x + (targetCard.x - targetSpiral.x) * progress;
          ty = targetSpiral.y + (targetCard.y - targetSpiral.y) * progress;
        }

        const jitterX = Math.sin(time * 0.005 + this.phase) * 0.8;
        const jitterY = Math.cos(time * 0.0048 + this.phase * 1.1) * 0.8;

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

      const activeX = mouse.x !== null ? mouse.x : window.innerWidth / 2;
      const activeY = mouse.y !== null ? mouse.y : window.innerHeight / 2;

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
        if (activeProgress < 0.01) activeCardRect = null;
      }

      particles.forEach((p) => {
        p.update(activeX, activeY, activeCardRect, activeProgress, time || 0);
        p.draw(ctx, time || 0);
      });

      // Subtle dark green cursor aura
      if (mouse.x !== null && mouse.y !== null && activeProgress < 0.2) {
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        const auraGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 4,
          mouse.x, mouse.y, 55
        );
        auraGrad.addColorStop(0, "rgba(27,67,50,0.06)");
        auraGrad.addColorStop(0.5, "rgba(45,106,79,0.03)");
        auraGrad.addColorStop(1, "rgba(27,67,50,0)");
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();
        ctx.restore();
      }

      // Ambient shimmer
      if (Math.random() < 0.05) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        for (let i = 0; i < 5; i++) {
          const sx = (Math.sin(time * 0.019 + i * 1.1) * 450 + time * 0.4) % canvas.width;
          const sy = (Math.cos(time * 0.015 + i * 1.8) * 350 + time * 0.25) % canvas.height;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(82,183,136,0.5)`;
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