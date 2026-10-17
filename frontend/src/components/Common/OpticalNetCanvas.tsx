import React, { useEffect, useRef } from 'react';

interface OpticalNetCanvasProps {
  className?: string;
  style?: React.CSSProperties;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

interface FloatingMistParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  alpha: number;
  color: string;
}

export const OpticalNetCanvas: React.FC<OpticalNetCanvasProps> = ({ className = '', style }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    // Mouse tracking with gentle fluid lerp
    const mouse = {
      x: width * 0.72,
      y: height * 0.42,
      targetX: width * 0.72,
      targetY: height * 0.42,
      active: false,
    };

    // User click pebble ripples
    const clickRipples: ClickRipple[] = [];

    // Subtle background optical particles
    const MIST_COUNT = 20;
    const mistParticles: FloatingMistParticle[] = [];
    const mistColors = ['#00F0FF', '#1E9AA8', '#6C5CE7', '#C2408E', '#FFFFFF'];
    for (let i = 0; i < MIST_COUNT; i++) {
      mistParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: 1.0 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.12 + Math.random() * 0.28,
        color: mistColors[Math.floor(Math.random() * mistColors.length)],
      });
    }

    // High-DPI support
    const handleResize = () => {
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = width * 0.72;
      mouse.targetY = height * 0.42;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Spawn perfect circular pebble ripples
      clickRipples.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.min(width, height) * 0.55,
        alpha: 0.85,
        speed: 3.2,
        color: '#00F0FF',
      });
      setTimeout(() => {
        clickRipples.push({
          x: clickX,
          y: clickY,
          radius: 0,
          maxRadius: Math.min(width, height) * 0.45,
          alpha: 0.65,
          speed: 2.6,
          color: '#6C5CE7',
        });
      }, 120);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    // Number of perfectly circular water wave crests spreading apart
    const WAVE_COUNT = 5;
    // Duration in seconds for a wave to spread from center origin to outer dissipation
    const SPREAD_PERIOD = 8.5;

    // Color gradient across the outward spreading water wave lifecycle
    const getWaveColor = (phase: number) => {
      if (phase < 0.28) {
        // Core / Near-center: Radiant Electric Cyan & Opto Aqua
        return {
          stroke: '#00F0FF',
          glow: 'rgba(0, 240, 255, 0.45)',
          caustic: 'rgba(30, 154, 168, 0.35)',
        };
      } else if (phase < 0.55) {
        // Mid-spreading: Vibrant Ocean Azure
        return {
          stroke: '#3B82F6',
          glow: 'rgba(59, 130, 246, 0.45)',
          caustic: 'rgba(37, 99, 235, 0.32)',
        };
      } else if (phase < 0.82) {
        // Wide spreading: Lens Violet
        return {
          stroke: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.42)',
          caustic: 'rgba(108, 92, 231, 0.28)',
        };
      } else {
        // Horizon dissipation: Prismatic Orchid Magenta
        return {
          stroke: '#C2408E',
          glow: 'rgba(194, 64, 142, 0.35)',
          caustic: 'rgba(217, 70, 239, 0.22)',
        };
      }
    };

    const startTime = performance.now();

    const render = (now: number) => {
      const timeSec = (now - startTime) * 0.001;

      // Smooth gentle mouse tracking for depth parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      ctx.clearRect(0, 0, width, height);

      // Water ripple epicenter (aligned with brand & layout)
      const baseCenterX = width * 0.72;
      const baseCenterY = height * 0.42;

      // Subtle parallax displacement
      const parallaxX = (mouse.x - baseCenterX) * 0.06;
      const parallaxY = (mouse.y - baseCenterY) * 0.06;
      const originX = baseCenterX + parallaxX;
      const originY = baseCenterY + parallaxY;

      // Wave expansion boundaries
      const minRadius = 4;
      const maxRadius = Math.min(width * 0.68, height * 0.78, 480);

      // =========================================================================
      // 1. SUBTLE FLOATING PARTICLES
      // =========================================================================
      mistParticles.forEach((p) => {
        p.x += p.vx + Math.sin(timeSec * 1.0 + p.phase) * 0.15;
        p.y += p.vy + Math.cos(timeSec * 0.8 + p.phase) * 0.15;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        const pulseR = p.radius * (1 + 0.2 * Math.sin(timeSec * 2.0 + p.phase));
        ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(timeSec * 1.5 + p.phase));
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1.0;

      // =========================================================================
      // 2. RADIAL AMBIENT WATER DEPTH AURA
      // =========================================================================
      const auraGrad = ctx.createRadialGradient(originX, originY, 4, originX, originY, maxRadius * 0.95);
      auraGrad.addColorStop(0, 'rgba(0, 240, 255, 0.10)');
      auraGrad.addColorStop(0.3, 'rgba(30, 154, 168, 0.06)');
      auraGrad.addColorStop(0.65, 'rgba(108, 92, 231, 0.04)');
      auraGrad.addColorStop(1, 'rgba(20, 33, 61, 0)');

      ctx.beginPath();
      ctx.arc(originX, originY, maxRadius * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();

      // =========================================================================
      // 3. PERFECT CIRCLE WATER WAVES SPREADING APART
      // =========================================================================
      const waves = [];
      for (let i = 0; i < WAVE_COUNT; i++) {
        // Continuous outward phase: 0 (birth at center) -> 1 (dissolved at max radius)
        const wavePhase = ((timeSec / SPREAD_PERIOD) + i / WAVE_COUNT) % 1.0;
        waves.push({ index: i, phase: wavePhase });
      }

      // Sort by phase descending (draw outer larger waves first so inner waves stack cleanly)
      waves.sort((a, b) => b.phase - a.phase);

      for (const wave of waves) {
        const { phase } = wave;

        // Fluid outward acceleration: waves naturally spread apart as they expand
        const spreadProgress = Math.pow(phase, 0.88);
        const radius = minRadius + spreadProgress * (maxRadius - minRadius);

        // Opacity lifecycle:
        // 0.00 -> 0.12: Smooth emergence from center
        // 0.12 -> 0.65: Full luminous wave crest
        // 0.65 -> 1.00: Gentle attenuation & dissolution into ambient water
        let alpha = 0;
        if (phase < 0.12) {
          alpha = phase / 0.12;
        } else if (phase < 0.65) {
          alpha = 1.0;
        } else {
          alpha = Math.max(0, 1.0 - (phase - 0.65) / 0.35);
        }

        if (alpha <= 0.01) continue;

        const colorCfg = getWaveColor(phase);
        const ringAlpha = alpha * 0.85;

        ctx.save();

        // 100% Mathematically Perfect Circle (No melting, no vertex deformation)
        ctx.beginPath();
        ctx.arc(originX, originY, radius, 0, Math.PI * 2);

        // Pass 1: Soft diffuse luminous caustic glow
        ctx.shadowColor = colorCfg.glow;
        ctx.shadowBlur = 10 + 6 * (1 - phase);
        ctx.strokeStyle = colorCfg.caustic;
        ctx.lineWidth = Math.max(1.4, 3.0 * (1 - phase * 0.45));
        ctx.globalAlpha = ringAlpha * 0.55;
        ctx.stroke();

        // Pass 2: Crisp, pristine wave crest highlight line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = colorCfg.stroke;
        ctx.lineWidth = Math.max(0.85, 1.8 * (1 - phase * 0.4));
        ctx.globalAlpha = ringAlpha;
        ctx.stroke();

        ctx.restore();
      }

      // =========================================================================
      // 4. USER CLICK PEBBLE RIPPLES (PERFECT CIRCLES)
      // =========================================================================
      for (let i = clickRipples.length - 1; i >= 0; i--) {
        const rip = clickRipples[i];
        rip.radius += rip.speed;
        rip.alpha *= 0.965;

        if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
          clickRipples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = rip.color;
        ctx.shadowColor = rip.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = Math.max(0.8, 1.8 * rip.alpha);
        ctx.globalAlpha = rip.alpha;
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`optical-net-canvas-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'auto',
        cursor: 'pointer',
        zIndex: 1,
        ...style,
      }}
      title="Water Waves Spreading Apart — Click anywhere to send ripple waves"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default OpticalNetCanvas;
