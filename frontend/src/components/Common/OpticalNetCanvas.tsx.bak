import React, { useEffect, useRef, useState } from 'react';

interface OpticalNetCanvasProps {
  className?: string;
  style?: React.CSSProperties;
}

interface NodePoint {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  ringIndex: number;
  angleIndex: number;
  highlight: number;
}

interface Photon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export const OpticalNetCanvas: React.FC<OpticalNetCanvasProps> = ({ className = '', style }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Status for tooltip or subtle hint
  const [interactiveHint, setInteractiveHint] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    // Track mouse with smooth damped physics (lerp)
    const mouse = {
      x: width * 0.7,
      y: height * 0.4,
      targetX: width * 0.7,
      targetY: height * 0.4,
      vx: 0,
      vy: 0,
      active: false,
      speed: 0,
    };

    // Click wave trigger
    let clickImpulse = 0;
    let clickX = width * 0.7;
    let clickY = height * 0.4;

    // Optical Ring Parameters
    const RING_COUNT = 5;
    const SPOKE_COUNT = 18; // 18 optical meridians (every 20 degrees, like clinical refraction axes)
    const RING_COLORS = [
      { stroke: '#1E9AA8', glow: 'rgba(30, 154, 168, 0.4)', baseR: 0.16 }, // Optical Teal (Inner)
      { stroke: '#2563EB', glow: 'rgba(37, 99, 235, 0.35)', baseR: 0.32 }, // Electric Blue
      { stroke: '#6C5CE7', glow: 'rgba(108, 92, 231, 0.38)', baseR: 0.50 }, // Lens Violet
      { stroke: '#C2408E', glow: 'rgba(194, 64, 142, 0.35)', baseR: 0.70 }, // Prism Magenta
      { stroke: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.28)', baseR: 0.92 }, // Pure Caustic Wave (Outer)
    ];

    // Background floating optical photons
    const PHOTON_COUNT = 24;
    const photons: Photon[] = [];
    const photonPalette = ['#1E9AA8', '#6C5CE7', '#C2408E', '#FFFFFF'];
    for (let i = 0; i < PHOTON_COUNT; i++) {
      photons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: 1.2 + Math.random() * 2.2,
        alpha: 0.15 + Math.random() * 0.35,
        color: photonPalette[Math.floor(Math.random() * photonPalette.length)],
      });
    }

    // Resize Handler with high DPI support
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

    // Mouse movement listener on hero canvas
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      // Gently return to natural balance anchor
      mouse.targetX = width * 0.75;
      mouse.targetY = height * 0.42;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      clickX = e.clientX - rect.left;
      clickY = e.clientY - rect.top;
      clickImpulse = 1.0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    // Animation Timing
    // Total cycle duration: ~8.0 seconds
    // 0.0s -> 3.2s: Fully Expanded & Breathing with net
    // 3.2s -> 5.2s: Contracting / Gathering all circles together to core (2.0s)
    // 5.2s -> 5.7s: Focal point bloom / pulse (0.5s)
    // 5.7s -> 8.0s: Elastic explosion / Expansion with interconnected net (2.3s)
    const CYCLE_DURATION = 8000;
    const startTime = performance.now();

    // Easing Helpers
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const easeOutElastic = (t: number) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    };

    const easeOutBack = (t: number) => {
      const c1 = 1.5;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    // Render Loop
    const render = (now: number) => {
      const elapsed = (now - startTime) % CYCLE_DURATION;
      const timeSec = now * 0.001;

      // Smooth mouse lerping with inertial dampening
      const prevX = mouse.x;
      const prevY = mouse.y;
      mouse.x += (mouse.targetX - mouse.x) * 0.068;
      mouse.y += (mouse.targetY - mouse.y) * 0.068;
      mouse.speed = Math.hypot(mouse.x - prevX, mouse.y - prevY);

      if (clickImpulse > 0) {
        clickImpulse = Math.max(0, clickImpulse - 0.025);
      }

      ctx.clearRect(0, 0, width, height);

      // Base optical anchor center (behind the right side of hero, responsive)
      const baseCenterX = width * 0.74;
      const baseCenterY = height * 0.42;

      // Parallax mouse displacement of the main optical axis
      const parallaxX = (mouse.x - baseCenterX) * 0.14;
      const parallaxY = (mouse.y - baseCenterY) * 0.14;

      const originX = baseCenterX + parallaxX;
      const originY = baseCenterY + parallaxY;

      // Calculate the master scale factor from screen dimensions
      const maxAvailableR = Math.min(width * 0.48, height * 0.58, 380);

      // Determine Animation Phase & Contraction/Expansion Progress
      // Phase 0: 0 -> 3200ms (Expanded & breathing net)
      // Phase 1: 3200 -> 5200ms (Contracting all circles together)
      // Phase 2: 5200 -> 5600ms (Singularity pulse)
      // Phase 3: 5600 -> 8000ms (Expanding with net)
      let expansionProgress = 1.0; // 0 = fully collapsed together, 1 = fully expanded
      let netVisibility = 1.0;     // Opacity of the cross-net mesh chords
      let coreGlowIntensity = 0.4;  // Central glowing energy

      if (elapsed < 3200) {
        // Expanded breathing phase
        const breath = Math.sin(timeSec * 1.6) * 0.025;
        expansionProgress = 1.0 + breath;
        netVisibility = 1.0;
        coreGlowIntensity = 0.35 + Math.sin(timeSec * 2.2) * 0.1;
      } else if (elapsed < 5200) {
        // Contracting all circles together
        const t = (elapsed - 3200) / 2000;
        const eased = easeInOutCubic(t);
        expansionProgress = 1.0 - eased * 0.88; // contract to ~12%
        netVisibility = Math.max(0, 1.0 - eased * 1.2); // net fades as rings collapse
        coreGlowIntensity = 0.35 + eased * 0.65; // intense convergence energy
      } else if (elapsed < 5600) {
        // Focal Singularity Pulse
        const t = (elapsed - 5200) / 400;
        const pulse = Math.sin(t * Math.PI);
        expansionProgress = 0.12 + pulse * 0.08;
        netVisibility = pulse * 0.2;
        coreGlowIntensity = 1.0 + pulse * 0.5;
      } else {
        // Expanding with the net
        const t = (elapsed - 5600) / 2400;
        const eased = easeOutBack(Math.min(1, t * 1.05));
        expansionProgress = 0.12 + (1.0 - 0.12) * eased;
        // Net becomes visible and unfolds dynamically
        netVisibility = Math.min(1.0, Math.max(0, (t - 0.12) * 1.4));
        coreGlowIntensity = Math.max(0.35, 1.0 - t * 0.7);
      }

      // Add click impulse expansion
      if (clickImpulse > 0) {
        expansionProgress += Math.sin(clickImpulse * Math.PI) * 0.15;
        coreGlowIntensity += clickImpulse * 0.4;
      }

      // 1. Draw subtle ambient photon dust
      photons.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 1) {
          p.x += (dx / dist) * 1.2;
          p.y += (dy / dist) * 1.2;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 2. Interactive Spotlight / Radial Lens Aura behind the circles
      const auraGradient = ctx.createRadialGradient(
        originX,
        originY,
        10,
        originX,
        originY,
        maxAvailableR * expansionProgress * 1.25
      );
      auraGradient.addColorStop(0, `rgba(108, 92, 231, ${0.18 * coreGlowIntensity})`);
      auraGradient.addColorStop(0.35, `rgba(30, 154, 168, ${0.10 * expansionProgress})`);
      auraGradient.addColorStop(0.7, `rgba(194, 64, 142, ${0.05 * expansionProgress})`);
      auraGradient.addColorStop(1, 'rgba(20, 33, 61, 0)');

      ctx.beginPath();
      ctx.arc(originX, originY, maxAvailableR * expansionProgress * 1.25, 0, Math.PI * 2);
      ctx.fillStyle = auraGradient;
      ctx.fill();

      // 3. Compute Net Nodes Matrix
      // 5 concentric rings x 18 spokes = 90 interconnected nodes
      const currentRadii: number[] = [];
      const nodeMatrix: NodePoint[][] = [];

      for (let r = 0; r < RING_COUNT; r++) {
        // Ring radius with depth-staggered expansion
        const ringDepthDelay = (r / (RING_COUNT - 1)) * 0.12;
        const effectiveExpansion = Math.max(0.08, expansionProgress - ringDepthDelay * (1 - expansionProgress));
        const currentR = maxAvailableR * RING_COLORS[r].baseR * effectiveExpansion;
        currentRadii.push(currentR);

        // Individual ring 3D tilt offset
        const ringParallax = (r - 2) * 3.5;
        const rx = originX + (mouse.x - baseCenterX) * 0.03 * (r + 1);
        const ry = originY + (mouse.y - baseCenterY) * 0.03 * (r + 1);

        const ringNodes: NodePoint[] = [];

        // Slow organic rotation of alternating rings (creates mesmerizing optical kaleidoscope)
        const rotationDirection = r % 2 === 0 ? 1 : -1;
        const ringRotation = timeSec * 0.05 * rotationDirection;

        for (let s = 0; s < SPOKE_COUNT; s++) {
          const angle = (s / SPOKE_COUNT) * Math.PI * 2 + ringRotation;
          const baseX = rx + Math.cos(angle) * currentR;
          const baseY = ry + Math.sin(angle) * currentR;

          // Mouse proximity influence (tactile elastic net warp!)
          let posX = baseX;
          let posY = baseY;
          let highlight = 0;

          const distToMouse = Math.hypot(baseX - mouse.x, baseY - mouse.y);
          const INFLUENCE_RADIUS = 160;

          if (distToMouse < INFLUENCE_RADIUS && distToMouse > 1) {
            const factor = 1 - distToMouse / INFLUENCE_RADIUS;
            // Magnetic elastic stretch towards the mouse cursor
            const stretch = Math.sin(factor * Math.PI) * 18 * expansionProgress;
            posX += ((mouse.x - baseX) / distToMouse) * stretch;
            posY += ((mouse.y - baseY) / distToMouse) * stretch;
            highlight = factor;
          }

          // Click ripple offset
          if (clickImpulse > 0) {
            const distToClick = Math.hypot(baseX - clickX, baseY - clickY);
            const wave = Math.sin((distToClick - (1 - clickImpulse) * 350) * 0.05);
            if (Math.abs(wave) > 0.4) {
              posX += Math.cos(angle) * wave * 10 * clickImpulse;
              posY += Math.sin(angle) * wave * 10 * clickImpulse;
            }
          }

          ringNodes.push({
            x: posX,
            y: posY,
            baseX,
            baseY,
            ringIndex: r,
            angleIndex: s,
            highlight,
          });
        }
        nodeMatrix.push(ringNodes);
      }

      // 4. DRAW THE INTERCONNECTED NET (Spokes + Diamond Cross Chords)
      if (netVisibility > 0.02) {
        ctx.save();

        // 4A: Radial Meridian Spokes (From Inner Ring to Outer Ring)
        for (let s = 0; s < SPOKE_COUNT; s++) {
          ctx.beginPath();
          const innerNode = nodeMatrix[0][s];
          ctx.moveTo(innerNode.x, innerNode.y);

          for (let r = 1; r < RING_COUNT; r++) {
            const node = nodeMatrix[r][s];
            ctx.lineTo(node.x, node.y);
          }

          const spokeHighlight = nodeMatrix[2][s].highlight;
          ctx.strokeStyle =
            spokeHighlight > 0.1
              ? `rgba(30, 154, 168, ${0.35 + spokeHighlight * 0.4})`
              : `rgba(255, 255, 255, ${0.12 * netVisibility})`;
          ctx.lineWidth = spokeHighlight > 0.1 ? 1.4 : 0.8;
          ctx.stroke();
        }

        // 4B: Diamond / Triangular Cross-Mesh (The Expanding Optical Net)
        // Connects node [r][s] to [r+1][s+1] and [r+1][s-1]
        for (let r = 0; r < RING_COUNT - 1; r++) {
          const isOuter = r >= 2;
          const netAlpha = (0.2 + (r / RING_COUNT) * 0.18) * netVisibility;

          for (let s = 0; s < SPOKE_COUNT; s++) {
            const current = nodeMatrix[r][s];
            const nextSpoke = (s + 1) % SPOKE_COUNT;
            const targetCrossA = nodeMatrix[r + 1][nextSpoke];

            // Diagonal Net Strand
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(targetCrossA.x, targetCrossA.y);

            const strandHighlight = Math.max(current.highlight, targetCrossA.highlight);
            if (strandHighlight > 0.1) {
              ctx.strokeStyle = `rgba(108, 92, 231, ${0.3 + strandHighlight * 0.5})`;
              ctx.lineWidth = 1.2 + strandHighlight * 0.8;
            } else {
              ctx.strokeStyle = isOuter
                ? `rgba(194, 64, 142, ${netAlpha * 0.7})`
                : `rgba(30, 154, 168, ${netAlpha * 0.85})`;
              ctx.lineWidth = 0.75;
            }
            ctx.stroke();

            // Reverse Diagonal Net Strand (Cross-Hatch Diamond Pattern)
            const prevSpoke = (s - 1 + SPOKE_COUNT) % SPOKE_COUNT;
            const targetCrossB = nodeMatrix[r + 1][prevSpoke];
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(targetCrossB.x, targetCrossB.y);

            const strandHighlightB = Math.max(current.highlight, targetCrossB.highlight);
            if (strandHighlightB > 0.1) {
              ctx.strokeStyle = `rgba(30, 154, 168, ${0.3 + strandHighlightB * 0.5})`;
              ctx.lineWidth = 1.2 + strandHighlightB * 0.8;
            } else {
              ctx.strokeStyle = `rgba(108, 92, 231, ${netAlpha * 0.6})`;
              ctx.lineWidth = 0.65;
            }
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // 5. DRAW THE CONCENTRIC REFRACTION CIRCLES
      for (let r = 0; r < RING_COUNT; r++) {
        const ringCfg = RING_COLORS[r];
        const nodes = nodeMatrix[r];
        if (!nodes || nodes.length === 0) continue;

        ctx.save();

        // Build smooth curved path through all ring nodes (incorporating mouse warp!)
        ctx.beginPath();
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);

        for (let i = 0; i < nodes.length; i++) {
          const curr = nodes[i];
          const next = nodes[(i + 1) % nodes.length];
          const midX = (curr.x + next.x) / 2;
          const midY = (curr.y + next.y) / 2;
          ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        }
        ctx.closePath();

        // Glow pass when near mouse or during pulse
        const avgRingHighlight = nodes.reduce((acc, n) => acc + n.highlight, 0) / nodes.length;
        const ringAlpha = Math.min(0.9, 0.35 + (r / RING_COUNT) * 0.15 + avgRingHighlight * 0.4);

        // Soft outer caustic shadow glow
        ctx.shadowColor = ringCfg.glow;
        ctx.shadowBlur = 10 + avgRingHighlight * 14;

        ctx.strokeStyle = ringCfg.stroke;
        ctx.lineWidth = 1.8 + (r === 0 ? 0.6 : 0) + (avgRingHighlight > 0.05 ? 1.0 : 0);
        ctx.globalAlpha = ringAlpha;
        ctx.stroke();

        ctx.restore();
      }

      // 6. DRAW LUMINOUS NODES (Star junctions where rings and net meet)
      if (netVisibility > 0.1) {
        for (let r = 0; r < RING_COUNT; r++) {
          const ringCfg = RING_COLORS[r];
          const nodes = nodeMatrix[r];

          for (let s = 0; s < SPOKE_COUNT; s++) {
            const node = nodes[s];
            const isHovered = node.highlight > 0.1;
            const nodeRadius = (1.6 + (r % 2 === 0 ? 0.6 : 0) + (isHovered ? node.highlight * 2.8 : 0)) * Math.min(1.2, expansionProgress);

            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);

            if (isHovered) {
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowColor = '#1E9AA8';
              ctx.shadowBlur = 8;
            } else {
              ctx.fillStyle = ringCfg.stroke;
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
            }

            ctx.globalAlpha = (0.4 + (isHovered ? 0.6 : 0)) * netVisibility;
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1.0;
      }

      // 7. CENTRAL OPTICAL APERTURE CORE (Focusing Singularity)
      const coreR = Math.max(12, 28 * (0.8 + coreGlowIntensity * 0.6) * (expansionProgress < 0.3 ? 1.4 : 1.0));

      // Core Outer Glow
      const coreGrad = ctx.createRadialGradient(originX, originY, 4, originX, originY, coreR * 2.2);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * coreGlowIntensity})`);
      coreGrad.addColorStop(0.25, `rgba(30, 154, 168, ${0.75 * coreGlowIntensity})`);
      coreGrad.addColorStop(0.6, `rgba(108, 92, 231, ${0.45 * coreGlowIntensity})`);
      coreGrad.addColorStop(1, 'rgba(20, 33, 61, 0)');

      ctx.beginPath();
      ctx.arc(originX, originY, coreR * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Core Aperture Ring
      ctx.beginPath();
      ctx.arc(originX, originY, coreR * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.8 * coreGlowIntensity;
      ctx.stroke();

      // Central Pupil / Dark Center with crisp cyan pinpoint
      ctx.beginPath();
      ctx.arc(originX, originY, coreR * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = '#14213D';
      ctx.globalAlpha = 0.95;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(originX, originY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1E9AA8';
      ctx.globalAlpha = 1.0;
      ctx.fill();

      // Request next frame
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Cleanup on unmount
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
        cursor: 'crosshair',
        zIndex: 1,
        ...style,
      }}
      title="Interactive Optical Precision Net · Move mouse to refract & click to pulse"
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
