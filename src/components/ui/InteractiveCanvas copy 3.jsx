import React, { useEffect, useRef } from "react";

const getSpiralTarget = (i, N, cx, cy, time) => {
  const goldenAngle = 2.399963;
  const r = Math.sqrt(i / N) * 160;
  const theta = i * goldenAngle + time * 0.0003;
  return {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
  };
};

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

const hexToRgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

// Green gradient across the spines — dark at root, lighter at tips
const getColor = (ratio) => {
  // ratio 0 = center (dark forest), 1 = tip (light sage)
  const stops = [
    { r: 8, g: 28, b: 21 }, // #081C15
    { r: 27, g: 67, b: 50 }, // #1B4332
    { r: 45, g: 106, b: 79 }, // #2D6A4F
    { r: 64, g: 145, b: 108 }, // #40916C
    { r: 82, g: 183, b: 136 }, // #52B788
    { r: 116, g: 198, b: 157 }, // #74C69D
    { r: 149, g: 213, b: 178 }, // #95D5B2
    { r: 183, g: 228, b: 199 }, // #B7E4C7
  ];
  const scaled = ratio * (stops.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, stops.length - 1);
  const t = scaled - lo;
  const a = stops[lo], b = stops[hi];
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
};

export const InteractiveCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    const maxParticles = 120;
    const mouse = { x: null, y: null };
    let activeProgress = 0;
    let activeCardRect = null;
    // Fixed origin — center bottom-ish, like the reference
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight * 0.72;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      originX = window.innerWidth / 2;
      originY = window.innerHeight * 0.72;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    class Particle {
      constructor(index) {
        this.index = index;
        this.x = originX;
        this.y = originY;
        this.phase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.001 + Math.random() * 0.002;
        // Ratio of how far along the gradient this particle sits (by index)
        this.colorRatio = index / maxParticles;
      }

      draw(ctx, ox, oy, time) {
        ctx.save();
        const pulse = 0.85 + Math.sin(time * this.pulseSpeed + this.phase) * 0.15;
        const { r, g, b } = getColor(this.colorRatio);

        const dist = Math.hypot(this.x - ox, this.y - oy);
        const maxDist = 200;
        const lineAlpha = Math.min(dist / maxDist, 1) * 0.55 * pulse;
        const dotAlpha = 0.7 * pulse;

        // Line from origin to particle
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${lineAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Dot at tip
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${dotAlpha})`;
        ctx.fill();

        // Tiny bright core on dot
        ctx.beginPath();
        ctx.arc(this.x - 0.4, this.y - 0.4, 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,255,235,0.8)`;
        ctx.fill();

        ctx.restore();
      }

      update(ox, oy, rect, progress, time) {
        const targetSpiral = getSpiralTarget(this.index, maxParticles, ox, oy, time);

        let tx = targetSpiral.x;
        let ty = targetSpiral.y;

        if (rect && progress > 0.01) {
          const targetCard = getCardTarget(this.index, maxParticles, rect);
          tx = targetSpiral.x + (targetCard.x - targetSpiral.x) * progress;
          ty = targetSpiral.y + (targetCard.y - targetSpiral.y) * progress;
        }

        const jitterX = Math.sin(time * 0.004 + this.phase) * 0.5;
        const jitterY = Math.cos(time * 0.0038 + this.phase * 1.1) * 0.5;

        this.x += (tx + jitterX - this.x) * 0.07;
        this.y += (ty + jitterY - this.y) * 0.07;
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

      // Origin follows mouse loosely, defaults to center-bottom
      const targetOX = mouse.x !== null ? mouse.x : window.innerWidth / 2;
      const targetOY = mouse.y !== null ? mouse.y : window.innerHeight * 0.72;
      originX += (targetOX - originX) * 0.06;
      originY += (targetOY - originY) * 0.06;

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
        p.update(originX, originY, activeCardRect, activeProgress, time || 0);
        p.draw(ctx, originX, originY, time || 0);
      });

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