"use client";

import { useEffect, useRef } from "react";

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const spacing = 90;
    const amplitude = 30; // more curved load look
    const frequency = 0.005;

    type Point = {
      x: number;
      y: number;
      oldX: number;
      oldY: number;
      baseX: number;
      baseY: number;
      targetDist?: number;
      targetBendDist?: number;
    };

    type Line = {
      points: Point[];
    };

    let lines: Line[] = [];

    const initLines = () => {
      lines = [];
      const numLines = Math.ceil(height / spacing) + 4;
      // create points with some slack outside screen to allow pulling
      const numPoints = Math.ceil((width + 400) / 20);

      for (let i = -2; i < numLines; i++) {
        const line: Line = { points: [] };
        const baseY = i * spacing;
        for (let j = 0; j < numPoints; j++) {
          const baseX = -200 + j * 20;
          const yOffset = Math.sin(baseX * frequency) * amplitude;
          line.points.push({
            x: baseX,
            y: baseY + yOffset,
            oldX: baseX,
            oldY: baseY + yOffset,
            baseX: baseX,
            baseY: baseY + yOffset,
          });
        }
        
        // calculate target distances for constraints
        for (let j = 0; j < line.points.length - 1; j++) {
          let p1 = line.points[j];
          let p2 = line.points[j + 1];
          p1.targetDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        }
        for (let j = 0; j < line.points.length - 2; j++) {
          let p1 = line.points[j];
          let p3 = line.points[j + 2];
          p1.targetBendDist = Math.hypot(p3.x - p1.x, p3.y - p1.y);
        }
        lines.push(line);
      }
    };

    initLines();

    let mouse = { x: -1000, y: -1000 };
    let lastMouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.x = mouse.x === -1000 ? e.clientX : mouse.x;
      lastMouse.y = mouse.y === -1000 ? e.clientY : mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      lastMouse.x = -1000;
      lastMouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initLines();
    };
    window.addEventListener("resize", handleResize);

    const interactionRadius = 150;

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 3.5; // thicker lines

      let mouseDx = mouse.x - lastMouse.x;
      let mouseDy = mouse.y - lastMouse.y;
      // We only want a single impulse of mouse velocity per frame, so reset lastMouse slightly 
      // or just decay it:
      lastMouse.x += mouseDx * 0.5;
      lastMouse.y += mouseDy * 0.5;

      // Verlet Integration
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 1. Calculate & propagate velocities (wave resonance)
        let tempVx = new Float32Array(line.points.length);
        let tempVy = new Float32Array(line.points.length);
        
        for (let j = 0; j < line.points.length; j++) {
          tempVx[j] = line.points[j].x - line.points[j].oldX;
          tempVy[j] = line.points[j].y - line.points[j].oldY;
        }

        const transfer = 0.25; // How much energy transfers to neighbors (resonance)
        const friction = 0.98; // Friction (higher value = less friction, wave travels further)
        const interactionRadius = 80; // smaller imaginary circle around mouse

        for (let j = 0; j < line.points.length; j++) {
          let p = line.points[j];
          
          let leftVx = j > 0 ? tempVx[j - 1] : tempVx[j];
          let leftVy = j > 0 ? tempVy[j - 1] : tempVy[j];
          let rightVx = j < line.points.length - 1 ? tempVx[j + 1] : tempVx[j];
          let rightVy = j < line.points.length - 1 ? tempVy[j + 1] : tempVy[j];

          // Blend velocity for traveling wave effect
          let vx = tempVx[j] * (1 - transfer * 2) + leftVx * transfer + rightVx * transfer;
          let vy = tempVy[j] * (1 - transfer * 2) + leftVy * transfer + rightVy * transfer;

          vx *= friction;
          vy *= friction;

          p.oldX = p.x;
          p.oldY = p.y;

          // Apply mouse force (Repel from mouse)
          let dx = p.x - mouse.x;
          let dy = p.y - mouse.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < interactionRadius && mouse.x !== -1000 && dist > 0) {
            let normalizedDist = (interactionRadius - dist) / interactionRadius;
            // Quadratic drop off: reduces speed of repulsion smoothly as it goes radially outward
            let force = normalizedDist * normalizedDist; 
            
            // Push away radially, reduced base multiplier (0.4 -> 0.15) to make it "somewhat slow"
            vx += (dx / dist) * force * 0.15;
            vy += (dy / dist) * force * 0.15;
          }

          p.x += vx;
          p.y += vy;
        }

        // 2. Solve constraints (multiple iterations for rigidity)
        for (let iter = 0; iter < 5; iter++) {
          
          // distance constraints
          for (let j = 0; j < line.points.length - 1; j++) {
            let p1 = line.points[j];
            let p2 = line.points[j + 1];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) continue;
            let diff = p1.targetDist! - dist;
            let percent = diff / dist / 2;
            let ox = dx * percent;
            let oy = dy * percent;

            if (j === 0) {
              p2.x += ox * 2; p2.y += oy * 2;
            } else if (j === line.points.length - 2) {
              p1.x -= ox * 2; p1.y -= oy * 2;
            } else {
              p1.x -= ox; p1.y -= oy;
              p2.x += ox; p2.y += oy;
            }
          }

          // bending constraints (for wire stiffness)
          for (let j = 0; j < line.points.length - 2; j++) {
            let p1 = line.points[j];
            let p3 = line.points[j + 2];
            let dx = p3.x - p1.x;
            let dy = p3.y - p1.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) continue;
            let diff = p1.targetBendDist! - dist;
            // lower stiffness for bending
            let percent = (diff / dist / 2) * 0.1;
            let ox = dx * percent;
            let oy = dy * percent;

            if (j === 0) {
              p3.x += ox * 2; p3.y += oy * 2;
            } else if (j === line.points.length - 3) {
              p1.x -= ox * 2; p1.y -= oy * 2;
            } else {
              p1.x -= ox; p1.y -= oy;
              p3.x += ox; p3.y += oy;
            }
          }
        }

        // Draw line
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let j = 0; j < line.points.length - 1; j++) {
          const p1 = line.points[j];
          const p2 = line.points[j + 1];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        const lastP = line.points[line.points.length - 1];
        ctx.lineTo(lastP.x, lastP.y);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ display: "block" }}
    />
  );
}
