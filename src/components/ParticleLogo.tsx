"use client";

import { useEffect, useRef } from "react";

interface ParticleLogoProps {
  src: string;
}

interface LogoParticle {
  x: number;
  y: number;
  phase: number;
  size: number;
  alpha: number;
  color: string;
}

const seededRandom = (x: number, y: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export function ParticleLogo({ src }: ParticleLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const source = new Image();
    const sample = document.createElement("canvas");
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    if (!sampleContext) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let particles: LogoParticle[] = [];
    let pointer = { x: -1000, y: -1000 };
    let frame = 0;
    let running = false;
    let isVisible = true;

    const draw = (time: number) => {
      if (!width || !height) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const seconds = time * 0.001;
      for (const particle of particles) {
        const curlX =
          Math.sin(particle.y * 0.017 + seconds * 0.48 + particle.phase) * 1.2 +
          Math.cos(particle.x * 0.014 - seconds * 0.31 + particle.phase) * 0.55;
        const curlY =
          Math.cos(particle.x * 0.016 + seconds * 0.43 + particle.phase) * 1.1 +
          Math.sin(particle.y * 0.019 - seconds * 0.27 + particle.phase) * 0.5;

        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        const fluid = Math.exp(-distanceSquared / 4600);
        const distance = Math.sqrt(distanceSquared) || 1;
        const swirlX = ((dx + dy * 0.5) / distance) * fluid * 8;
        const swirlY = ((dy - dx * 0.5) / distance) * fluid * 8;

        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.fillRect(
          particle.x + curlX + swirlX,
          particle.y + curlY + swirlY,
          particle.size,
          particle.size
        );
      }
      context.globalAlpha = 1;
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      running = false;
    };

    const tick = (time: number) => {
      if (!running) return;
      draw(time);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduceMotion || !isVisible || running || !particles.length) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height || !source.complete) return;

      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      sample.width = Math.max(1, Math.round(width));
      sample.height = Math.max(1, Math.round(height));
      sampleContext.clearRect(0, 0, sample.width, sample.height);
      sampleContext.drawImage(source, 0, 0, sample.width, sample.height);

      const pixels = sampleContext.getImageData(
        0,
        0,
        sample.width,
        sample.height
      ).data;
      const nextParticles: LogoParticle[] = [];
      for (let y = 0; y < sample.height; y += 2) {
        for (let x = 0; x < sample.width; x += 2) {
          const index = (y * sample.width + x) * 4;
          const opacity = pixels[index + 3] / 255;
          const random = seededRandom(x, y);
          if (opacity < 0.48 || random > 0.3) continue;

          const brightness =
            (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (3 * 255);
          // Lift the original dark chrome into a readable silver while keeping
          // its engraved shadows and cool metallic highlights.
          const channel = (value: number) =>
            Math.max(0, Math.min(255, Math.round(176 + value * 0.31)));
          nextParticles.push({
            x,
            y,
            phase: random * Math.PI * 2,
            size: 0.55 + random * 0.8,
            alpha: opacity * (0.44 + brightness * 0.54),
            color: `rgb(${channel(pixels[index])}, ${channel(pixels[index + 1])}, ${channel(pixels[index + 2])})`,
          });
        }
      }
      particles = nextParticles;
      draw(performance.now());
      start();
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      if (reduceMotion) draw(performance.now());
    };
    const onPointerLeave = () => {
      pointer = { x: -1000, y: -1000 };
      if (reduceMotion) draw(performance.now());
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) start();
      else stop();
    });
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    source.onload = resize;
    source.src = src;

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      source.onload = null;
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-logo"
      role="img"
      aria-label="Aarohan logo made of shimmering particles"
    />
  );
}
