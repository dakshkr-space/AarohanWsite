"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { CarSvg } from "./Carsvg";
import { RoadBanner } from "./Roadbanner";
import { RoadBillboard, BILLBOARD_WIDTH } from "./Roadbillboard";

interface EventItem {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
}

interface ClubData {
  id: string;
  name: string;
  logo: string;
  events: EventItem[];
}

interface CarAnimationProps {
  clubs: ClubData[];
}

const CIRCUIT =
  "M28 74 L28 44 C28 30 38 22 52 24 L88 30 C98 32 100 40 94 46 L82 56 C74 64 80 74 92 74 L122 74 C134 74 140 66 136 56 L126 40 C122 32 126 22 136 22 C146 22 150 30 148 40 L146 70 C146 82 138 86 126 86 L44 86 C34 86 28 82 28 74Z";

// Road depth scrolls at 1.222 per unit of `dist`
const DEPTH_RATE = 1.222;
const BANNER_Z = 4.5; // world depth of the gantry at dist = 0
const BANNER_GONE_Z = 0.4; // depth at which the gantry is behind the car

// Roadside billboards
const BILL_SPACING = 9;
const BILL_Z0 = 11;
const BILL_FOCUS_Z = 3.4;
const BILL_GONE_Z = 1.25;
const BILL_FAR_Z = 15;
const BILL_WIDTH_U = 1.2;
const BILL_OFFSET = 0.86 + BILL_WIDTH_U / 2;
const VH_PER_EVENT = 90;
const DIST_PER_PANEL = BILL_SPACING / DEPTH_RATE;

const BILL_TURN_PHASE = 0.5 - (BILL_Z0 - BILL_FOCUS_Z) / BILL_SPACING;
const billSide = (i: number): 1 | -1 => (i % 2 === 0 ? -1 : 1);

export const CarAnimation: React.FC<CarAnimationProps> = ({ clubs }) => {
  const [activeDotIndex, setActiveDotIndex] = useState(0);

  const allEvents = useMemo(() => {
    return clubs.flatMap((club) => club.events);
  }, [clubs]);

  const windCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const carRef = useRef<SVGSVGElement | null>(null);
  const glintRef = useRef<SVGGElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const billboardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const roadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const roadLogoRef = useRef<HTMLImageElement | null>(null);

  // Rotating circuit minimap
  const miniWrapRef = useRef<HTMLDivElement | null>(null);
  const miniPathRef = useRef<SVGPathElement | null>(null);
  const miniDotRef = useRef<SVGCircleElement | null>(null);

  // Load the Aarohan road logo image for track projection
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/aarohan_symbol.png";
    roadLogoRef.current = img;
  }, []);

  const carElement = useMemo(
    () => <CarSvg carRef={carRef} glintRef={glintRef} />,
    []
  );

  useEffect(() => {
    const panelsCount = allEvents.length;
    if (panelsCount === 0) return;

    const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ---------- Car glint setup ----------
    const HOOD_TOP = 236;
    const HOOD_BOTTOM = 432;
    const HOOD_TOP_L = 462;
    const HOOD_TOP_R = 538;
    const HOOD_BOT_L = 384;
    const HOOD_BOT_R = 616;
    const GLINTS = 9;
    const glintGroup = glintRef.current;
    const glintShapes: SVGPolygonElement[] = [];
    if (glintGroup) {
      glintGroup.innerHTML = "";
      for (let i = 0; i < GLINTS; i++) {
        const shape = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        shape.setAttribute("fill", "#ffffff");
        glintGroup.appendChild(shape);
        glintShapes.push(shape);
      }
    }

    const hoodEdge = (y: number) => {
      const k = (y - HOOD_TOP) / (HOOD_BOTTOM - HOOD_TOP);
      return {
        l: HOOD_TOP_L + (HOOD_BOT_L - HOOD_TOP_L) * k,
        r: HOOD_TOP_R + (HOOD_BOT_R - HOOD_TOP_R) * k,
      };
    };

    const updateGlints = (prog: number) => {
      const phase = prog * 70;
      glintShapes.forEach((shape, i) => {
        const t = ((i + phase) % GLINTS) / GLINTS;
        const e = t * t;
        const y1 = HOOD_TOP + (HOOD_BOTTOM - HOOD_TOP) * e;
        const y2 = y1 + 2 + 14 * e;
        const a = hoodEdge(y1);
        const b = hoodEdge(y2);
        shape.setAttribute(
          "points",
          `${a.l},${y1} ${a.r},${y1} ${b.r},${y2} ${b.l},${y2}`
        );
        shape.setAttribute(
          "opacity",
          (0.18 * Math.sin(t * Math.PI) * clamp(prog * 20)).toString()
        );
      });
    };

    // ---------- Shared animation state ----------
    let progress = 0;
    let wind = 0;
    let turn = 0;
    let carTurn = 0;
    let drive = 0;

    // ---------- Road geometry ----------
    const ZIG_K = 1.0;
    let zigAmp = 1;
    const roadCx = (t: number, curve: number, dist: number, W: number) => {
      const base = curve * W * 0.88 * Math.pow(Math.max(0, 1 - t), 1.7);
      if (zigAmp < 0.001) return W / 2 + base;
      const z = 1 / Math.max(t, 0.001);
      const env =
        Math.pow(Math.max(0, 1 - t), 1.2) * smooth(clamp((t - 0.05) / 0.1));
      return (
        W / 2 + base + zigAmp * W * 0.18 * env * Math.sin(ZIG_K * (z + 1.222 * dist))
      );
    };

    // ---------- Vehicle dynamics ----------
    let lastT = performance.now();
    let lastScroll = window.scrollY;
    let vel = 0;
    let prevVel = 0;
    let rollPos = 0; // continuous tread travel
    let spinDeg = 0; // continuous wheel spin angle
    let pitch = 0, pitchV = 0;
    let heave = 0, heaveV = 0;
    let lean = 0, leanV = 0;
    let steer = 0, steerV = 0;
    let heat = 0;
    let brake = 0;
    let blur = 0;
    let speedN = 0;
    let travel = 0;
    let nextBump = 200;

    const varCache: Record<string, string> = {};
    const setVar = (el: SVGSVGElement, k: string, v: string) => {
      if (varCache[k] !== v) {
        varCache[k] = v;
        el.style.setProperty(k, v);
      }
    };

    const stepCar = (now: number) => {
      const dt = clamp((now - lastT) / 1000, 0.001, 0.05);
      lastT = now;

      const sy = window.scrollY;
      const dy = sy - lastScroll;
      lastScroll = sy;
      const raw = dy / dt;

      // Smooth velocity with realistic throttle & coasting inertia
      prevVel = vel;
      vel += (raw - vel) * (1 - Math.exp(-dt * (Math.abs(raw) > Math.abs(vel) ? 14 : 5.5)));
      const accel = (vel - prevVel) / dt;
      speedN = clamp(Math.abs(vel) / 2800);
      const g = clamp(accel / 50000, -1, 1);

      // BUTTERY SMOOTH WHEEL ROTATION:
      // Advances continuously based on speed & momentum (no stutter when dy === 0)
      const rollDelta = (Math.abs(vel) * 0.42 * dt + Math.abs(dy) * 0.32);
      rollPos = (rollPos + rollDelta) % 400;
      spinDeg = (spinDeg + (vel * 0.22 * dt + dy * 0.18)) % 360;
      blur += (clamp((speedN - 0.12) / 0.5) - blur) * (1 - Math.exp(-dt * 10));

      // Pitch: aerodynamic squat under power, forward dive under brake
      pitchV += (-100 * (pitch - g * 1.8) - 12 * pitchV) * dt;
      pitch += pitchV * dt;

      // Heave: aerodynamic downforce pressing chassis down at speed
      heaveV += (-140 * (heave - (g * 3.5 + speedN * 4.0)) - 10 * heaveV) * dt;
      heave += heaveV * dt;

      // Smooth subtle track seam vibrations
      travel += Math.abs(dy);
      if (!reduceMotion && travel > nextBump) {
        travel -= nextBump;
        nextBump = 180 + Math.random() * 240;
        heaveV -= (0.2 + Math.random() * 0.4) * (10 + speedN * 26);
        pitchV += (Math.random() - 0.5) * speedN * 3;
        leanV += (Math.random() - 0.5) * speedN * 1.5;
      }

      // Lateral chassis lean into cornering
      leanV += (-110 * (lean - carTurn * (1.8 + speedN * 2.6)) - 10 * leanV) * dt;
      lean += leanV * dt;

      // Steering damper
      steerV += (-160 * (steer - drive) - 18 * steerV) * dt;
      steer += steerV * dt;

      // Brake disc heat & glowing rotor intensity
      const heatT = clamp(speedN * 0.5 + clamp(-g * 1.3) * 0.85);
      heat += (heatT - heat) * (1 - Math.exp(-dt * (heatT > heat ? 3 : 0.8)));

      // Active brake light (illuminates strongly under deceleration)
      const brakeT = clamp(-g * 2.8);
      brake += (brakeT - brake) * (1 - Math.exp(-dt * 14));

      carTurn += (drive - carTurn) * (1 - Math.exp(-dt * 4.6));
    };

    const applyCar = () => {
      const car = carRef.current;
      if (!car) return;
      const intro = smooth(clamp(progress / 0.1));
      const t = performance.now() / 1000;
      const live = reduceMotion ? 0 : 1;

      // Refined high-frequency engine buzz & idle vibration
      const idle =
        (Math.sin(t * 2.2) * 0.35 + Math.sin(t * 31) * 0.25) * live;
      const buzzY =
        (Math.sin(t * 43) * 1.1 + Math.sin(t * 71) * 0.6) *
        speedN * live;
      const gust = Math.sin(t * 5.3) * wind * 0.6 * live;

      // Refined grounded transform (keeps car planted within its lane on the track)
      const sway = carTurn * (0.8 + speedN * 0.6); // subtle natural racing line
      const yawDeg = clamp(carTurn * 5.5, -6.5, 6.5); // subtle natural angle
      const rollDeg = clamp(lean * 0.45 + gust * 0.15, -2.5, 2.5); // natural chassis banking
      const pitchDeg = clamp(pitch * 0.4, -3.5, 3.5); // squat on throttle, dive on brake
      const scale = 1 + speedN * 0.015;
      const rise = (1 - intro) * 3;
      const y = clamp(heave * 0.35, -8, 8) + buzzY * 0.4 + idle;

      car.style.transform =
        `translateX(-50%) ` +
        `translate3d(${sway}vw, calc(${rise}vh + ${y}px), 0) ` +
        `scale(${scale}) ` +
        `perspective(1200px) ` +
        `rotateX(${-pitchDeg}deg) rotateY(${yawDeg}deg) rotateZ(${rollDeg}deg)`;

      // Pass wheel and aerodynamics properties to SVG
      setVar(car, "--roll-offset", `${rollPos.toFixed(1)}px`);
      setVar(car, "--spin", spinDeg.toFixed(1));
      setVar(car, "--roll-blur", blur.toFixed(2));
      setVar(car, "--steer-n", clamp(steer, -1, 1).toFixed(3));
      const steerDeg = clamp(
        steer * 24 + Math.sin(t * 2.7) * 0.5 * speedN * live,
        -26,
        26
      );
      setVar(car, "--steer-deg", steerDeg.toFixed(2));
      setVar(car, "--unsprung", (-heave * 0.35).toFixed(2));
      setVar(car, "--heat", heat.toFixed(2));
      setVar(car, "--brake", brake.toFixed(2));
      setVar(car, "--yaw-n", clamp(carTurn, -1, 1).toFixed(3));
    };

    let carRaf = 0;
    const carLoop = (now: number) => {
      stepCar(now);
      applyCar();
      carRaf = requestAnimationFrame(carLoop);
    };
    const kickCar = () => {
      if (!carRaf) {
        lastT = performance.now();
        carRaf = requestAnimationFrame(carLoop);
      }
    };

    const placeLogo = () => {
      if (!logoRef.current) return;
      const scale = Math.max(
        window.innerWidth / 1088,
        window.innerHeight / 780
      );
      const width = Math.min(84, Math.max(44, 66 * scale));
      const offsetX = (window.innerWidth - 1088 * scale) / 2;
      const offsetY = window.innerHeight - 780 * scale;

      logoRef.current.style.width = `${width}px`;
      logoRef.current.style.height = `${width * 0.758}px`;
      logoRef.current.style.left = `${Math.max(12, offsetX + 13 * scale)}px`;
      logoRef.current.style.top = `${Math.max(12, offsetY + 13 * scale)}px`;
    };

    // ---------- Road renderer (Matching Figma frame palette) ----------
    const roadCanvas = roadCanvasRef.current;
    const roadCtx = roadCanvas ? roadCanvas.getContext("2d") : null;
    const sizeRoad = () => {
      if (!roadCanvas || !roadCtx) return;
      const ratio = window.devicePixelRatio || 1;
      roadCanvas.width = window.innerWidth * ratio;
      roadCanvas.height = window.innerHeight * ratio;
      roadCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const frac = (v: number) => v - Math.floor(v);

    // Traffic cars on circuit
    const TRAFFIC = [
      { lane: -0.52, c: 3.2, v: 0.86, a: "#8f1220", b: "#26060c", brake: 0.0 },
      { lane: 0.14, c: 9.4, v: 0.9, a: "#343844", b: "#0f1014", brake: 0.5 },
      { lane: 0.58, c: 6.1, v: 0.83, a: "#b0851c", b: "#483606", brake: 0.2 },
      { lane: -0.22, c: 13.2, v: 0.88, a: "#282a30", b: "#0a0b0e", brake: 0.8 },
      { lane: 0.46, c: 15.0, v: 0.85, a: "#7d101d", b: "#1c0408", brake: 0.35 },
    ];
    const Z_MIN = 1.9;
    const Z_MAX = 16;

    const rr = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const drawTraffic = (dist: number, curve: number, pass: number) => {
      const ctx = roadCtx;
      if (!ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const hz = Math.round(H * 0.38);
      const rows = H - hz;
      const range = Z_MAX - Z_MIN;
      const now = reduceMotion ? 0 : performance.now() / 1000;

      const cars = TRAFFIC.map((c, i) => {
        const raw = c.c - 1.222 * dist * (1 - c.v);
        const z = Z_MIN + (((raw % range) + range) % range);
        return { ...c, i, z };
      }).sort((p, q) => q.z - p.z);

      cars.forEach((c) => {
        const t = 1 / c.z;
        const y = hz + t * rows;
        const half = W * 0.58 * t;
        const cx = roadCx(t, curve, dist, W);
        const drift = Math.sin(now * 0.6 + c.i * 2.1) * 0.05;
        const x = cx + (c.lane + drift) * half;
        const w = half * 0.3;
        const h = w * 0.5;
        const alpha =
          clamp((c.z - Z_MIN) / 0.9) * clamp((Z_MAX - c.z) / 2.5);
        if (alpha <= 0.01 || w < 2) return;

        if (pass === 0) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.beginPath();
          ctx.ellipse(x, y, w * 0.62, Math.max(1, w * 0.07), 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#040507";
          ctx.fillRect(x - w * 0.5, y - h * 0.42, w * 0.15, h * 0.42);
          ctx.fillRect(x + w * 0.35, y - h * 0.42, w * 0.15, h * 0.42);

          const body = ctx.createLinearGradient(0, y - h * 0.64, 0, y - h * 0.1);
          body.addColorStop(0, c.a);
          body.addColorStop(1, c.b);
          ctx.fillStyle = body;
          rr(ctx, x - w / 2, y - h * 0.64, w, h * 0.52, Math.max(1, w * 0.06));
          ctx.fill();

          const glass = ctx.createLinearGradient(0, y - h, 0, y - h * 0.62);
          glass.addColorStop(0, "#191820");
          glass.addColorStop(1, "#040507");
          ctx.fillStyle = glass;
          ctx.beginPath();
          ctx.moveTo(x - w * 0.42, y - h * 0.62);
          ctx.lineTo(x - w * 0.3, y - h);
          ctx.lineTo(x + w * 0.3, y - h);
          ctx.lineTo(x + w * 0.42, y - h * 0.62);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = c.b;
          ctx.fillRect(x - w * 0.54, y - h * 0.7, w * 1.08, Math.max(1, h * 0.08));
          ctx.globalAlpha = 1;
        } else {
          const braking = Math.sin(now * 0.8 + c.i * 1.7) > 1 - c.brake;
          const power = braking ? 1 : 0.55;
          const ly = y - h * 0.5;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = alpha;
          [-1, 1].forEach((s) => {
            const lx = x + s * w * 0.34;
            const r = w * (braking ? 0.3 : 0.2);
            const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
            g.addColorStop(0, `rgba(255,50,65,${0.9 * power})`);
            g.addColorStop(0.4, `rgba(220,18,32,${0.45 * power})`);
            g.addColorStop(1, "rgba(220,18,32,0)");
            ctx.fillStyle = g;
            ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
          });
          ctx.fillStyle = `rgba(255,45,60,${0.85 * power})`;
          ctx.fillRect(x - w * 0.44, ly - h * 0.03, w * 0.88, Math.max(1, h * 0.07));
          ctx.restore();
        }
      });
    };

    const hash = (n: number) => frac(Math.sin(n * 12.9898) * 43758.5453);

    const drawRoad = (dist: number, curve: number) => {
      const ctx = roadCtx;
      if (!ctx) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const hz = Math.round(H * 0.38);
      const rows = H - hz;

      // --- DUSKY WINE / BURGUNDY SKY (Matching Figma frame) ---
      const sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, "#070506");
      sky.addColorStop(0.45, "#100b0e");
      sky.addColorStop(0.75, "#1a1115");
      sky.addColorStop(1, "#28171c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hz + 1);

      // --- Distant tree line + floodlight towers ---
      const par = -curve * W * 0.05;
      ctx.fillStyle = "#070608";
      ctx.beginPath();
      ctx.moveTo(0, hz);
      for (let x = -10; x <= W + 10; x += 5) {
        const h =
          5 + Math.sin((x - par) * 0.012) * 4 + hash(Math.floor((x - par) / 5)) * 9;
        ctx.lineTo(x, hz - h);
      }
      ctx.lineTo(W + 10, hz);
      ctx.fill();

      [0.12, 0.31, 0.7, 0.88].forEach((p, i) => {
        const lx = W * p + par * (1 + i * 0.1);
        ctx.fillStyle = "#09080c";
        ctx.fillRect(lx - 1, hz - 26, 2, 26);
        ctx.fillStyle = "rgba(255,232,210,0.85)";
        ctx.fillRect(lx - 7, hz - 30, 14, 3);
        const g = ctx.createRadialGradient(lx, hz - 28, 0, lx, hz - 28, 34);
        g.addColorStop(0, "rgba(255,220,190,0.3)");
        g.addColorStop(1, "rgba(255,220,190,0)");
        ctx.fillStyle = g;
        ctx.fillRect(lx - 34, hz - 62, 68, 68);
      });

      // --- Ground, row by row (far -> near) ---
      const roadHalfBase = W * 0.58;
      for (let y = hz; y < H; y++) {
        const t = Math.max(0.001, (y - hz) / rows);
        const z = 1 / t;
        const cx = roadCx(t, curve, dist, W);
        const half = roadHalfBase * t;
        const phase = z * 1.8 + dist * 2.2;
        const stripe = frac(phase) < 0.5;
        const lit = 0.55 + t * 0.45;

        // Dark circuit run-off & textured gravel (no green grass)
        const gr = stripe ? 14 : 11;
        ctx.fillStyle = `rgb(${((gr + 3) * lit) | 0},${(gr * lit) | 0},${((gr + 2) * lit) | 0})`;
        ctx.fillRect(0, y, W, 1);

        // Dark tarmac run-off
        const ro = 24 * lit;
        ctx.fillStyle = `rgb(${((ro + 2) * lit) | 0},${(ro * lit) | 0},${((ro + 3) * lit) | 0})`;
        ctx.fillRect(cx - half * 1.36, y, half * 2.72, 1);

        // Dark wine / burgundy barriers with red edge highlight (matching Figma frame)
        const bw = Math.max(1.5, half * 0.035);
        const wh = Math.max(1, half * 0.055);
        const bx = half * 1.36;
        const post = frac(phase * 2) < 0.12;
        ctx.fillStyle = post
          ? "#140e11"
          : `rgb(${(34 * lit) | 0},${(22 * lit) | 0},${(28 * lit) | 0})`;
        ctx.fillRect(cx - bx - bw, y - wh, bw, wh + 1);
        ctx.fillRect(cx + bx, y - wh, bw, wh + 1);
        ctx.fillStyle = `rgba(160,25,38,${0.35 * lit})`;
        ctx.fillRect(cx - bx - bw, y - wh, bw, 1.5);
        ctx.fillRect(cx + bx, y - wh, bw, 1.5);

        // Asphalt with fine aggregate noise
        const n = hash(Math.floor(phase * 40) + y * 0.37);
        const a = (18 + t * 14 + n * 3) | 0;
        ctx.fillStyle = `rgb(${a + 2},${a},${a + 4})`;
        ctx.fillRect(cx - half, y, half * 2, 1);

        // Rubbered racing line
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.fillRect(cx - half * 0.46, y, half * 0.3, 1);
        ctx.fillRect(cx + half * 0.16, y, half * 0.3, 1);

        // Silvery sheen down the track
        ctx.fillStyle = `rgba(225,220,235,${0.05 * t})`;
        ctx.fillRect(cx - half * 0.55, y, half * 1.1, 1);

        // Kerbs (Racing Crimson & Silvery White)
        const kw = Math.max(2, half * 0.07);
        const red = frac(z * 2.4 + dist * 2.93) < 0.5;
        ctx.fillStyle = red
          ? `rgb(${(180 * lit) | 0},${(18 * lit) | 0},${(28 * lit) | 0})`
          : `rgb(${(205 * lit) | 0},${(205 * lit) | 0},${(212 * lit) | 0})`;
        ctx.fillRect(cx - half - kw, y, kw, 1);
        ctx.fillRect(cx + half, y, kw, 1);

        // White track-limit lines
        const lw = Math.max(1, half * 0.014);
        ctx.fillStyle = "rgba(230,230,235,0.85)";
        ctx.fillRect(cx - half * 0.97, y, lw, 1);
        ctx.fillRect(cx + half * 0.97 - lw, y, lw, 1);

        // Starting grid chequer lines
        if (frac(phase / 18) < 0.012) {
          ctx.fillStyle = "rgba(225,225,230,0.5)";
          ctx.fillRect(cx - half, y, half * 2, 1);
        }
      }

      // --- PROJECT AAROHAN INFINITY LOGO ON ASPHALT (Matching Figma Frame) ---
      if (dist < 3.5 && roadLogoRef.current && roadLogoRef.current.complete) {
        const logoZ = 2.3 - DEPTH_RATE * dist;
        if (logoZ > 0.75 && logoZ < 8.0) {
          const t = 1 / logoZ;
          const groundY = hz + t * rows;
          const cx = roadCx(t, curve, dist, W);
          const logoW = W * 0.84 * t;
          const logoH = logoW * (409 / 1024) * 0.38; // perspective foreshortened
          const alpha = clamp((logoZ - 0.7) / 0.5) * clamp((7.5 - logoZ) / 2.5);

          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = alpha * 0.9;
          ctx.drawImage(
            roadLogoRef.current,
            cx - logoW / 2,
            groundY - logoH * 0.85,
            logoW,
            logoH
          );
          ctx.restore();
        }
      }

      drawTraffic(dist, curve, 0);

      // --- Atmosphere: moody wine haze, headlight pool, vignette ---
      const fog = ctx.createLinearGradient(0, hz - 6, 0, hz + rows * 0.45);
      fog.addColorStop(0, "rgba(40, 23, 28, 0.95)");
      fog.addColorStop(0.35, "rgba(20, 12, 16, 0.65)");
      fog.addColorStop(0.7, "rgba(10, 7, 10, 0.2)");
      fog.addColorStop(1, "rgba(6, 4, 6, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, hz - 6, W, rows * 0.45 + 6);

      const pool = ctx.createRadialGradient(
        W / 2,
        H * 0.95,
        0,
        W / 2,
        H * 0.95,
        W * 0.55
      );
      pool.addColorStop(0, "rgba(255,235,240,0.06)");
      pool.addColorStop(1, "rgba(255,235,240,0)");
      ctx.fillStyle = pool;
      ctx.fillRect(0, hz, W, rows);

      drawTraffic(dist, curve, 1);

      const vig = ctx.createRadialGradient(
        W / 2,
        H * 0.6,
        H * 0.35,
        W / 2,
        H * 0.6,
        Math.max(W, H) * 0.8
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(4,2,4,0.65)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };

    // ---------- Overhead gantry banner update ----------
    const updateBanner = () => {
      const el = bannerRef.current;
      if (!el) return;

      const dist = progress * panelsCount * DIST_PER_PANEL;
      const z = BANNER_Z - DEPTH_RATE * dist;

      if (z <= BANNER_GONE_Z) {
        el.style.display = "none";
        return;
      }

      const W = window.innerWidth;
      const H = window.innerHeight;
      const hz = Math.round(H * 0.38);

      const tr = 1 / z;
      const baseY = hz + tr * (H - hz);
      const s = (1.3 * W * tr) / 1000;
      const dx = roadCx(tr, turn, dist, W) - W / 2;

      el.style.display = "block";
      el.style.opacity = clamp((z - BANNER_GONE_Z) / 0.35).toString();
      el.style.transform = `translate(calc(-50% + ${dx}px), ${
        baseY - 600
      }px) scale(${s})`;
    };

    // ---------- Roadside event billboards ----------
    const updateBillboards = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const hz = Math.round(H * 0.38);
      const dist = progress * panelsCount * DIST_PER_PANEL;
      const gate = clamp(progress * 30);

      let nearest = 0;
      let nearestGap = Infinity;

      billboardRefs.current.forEach((el, i) => {
        if (!el) return;
        const z = BILL_Z0 + i * BILL_SPACING - DEPTH_RATE * dist;

        const gap = Math.abs(z - BILL_FOCUS_Z);
        if (gap < nearestGap) {
          nearestGap = gap;
          nearest = i;
        }

        if (z <= BILL_GONE_Z || z >= BILL_FAR_Z + 3) {
          el.style.display = "none";
          return;
        }

        const side = billSide(i);
        const t = 1 / z;
        const groundY = hz + t * (H - hz);
        const s = (BILL_WIDTH_U * W * t) / BILLBOARD_WIDTH;
        const x = roadCx(t, turn, dist, W) + side * BILL_OFFSET * W * t;

        el.style.display = "block";
        el.style.opacity = (
          clamp((BILL_FAR_Z - z) / 3) *
          clamp((z - BILL_GONE_Z) / 0.4) *
          gate
        ).toString();
        el.style.transform = `translate(${x}px, ${groundY}px) scale(${s}) translate(-50%, -100%)`;
        el.style.zIndex = String(
          1 + Math.round((1 - clamp((z - BILL_GONE_Z) / BILL_FAR_Z)) * 3)
        );
        el.style.setProperty(
          "--lit",
          clamp(1 - Math.abs(z - BILL_FOCUS_Z) / 4).toFixed(2)
        );
      });

      setActiveDotIndex(nearest);
    };

    // ---------- Main scroll update ----------
    const update = () => {
      const track = document.getElementById("track");
      const trackTop = track?.offsetTop ?? window.innerHeight;
      const trackLength = Math.max(
        1,
        (track?.clientHeight ?? window.innerHeight) - window.innerHeight
      );
      progress = clamp((window.scrollY - trackTop) / trackLength);
      const section = progress * panelsCount;

      const intro = smooth(clamp(progress / 0.05));
      turn = Math.sin((section + BILL_TURN_PHASE) * Math.PI) * intro;
      zigAmp = 1 - smooth(clamp((progress - 0.04) / 0.14));
      const zDist = progress * panelsCount * DIST_PER_PANEL;

      drive = clamp(
        turn +
          zigAmp * 0.6 * smooth(clamp(progress / 0.02)) *
            Math.sin(ZIG_K * (4 + 1.222 * zDist)),
        -1.2,
        1.2
      );

      drawRoad(progress * panelsCount * DIST_PER_PANEL, turn);
      updateBanner();
      updateBillboards();
      kickCar();

      const path = miniPathRef.current;
      const dot = miniDotRef.current;
      if (path && dot) {
        const len = path.getTotalLength();
        const pt = path.getPointAtLength(progress * len);
        dot.setAttribute("cx", pt.x.toString());
        dot.setAttribute("cy", pt.y.toString());
      }
      if (miniWrapRef.current) {
        miniWrapRef.current.style.transform = `rotate(${-turn * 24}deg)`;
        miniWrapRef.current.style.opacity = clamp(progress * 30).toString();
      }

      if (hintRef.current) {
        hintRef.current.style.opacity = clamp(1 - progress * 10).toString();
      }

      updateGlints(progress);
      applyCar();
    };

    // ---------- Wind lines ----------
    const canvas = windCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const STREAKS = 90;
    interface Streak {
      angle: number;
      t: number;
      speed: number;
      length: number;
      width: number;
      alpha: number;
    }

    const newStreak = (spread: boolean): Streak => ({
      angle: Math.random() * Math.PI * 2,
      t: spread ? Math.random() : 0,
      speed: 0.5 + Math.random() * 0.9,
      length: 0.06 + Math.random() * 0.14,
      width: 0.6 + Math.random() * 1.1,
      alpha: 0.25 + Math.random() * 0.45,
    });

    const streaks: Streak[] = Array.from({ length: STREAKS }, () =>
      newStreak(true)
    );
    let lastY = window.scrollY;
    let windRunning = false;
    let windRaf = 0;

    const sizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawWind = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h * 0.64;
      const reach = Math.hypot(w, h) * 0.62;

      const speed = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      wind += (clamp(speed / 45) - wind) * (speed > 0 ? 0.18 : 0.06);

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";

      streaks.forEach((s) => {
        s.t += s.speed * (0.004 + wind * 0.05);
        if (s.t > 1) Object.assign(s, newStreak(false));

        const head = s.t * s.t;
        const tail = Math.max(0, s.t - s.length * (0.4 + wind)) ** 2;

        const turnAngle = s.angle + turn * 0.5;
        const cos = Math.cos(turnAngle);
        const sin = Math.sin(turnAngle);
        const alpha =
          s.alpha *
          wind *
          Math.min(1, s.t * 2.5) *
          (1 - Math.max(0, s.t - 0.85) * 5);

        ctx.strokeStyle = `rgba(215, 205, 218, ${Math.max(0, alpha)})`;
        ctx.lineWidth = s.width * (0.5 + s.t);
        ctx.beginPath();
        ctx.moveTo(cx + cos * tail * reach, cy + sin * tail * reach);
        ctx.lineTo(cx + cos * head * reach, cy + sin * head * reach);
        ctx.stroke();
      });

      applyCar();

      if (wind > 0.01) {
        windRaf = requestAnimationFrame(drawWind);
      } else {
        windRunning = false;
        windRaf = 0;
        wind = 0;
        ctx.clearRect(0, 0, w, h);
        applyCar();
      }
    };

    const startWind = () => {
      if (reduceMotion || windRunning) return;
      windRunning = true;
      windRaf = requestAnimationFrame(drawWind);
    };

    let waiting = false;
    const onScroll = () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(() => {
        update();
        waiting = false;
      });
      startWind();
    };

    const handleResize = () => {
      placeLogo();
      sizeCanvas();
      sizeRoad();
      update();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    placeLogo();
    sizeCanvas();
    sizeRoad();
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(carRaf);
      cancelAnimationFrame(windRaf);
    };
  }, [allEvents]);

  const jumpToEvent = (index: number) => {
    const track = document.getElementById("track");
    const trackTop = track?.offsetTop ?? window.innerHeight;
    const trackLength = Math.max(
      1,
      (track?.clientHeight ?? window.innerHeight) - window.innerHeight
    );
    const target =
      (BILL_Z0 - BILL_FOCUS_Z + index * BILL_SPACING) /
      (allEvents.length * BILL_SPACING);
    window.scrollTo({
      top: trackTop + Math.min(1, Math.max(0, target)) * trackLength,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div
        id="track"
        style={{
          height: `${Math.max(500, allEvents.length * VH_PER_EVENT)}vh`,
        }}
      />

      <div
        id="stage"
        className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#070506] via-[#100b0e] to-[#181015]"
      >
        <canvas
          ref={roadCanvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        <canvas
          ref={windCanvasRef}
          id="wind"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Top-left AR Monogram Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoRef}
          id="logo"
          src="/assets/logo.png"
          alt="Aarohan logo"
          className="absolute z-10 mix-blend-screen opacity-95 pointer-events-none"
        />

        {/* Minimap circuit track */}
        <div
          ref={miniWrapRef}
          aria-hidden="true"
          className="absolute right-12 top-5 z-10 w-[168px] h-[103px] opacity-0 pointer-events-none will-change-transform"
        >
          <svg viewBox="0 0 176 108" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <path d={CIRCUIT} fill="none" stroke="#060608" strokeWidth="11" strokeLinejoin="round" />
            <path ref={miniPathRef} d={CIRCUIT} fill="none" stroke="#2b2d35" strokeWidth="7" strokeLinejoin="round" />
            <path d={CIRCUIT} pathLength="100" fill="none" stroke="#e0182d" strokeWidth="1.6" strokeDasharray="33.3 66.7" strokeDashoffset="0" />
            <path d={CIRCUIT} pathLength="100" fill="none" stroke="#c9a227" strokeWidth="1.6" strokeDasharray="33.3 66.7" strokeDashoffset="-33.3" />
            <path d={CIRCUIT} pathLength="100" fill="none" stroke="#3a60a0" strokeWidth="1.6" strokeDasharray="33.4 66.6" strokeDashoffset="-66.6" />
            <path d={CIRCUIT} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" strokeDasharray="2 3" strokeLinejoin="round" />
            <path d="M23.5 72H32.5" stroke="#f1f1f1" strokeWidth="2.4" strokeDasharray="2 2" />
            <circle ref={miniDotRef} r="4" fill="#fff" stroke="#e0182d" strokeWidth="2" />
          </svg>
        </div>

        {/* Road gantry: AAROHAN LOADING... */}
        <RoadBanner bannerRef={bannerRef} />

        {/* High-fidelity race car */}
        {carElement}

        {/* Roadside event billboards */}
        {allEvents.map((event, index) => (
          <RoadBillboard
            key={`${event.id}-${index}`}
            event={event}
            side={billSide(index)}
            billboardRef={(el) => {
              billboardRefs.current[index] = el;
            }}
          />
        ))}

        {/* Navigation dots */}
        <div
          id="dots"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5"
        >
          {allEvents.map((event, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to ${event.title}`}
              onClick={() => jumpToEvent(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeDotIndex === idx
                  ? "bg-[#e0182d] shadow-[0_0_10px_#ff233b] scale-150"
                  : "bg-[#383138] hover:bg-[#685d68]"
              }`}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <div
          ref={hintRef}
          id="hint"
          className="absolute left-1/2 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 text-[#9e8b93] text-[11px] tracking-[4px] z-10"
        >
          SCROLL TO RACE
        </div>
      </div>
    </>
  );
};
