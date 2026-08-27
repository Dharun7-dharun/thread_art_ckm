import React, { useEffect, useRef } from 'react';

const ThreadAnimation = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, active: false, speedX: 0, speedY: 0, lastX: null, lastY: null });
  const ripplesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse speed & positions
    const handleMouseMove = (e) => {
      const mouse = mouseRef.current;
      if (mouse.lastX !== null) {
        mouse.speedX = e.clientX - mouse.lastX;
        mouse.speedY = e.clientY - mouse.lastY;
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.lastX = e.clientX;
      mouse.lastY = e.clientY;
      mouse.active = true;

      // Randomly spawn stitching ripples on fast movements
      if (Math.hypot(mouse.speedX, mouse.speedY) > 15 && Math.random() < 0.2) {
        ripplesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          r: 2,
          maxR: Math.random() * 80 + 50,
          opacity: 0.25
        });
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.lastX = null;
      mouseRef.current.lastY = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Define flowers (string art anchors) - increased count to 8
    const flowers = [];
    const flowerCount = 8;

    const initFlowers = () => {
      flowers.length = 0;
      const w = canvas.width;
      const h = canvas.height;
      const baseR = Math.min(w, h);

      const positions = [
        { x: w * 0.12, y: h * 0.25, r: baseR * 0.14, petals: 5, multiplier: 3, speed: 0.0008, color: 'black' },
        { x: w * 0.88, y: h * 0.2, r: baseR * 0.11, petals: 7, multiplier: 4, speed: -0.001, color: 'gold' },
        { x: w * 0.5, y: h * 0.5, r: baseR * 0.18, petals: 8, multiplier: 5, speed: 0.0004, color: 'black' },
        { x: w * 0.18, y: h * 0.78, r: baseR * 0.13, petals: 6, multiplier: 3, speed: -0.0007, color: 'black' },
        { x: w * 0.82, y: h * 0.82, r: baseR * 0.15, petals: 9, multiplier: 6, speed: 0.0012, color: 'gold' },
        { x: w * 0.5, y: h * 0.15, r: baseR * 0.07, petals: 5, multiplier: 2, speed: 0.0005, color: 'black' },
        { x: w * 0.32, y: h * 0.38, r: baseR * 0.09, petals: 7, multiplier: 3, speed: -0.0009, color: 'gold' },
        { x: w * 0.68, y: h * 0.62, r: baseR * 0.1, petals: 6, multiplier: 4, speed: 0.0006, color: 'black' }
      ];

      positions.forEach(pos => {
        flowers.push({
          ...pos,
          angle: Math.random() * Math.PI * 2,
          currentX: pos.x,
          currentY: pos.y,
          targetX: pos.x,
          targetY: pos.y
        });
      });
    };

    initFlowers();

    // Connective threads floating in the background (increased count to 16)
    const threadCount = 16;
    const backgroundThreads = [];
    for (let i = 0; i < threadCount; i++) {
      backgroundThreads.push({
        p1: Math.floor(Math.random() * flowerCount),
        p2: Math.floor(Math.random() * flowerCount),
        sag: Math.random() * 50 + 20,
        waveSpeed: Math.random() * 0.015 + 0.008,
        waveOffset: Math.random() * Math.PI * 2,
        color: Math.random() > 0.7 ? 'gold' : 'black'
      });
    }

    // Helper: Draw nested mathematical rose & string-art curves
    const drawNestedRoseStringArt = (ctx, cx, cy, radius, petals, multiplier, rotation, type) => {
      // Outer Flower
      drawSingleRoseCurve(ctx, cx, cy, radius, petals, multiplier, rotation, type, 0.05);
      
      // Inner Flower - Concentric, smaller radius, rotating in opposite direction, different multiplier
      const innerRadius = radius * 0.55;
      const innerPetals = petals - 1 > 2 ? petals - 1 : 3;
      const innerMultiplier = multiplier + 1;
      drawSingleRoseCurve(ctx, cx, cy, innerRadius, innerPetals, innerMultiplier, -rotation * 1.5, type === 'gold' ? 'black' : 'gold', 0.04);
    };

    const drawSingleRoseCurve = (ctx, cx, cy, radius, petals, multiplier, rotation, type, strokeOpacity) => {
      const numPoints = 140; // Increased perimeter points for finer detail
      const points = [];

      for (let i = 0; i < numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2 + rotation;
        const k = petals;
        const r = radius * (0.65 + 0.35 * Math.abs(Math.sin(k * theta / 2)));
        points.push({
          x: cx + r * Math.cos(theta),
          y: cy + r * Math.sin(theta)
        });
      }

      // Stroke Color: Black Shade vs. Soft Gold Silk Thread
      const strokeColor = type === 'gold' 
        ? `rgba(197, 160, 89, ${strokeOpacity * 1.8})` 
        : `rgba(0, 0, 0, ${strokeOpacity})`;

      // Draw perimeter outline
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Draw the string art (thread lines connecting pins)
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const j = Math.floor(i * multiplier) % numPoints;
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.45;
      ctx.stroke();
    };

    // Draw a curved thread line between two points
    const drawDrapedThread = (ctx, x1, y1, x2, y2, sag, timeOffset, type) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 + sag + Math.sin(timeOffset) * 12;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(midX, midY, x2, y2);
      ctx.strokeStyle = type === 'gold' ? 'rgba(197, 160, 89, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = 0.75;
      ctx.stroke();
    };

    let time = 0;
    const animate = () => {
      time += 0.025;

      // Auto-resize viewport checking
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        resizeCanvas();
        initFlowers();
      }

      // Remove opaque background to let the CSS animated premium gradient shine through
      // Just clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fine canvas fabric texture (subtle overlay)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.015)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Animate and draw ripples
      ripplesRef.current.forEach((r, idx) => {
        r.r += 2.5;
        r.opacity = Math.max(0, 0.25 - (r.r / r.maxR) * 0.25);

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 0, 0, ${r.opacity})`;
        ctx.lineWidth = 0.5;
        // Dashed ripple line to simulate running stitch patterns
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      });

      // Filter out dead ripples
      ripplesRef.current = ripplesRef.current.filter(r => r.r < r.maxR);

      const mouse = mouseRef.current;

      // Update and draw flower structures
      flowers.forEach(f => {
        f.angle += f.speed;

        // Base sway physics
        let targetX = f.x + Math.sin(time * 0.4 + f.r) * 20;
        let targetY = f.y + Math.cos(time * 0.3 + f.r) * 20;

        // Interaction: Warp positions slightly away from the mouse cursor (magnetic push)
        if (mouse.active && mouse.x !== null) {
          const mDist = Math.hypot(mouse.x - f.currentX, mouse.y - f.currentY);
          if (mDist < 250) {
            const force = (250 - mDist) / 250; // 0 to 1
            const angle = Math.atan2(f.currentY - mouse.y, f.currentX - mouse.x);
            targetX += Math.cos(angle) * force * 45;
            targetY += Math.sin(angle) * force * 45;
          }
        }

        f.currentX += (targetX - f.currentX) * 0.04;
        f.currentY += (targetY - f.currentY) * 0.04;

        // Render flower structures (nested string arts)
        drawNestedRoseStringArt(ctx, f.currentX, f.currentY, f.r, f.petals, f.multiplier, f.angle, f.color);
      });

      // Draw background draped threads
      backgroundThreads.forEach(t => {
        const f1 = flowers[t.p1];
        const f2 = flowers[t.p2];
        if (f1 && f2) {
          drawDrapedThread(
            ctx,
            f1.currentX, f1.currentY,
            f2.currentX, f2.currentY,
            t.sag,
            time * t.waveSpeed + t.waveOffset,
            t.color
          );
        }
      });

      // Mouse interactive threads
      if (mouse.active && mouse.x !== null) {
        flowers.forEach(f => {
          const dist = Math.hypot(mouse.x - f.currentX, mouse.y - f.currentY);
          const maxRange = Math.max(canvas.width, canvas.height) * 0.45;

          if (dist < maxRange) {
            const factor = 1 - dist / maxRange;
            ctx.beginPath();
            ctx.moveTo(f.currentX, f.currentY);

            // Draw curving thread lines linking node centers to mouse needle
            const controlX = (f.currentX + mouse.x) / 2;
            const controlY = (f.currentY + mouse.y) / 2 + (dist * 0.12);

            ctx.quadraticCurveTo(controlX, controlY, mouse.x, mouse.y);
            
            // Render dual color threads connecting to mouse pointer
            if (f.color === 'gold') {
              ctx.strokeStyle = `rgba(197, 160, 89, ${0.2 * factor})`;
            } else {
              ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 * factor})`;
            }
            
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        });

        // Mouse drawing indicator
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default ThreadAnimation;
