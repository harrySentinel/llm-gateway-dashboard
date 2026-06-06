"use client";

import { useEffect, useRef } from "react";

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
  layer: number;
}

function createBeam(width: number, height: number, layer: number): Beam {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    width: 10 + layer * 5,
    length: height * 2.5,
    angle: -35 + Math.random() * 10,
    speed: 0.2 + layer * 0.2 + Math.random() * 0.2,
    opacity: 0.08 + layer * 0.05 + Math.random() * 0.1,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.015,
    layer,
  };
}

const LAYERS = 3;

export function BeamBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const rafRef = useRef<number>(0);
  const isMobileRef = useRef(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const noiseCanvas = noiseRef.current;
    if (!canvas || !noiseCanvas) return;
    const ctx = canvas.getContext("2d");
    const nCtx = noiseCanvas.getContext("2d", { willReadFrequently: false });
    if (!ctx || !nCtx) return;

    const resize = () => {
      const mobile = window.innerWidth < 768;
      isMobileRef.current = mobile;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 2);

      for (const cvs of [canvas, noiseCanvas]) {
        cvs.width = window.innerWidth * dpr;
        cvs.height = window.innerHeight * dpr;
        cvs.style.width = `${window.innerWidth}px`;
        cvs.style.height = `${window.innerHeight}px`;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      nCtx.setTransform(1, 0, 0, 1, 0, 0);
      nCtx.scale(dpr, dpr);

      const count = mobile ? 3 : 8;
      beamsRef.current = [];
      for (let l = 1; l <= LAYERS; l++) {
        for (let i = 0; i < count; i++) {
          beamsRef.current.push(createBeam(window.innerWidth, window.innerHeight, l));
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const noise = () => {
      const d = nCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() * 255;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = 12;
      }
      nCtx.putImageData(d, 0, 0);
    };

    const drawBeam = (b: Beam) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate((b.angle * Math.PI) / 180);
      const p = Math.min(1, b.opacity * (0.8 + Math.sin(b.pulse) * 0.4));
      const g = ctx.createLinearGradient(0, 0, 0, b.length);
      g.addColorStop(0, `rgba(0,255,255,0)`);
      g.addColorStop(0.2, `rgba(0,255,255,${p * 0.5})`);
      g.addColorStop(0.5, `rgba(0,255,255,${p})`);
      g.addColorStop(0.8, `rgba(0,255,255,${p * 0.5})`);
      g.addColorStop(1, `rgba(0,255,255,0)`);
      ctx.fillStyle = g;
      if (!isMobileRef.current) ctx.filter = `blur(${2 + b.layer * 2}px)`;
      ctx.fillRect(-b.width / 2, 0, b.width, b.length);
      ctx.restore();
    };

    const animate = () => {
      frameRef.current++;
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#050505");
      bg.addColorStop(1, "#111111");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      beamsRef.current.forEach((b) => {
        b.y -= b.speed * (b.layer / LAYERS + 0.5);
        b.pulse += b.pulseSpeed;
        if (b.y + b.length < -50) {
          b.y = window.innerHeight + 50;
          b.x = Math.random() * window.innerWidth;
        }
        drawBeam(b);
      });

      if (frameRef.current % (isMobileRef.current ? 8 : 4) === 0) noise();
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <canvas
        ref={noiseRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />
    </>
  );
}
