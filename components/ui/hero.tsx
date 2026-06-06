"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { MoveRight, Zap } from "lucide-react";

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
  const angle = -35 + Math.random() * 10;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    width: 10 + layer * 5,
    length: height * 2.5,
    angle,
    speed: 0.2 + layer * 0.2 + Math.random() * 0.2,
    opacity: 0.08 + layer * 0.05 + Math.random() * 0.1,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.015,
    layer,
  };
}

const LAYERS = 3;
const words = ["intelligently", "reliably", "efficiently", "at scale", "securely"];

export function PremiumHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number>(0);
  const isMobileRef = useRef(false);
  const frameCountRef = useRef(0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const noiseCanvas = noiseRef.current;
    if (!canvas || !noiseCanvas) return;
    const ctx = canvas.getContext("2d");
    // willReadFrequently: false — we only write, never read back
    const nCtx = noiseCanvas.getContext("2d", { willReadFrequently: false });
    if (!ctx || !nCtx) return;

    const resizeCanvas = () => {
      const mobile = window.innerWidth < 768;
      isMobileRef.current = mobile;

      // Cap DPR: mobile phones can be 3× — no visible gain past 1.5 on canvas
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

      // Fewer beams on mobile: reduces per-frame draw calls significantly
      const beamsPerLayer = mobile ? 3 : 8;
      beamsRef.current = [];
      for (let layer = 1; layer <= LAYERS; layer++) {
        for (let i = 0; i < beamsPerLayer; i++) {
          beamsRef.current.push(
            createBeam(window.innerWidth, window.innerHeight, layer),
          );
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const generateNoise = () => {
      const imgData = nCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 12;
      }
      nCtx.putImageData(imgData, 0, 0);
    };

    const drawBeam = (beam: Beam) => {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity = Math.min(
        1,
        beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.4),
      );
      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      gradient.addColorStop(0, `rgba(0,255,255,0)`);
      gradient.addColorStop(0.2, `rgba(0,255,255,${pulsingOpacity * 0.5})`);
      gradient.addColorStop(0.5, `rgba(0,255,255,${pulsingOpacity})`);
      gradient.addColorStop(0.8, `rgba(0,255,255,${pulsingOpacity * 0.5})`);
      gradient.addColorStop(1, `rgba(0,255,255,0)`);

      ctx.fillStyle = gradient;
      // ctx.filter is the single most expensive op on mobile — skip it
      if (!isMobileRef.current) {
        ctx.filter = `blur(${2 + beam.layer * 2}px)`;
      }
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    };

    const animate = () => {
      if (!canvas || !ctx) return;

      frameCountRef.current += 1;

      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#050505");
      bg.addColorStop(1, "#111111");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      beamsRef.current.forEach((beam) => {
        beam.y -= beam.speed * (beam.layer / LAYERS + 0.5);
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -50) {
          beam.y = window.innerHeight + 50;
          beam.x = Math.random() * window.innerWidth;
        }
        drawBeam(beam);
      });

      // Noise every 4 frames on desktop, every 8 on mobile — imperceptible difference
      const noiseEvery = isMobileRef.current ? 8 : 4;
      if (frameCountRef.current % noiseEvery === 0) generateNoise();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={noiseRef} className="absolute inset-0 z-0 pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* Top nav */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold text-white/90 tracking-tight">
          LLM Gateway
        </span>
        <Link
          href="/login"
          className="text-sm text-white/50 hover:text-white/90 transition-colors"
        >
          Sign in
        </Link>
      </div>

      {/* Hero content */}
      <div className="relative z-20 flex h-screen w-full items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-8 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Gemini · Groq · more providers coming
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl tracking-tighter font-semibold leading-tight">
            <span className="text-white">Route AI calls</span>
            <span className="relative flex w-full justify-center overflow-hidden pb-2 pt-1">
              &nbsp;
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  className="absolute text-cyan-400"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    wordIndex === index
                      ? { y: 0, opacity: 1 }
                      : { y: wordIndex > index ? -150 : 150, opacity: 0 }
                  }
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg leading-relaxed text-white/50 max-w-lg">
            A self-hosted proxy that routes LLM requests across providers with
            automatic failover, per-key cost tracking, and full observability.
          </p>

          {/* CTA */}
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            Get started free <MoveRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
