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

// Road depth scrolls at 1.222 per unit of `dist` (same rate as the grass
// stripes / kerbs), so anything at a fixed world depth is "planted".
const DEPTH_RATE = 1.222;
const BANNER_Z = 4.5; // world depth of the gantry at dist = 0 (car is at z = 1)
const BANNER_GONE_Z = 0.4; // depth at which the gantry is fully behind the car

// ---- Roadside billboards (one per event, on the outside of alternating bends) ----
// Billboard i stands at world depth BILL_Z0 + i * BILL_SPACING (at dist = 0).
// The scroll length is sized so the road advances exactly BILL_SPACING of depth
// per event: dist = progress * panelCount * DIST_PER_PANEL.
const BILL_SPACING = 9; // depth between consecutive billboards
const BILL_Z0 = 11; // depth of the first billboard at dist = 0
const BILL_FOCUS_Z = 3.4; // depth at which a board is fully readable (jump target)
const BILL_GONE_Z = 1.25; // depth at which a board has swept off the screen
const BILL_FAR_Z = 15; // beyond this a board is invisible (fades in from here)
const BILL_WIDTH_U = 1.2; // world width of a board, in road-width units (road half-width = 0.58)
// board's inner edge stays just clear of the armco barrier (~0.79)
const BILL_OFFSET = 0.86 + BILL_WIDTH_U / 2; // lateral offset of the board centre from road centre
const VH_PER_EVENT = 90; // scroll length per event
const DIST_PER_PANEL = BILL_SPACING / DEPTH_RATE; // dist = progress * panelCount * DIST_PER_PANEL

// ---- Boards sit on the bends ----
// The road bend is turn = sin((section + BILL_TURN_PHASE) * PI), where
// section = progress * panelCount. The phase is chosen so that board i reaches
// its readable depth exactly at the peak of a bend, with the bend direction
// alternating (+1, -1, +1, ...). When the road swings right (turn > 0) the open
// ground is on the LEFT, so the board stands there, and vice versa: the board
// always sits on the outside of the corner, in clear view.
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

  // "AAROHAN AHEAD" road gantry
  const bannerRef = useRef<HTMLDivElement | null>(null);
  // Traffic signal planted beside the gantry (same depth, removed with it)
  const signalRef = useRef<HTMLDivElement | null>(null);

  // Curved running-track canvas
  const roadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rotating circuit minimap
  const miniWrapRef = useRef<HTMLDivElement | null>(null);
  const miniPathRef = useRef<SVGPathElement | null>(null);
  const miniDotRef = useRef<SVGCircleElement | null>(null);

  // The car is driven imperatively, so build its element once and never re-render it
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
    const HOOD_TOP = 250;
    const HOOD_BOTTOM = 520;
    const HOOD_TOP_L = 478;
    const HOOD_TOP_R = 522;
    const HOOD_BOT_L = 190;
    const HOOD_BOT_R = 810;
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

    const updateGlints = (progress: number) => {
      const phase = progress * 70;
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
          (0.15 * Math.sin(t * Math.PI) * clamp(progress * 20)).toString()
        );
      });
    };

    // ---------- Shared animation state ----------
    let progress = 0;
    let wind = 0;
    let turn = 0;
    let carTurn = 0;
    let drive = 0; // steering demand for the car (road bend + zig-zag)

    // ---------- Zig-zag opening ----------
    // The road opens as a chicane of S-bends that scrolls toward the car and
    // eases back into the normal curves (zigAmp 1 -> 0 over the first ~18%).
    const ZIG_K = 1.0; // bends per unit of depth (higher = tighter zig-zag)
    let zigAmp = 1;
    const roadCx = (t: number, curve: number, dist: number, W: number) => {
      const base = curve * W * 0.92 * Math.pow(Math.max(0, 1 - t), 1.7);
      if (zigAmp < 0.001) return W / 2 + base;
      const z = 1 / Math.max(t, 0.001);
      // zero at the car, zero at the horizon (avoids aliasing), full in between
      const env =
        Math.pow(Math.max(0, 1 - t), 1.2) * smooth(clamp((t - 0.05) / 0.1));
      // same depth-scroll rate as the grass stripes, so it moves with the road
      return (
        W / 2 + base + zigAmp * W * 0.2 * env * Math.sin(ZIG_K * (z + 1.222 * dist))
      );
    };

    // ---------- Vehicle dynamics ----------
    // Everything the car "feels" comes from scroll velocity/acceleration fed
    // through springs, so it reacts like a real chassis: squat on throttle,
    // dive on lift, outward body roll in corners, bumps from the road seams.
    let lastT = performance.now();
    let lastScroll = window.scrollY;
    let vel = 0; // smoothed signed scroll speed (px/s)
    let prevVel = 0;
    let rollPos = 0; // tread travel (stroke units), wraps at 840
    let spinDeg = 0; // wheel angle, wraps at 360
    let pitch = 0, pitchV = 0; // deg
    let heave = 0, heaveV = 0; // px, + = down
    let lean = 0, leanV = 0; // body roll, deg
    let steer = 0, steerV = 0; // -1..1
    let heat = 0; // brake disc heat 0..1
    let blur = 0; // tyre motion-blur 0..1
    let speedN = 0; // 0..1
    let travel = 0;
    let nextBump = 180;
    let shownKmh = -1;
    let shownLeds = -1;
    let hudSpeed: Element | null = null;
    let leds: SVGElement[] = [];

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

      // quick to pick up speed, slower to coast down
      prevVel = vel;
      vel += (raw - vel) * (1 - Math.exp(-dt * (Math.abs(raw) > Math.abs(vel) ? 16 : 6)));
      const accel = (vel - prevVel) / dt;
      speedN = clamp(Math.abs(vel) / 3000);
      const g = clamp(accel / 60000, -1, 1); // + accelerating, - braking

      // tyres turn exactly with the road: tied to scroll distance (reverses too)
      rollPos = (rollPos + dy * 0.55) % 840;
      spinDeg = (spinDeg + dy * 0.32) % 360;
      blur += (clamp((speedN - 0.15) / 0.45) - blur) * (1 - Math.exp(-dt * 12));

      // pitch: nose lifts on throttle, dives on lift/brake
      pitchV += (-90 * (pitch - g * 2.4) - 11 * pitchV) * dt;
      pitch += pitchV * dt;

      // heave: squat under accel + aero downforce pressing the car down
      heaveV += (-140 * (heave - (g * 5 + speedN * 5)) - 9 * heaveV) * dt;
      heave += heaveV * dt;

      // road seams / kerb joints: periodic thumps tied to distance covered
      travel += Math.abs(dy);
      if (!reduceMotion && travel > nextBump) {
        travel -= nextBump;
        nextBump = 140 + Math.random() * 260;
        heaveV -= (0.3 + Math.random() * 0.7) * (20 + speedN * 60);
        pitchV += (Math.random() - 0.5) * speedN * 6;
        leanV += (Math.random() - 0.5) * speedN * 2;
      }

      // body roll: leans INWARD to emphasize the cornering dive
      leanV += (-110 * (lean - carTurn * (2.5 + speedN * 4.5)) - 10 * leanV) * dt;
      lean += leanV * dt;

      // steering: slightly under-damped so it overshoots/settles like a driver
      steerV += (-160 * (steer - drive) - 18 * steerV) * dt;
      steer += steerV * dt;

      // brake disc heat
      const heatT = clamp(speedN * 0.55 + clamp(-g * 1.2) * 0.8);
      heat += (heatT - heat) * (1 - Math.exp(-dt * (heatT > heat ? 3 : 0.8)));

      carTurn += (drive - carTurn) * (1 - Math.exp(-dt * 4.4));
    };

    const applyCar = () => {
      const car = carRef.current;
      if (!car) return;
      const intro = smooth(clamp(progress / 0.1));
      const t = performance.now() / 1000;
      const live = reduceMotion ? 0 : 1;

      // engine idle shudder + speed-dependent chassis buzz (stronger over kerbs)
      const idle =
        (Math.sin(t * 2.2) * 0.5 + Math.sin(t * 31) * 0.35 + Math.sin(t * 47) * 0.2) * live;
      const buzzY =
        (Math.sin(t * 43) * 1.5 + Math.sin(t * 71) * 0.9 + Math.sin(t * 113) * 0.5) *
        speedN * live * (1 + Math.abs(carTurn) * 0.6);
      const buzzX = Math.sin(t * 53) * 1.1 * speedN * live;
      const gust = Math.sin(t * 5.3) * wind * 0.8 * live;

      // The car stays planted in frame: the road bends around it, so only a
      // hint of yaw/roll remains (the steering wheel and front tyres still turn).
      const yaw = carTurn * 8;
      const sway = carTurn * (1.5 + speedN * 2.0); // positive to sway into the corner
      const rollDeg = lean + buzzX * 0.2 + gust * 0.3;
      const scale = 1 + progress * 0.03 + speedN * 0.025;
      const rise = (1 - intro) * 5;
      const y = heave + buzzY + idle;

      car.style.transform =
        `translateX(-50%) ` +
        `translate3d(${sway + buzzX * 0.1}vw, calc(${rise}vh + ${y}px), 0) ` +
        `scale(${scale}) perspective(700px) rotateX(${-pitch}deg) rotateY(${yaw}deg) rotate(${rollDeg}deg)`;

      // wheel / cockpit variables consumed by Carsvg
      setVar(car, "--roll-offset", `${(-rollPos).toFixed(1)}px`);
      setVar(car, "--spin", spinDeg.toFixed(1));
      setVar(car, "--roll-blur", blur.toFixed(2));
      setVar(car, "--steer-n", clamp(steer, -1.3, 1.3).toFixed(3));
      setVar(
        car,
        "--steer-deg",
        (clamp(steer, -1.3, 1.3) * 34 + Math.sin(t * 2.7) * 0.8 * speedN * live).toFixed(2)
      );
      setVar(car, "--unsprung", (-heave * 0.45).toFixed(2)); // tyres lag the body
      setVar(car, "--heat", heat.toFixed(2));

      // HUD: live speed + shift lights
      if (!hudSpeed) hudSpeed = car.querySelector("#hud-speed");
      if (leds.length === 0)
        leds = Array.from(car.querySelectorAll<SVGElement>(".shift-led"));
      const kmh = Math.round((speedN * 326) / 2) * 2;
      if (hudSpeed && kmh !== shownKmh) {
        shownKmh = kmh;
        hudSpeed.textContent = `${kmh} km/h`;
      }
      const lit = Math.round(speedN * leds.length);
      if (lit !== shownLeds) {
        shownLeds = lit;
        leds.forEach((l, i) => (l.style.opacity = i < lit ? "1" : "0.16"));
      }
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

    // ---------- Road renderer ----------
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

    // ---------- Traffic: small cars moving ahead on the circuit ----------
    const TRAFFIC = [
      { lane: -0.52, c: 3.2, v: 0.86, a: "#dfe2e8", b: "#8b9099", brake: 0.0 },
      { lane: 0.14, c: 9.4, v: 0.9, a: "#24365c", b: "#0b1220", brake: 0.5 },
      { lane: 0.58, c: 6.1, v: 0.83, a: "#c9a21c", b: "#6a5207", brake: 0.2 },
      { lane: -0.22, c: 13.2, v: 0.88, a: "#33363c", b: "#0e0f12", brake: 0.8 },
      { lane: 0.46, c: 15.0, v: 0.85, a: "#8f1220", b: "#2a050a", brake: 0.35 },
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

    // pass 0 = bodies (before haze), pass 1 = tail-light glow (after haze)
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
      }).sort((p, q) => q.z - p.z); // far first

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
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.beginPath();
          ctx.ellipse(x, y, w * 0.62, Math.max(1, w * 0.07), 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#050506"; // tyres
          ctx.fillRect(x - w * 0.5, y - h * 0.42, w * 0.15, h * 0.42);
          ctx.fillRect(x + w * 0.35, y - h * 0.42, w * 0.15, h * 0.42);

          const body = ctx.createLinearGradient(0, y - h * 0.64, 0, y - h * 0.1);
          body.addColorStop(0, c.a);
          body.addColorStop(1, c.b);
          ctx.fillStyle = body;
          rr(ctx, x - w / 2, y - h * 0.64, w, h * 0.52, Math.max(1, w * 0.06));
          ctx.fill();

          const glass = ctx.createLinearGradient(0, y - h, 0, y - h * 0.62);
          glass.addColorStop(0, "#222b3a");
          glass.addColorStop(1, "#05070b");
          ctx.fillStyle = glass; // cabin
          ctx.beginPath();
          ctx.moveTo(x - w * 0.42, y - h * 0.62);
          ctx.lineTo(x - w * 0.3, y - h);
          ctx.lineTo(x + w * 0.3, y - h);
          ctx.lineTo(x + w * 0.42, y - h * 0.62);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.18)"; // roof sheen
          ctx.fillRect(x - w * 0.3, y - h, w * 0.6, Math.max(1, h * 0.05));

          ctx.fillStyle = c.b; // spoiler
          ctx.fillRect(x - w * 0.54, y - h * 0.7, w * 1.08, Math.max(1, h * 0.08));
          ctx.fillStyle = "#050506"; // diffuser
          ctx.fillRect(x - w * 0.4, y - h * 0.2, w * 0.8, h * 0.14);
          ctx.fillStyle = "rgba(255,255,255,0.35)"; // plate
          ctx.fillRect(x - w * 0.09, y - h * 0.42, w * 0.18, Math.max(1, h * 0.09));
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
            g.addColorStop(0, `rgba(255,70,70,${0.9 * power})`);
            g.addColorStop(0.4, `rgba(220,20,30,${0.45 * power})`);
            g.addColorStop(1, "rgba(220,20,30,0)");
            ctx.fillStyle = g;
            ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
          });
          ctx.fillStyle = `rgba(255,60,60,${0.85 * power})`;
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

      // --- dusk sky ---
      const sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, "#04060b");
      sky.addColorStop(0.55, "#0c1220");
      sky.addColorStop(0.88, "#241f2c");
      sky.addColorStop(1, "#4a3434");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hz + 1);

      // --- distant tree line + floodlight towers (parallax with the bend) ---
      const par = -curve * W * 0.05;
      ctx.fillStyle = "#06080b";
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
        ctx.fillStyle = "#0a0c10";
        ctx.fillRect(lx - 1, hz - 26, 2, 26);
        ctx.fillStyle = "rgba(255,236,205,0.9)";
        ctx.fillRect(lx - 7, hz - 30, 14, 3);
        const g = ctx.createRadialGradient(lx, hz - 28, 0, lx, hz - 28, 34);
        g.addColorStop(0, "rgba(255,226,180,0.35)");
        g.addColorStop(1, "rgba(255,226,180,0)");
        ctx.fillStyle = g;
        ctx.fillRect(lx - 34, hz - 62, 68, 68);
      });

      // --- ground, row by row (far -> near) ---
      const roadHalfBase = W * 0.58;
      for (let y = hz; y < H; y++) {
        const t = Math.max(0.001, (y - hz) / rows);
        const z = 1 / t;
        const cx = roadCx(t, curve, dist, W);
        const half = roadHalfBase * t;
        const phase = z * 1.8 + dist * 2.2;
        const stripe = frac(phase) < 0.5;
        const lit = 0.55 + t * 0.45; // nearer = lit by headlights

        // mown grass stripes
        const gr = stripe ? 15 : 12;
        ctx.fillStyle = `rgb(${gr * lit | 0},${(gr * 2.3 * lit) | 0},${(gr * 1.1 * lit) | 0})`;
        ctx.fillRect(0, y, W, 1);

        // tarmac run-off
        const ro = 30 * lit;
        ctx.fillStyle = `rgb(${ro | 0},${ro | 0},${(ro + 2) | 0})`;
        ctx.fillRect(cx - half * 1.36, y, half * 2.72, 1);

        // armco barrier (drawn with height so it occludes what is behind)
        const bw = Math.max(1.5, half * 0.035);
        const wh = Math.max(1, half * 0.055);
        const bx = half * 1.36;
        const post = frac(phase * 2) < 0.12;
        ctx.fillStyle = post ? "#3a3d43" : `rgb(${(120 * lit) | 0},${(124 * lit) | 0},${(130 * lit) | 0})`;
        ctx.fillRect(cx - bx - bw, y - wh, bw, wh + 1);
        ctx.fillRect(cx + bx, y - wh, bw, wh + 1);
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(cx - bx - bw, y - wh, bw, 1);
        ctx.fillRect(cx + bx, y - wh, bw, 1);

        // asphalt with fine aggregate noise
        const n = hash(Math.floor(phase * 40) + y * 0.37);
        const a = (20 + t * 12 + n * 4) | 0;
        ctx.fillStyle = `rgb(${a},${a + 1},${a + 3})`;
        ctx.fillRect(cx - half, y, half * 2, 1);

        // rubbered racing lines + marbles near the edges
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(cx - half * 0.46, y, half * 0.3, 1);
        ctx.fillRect(cx + half * 0.16, y, half * 0.3, 1);
        ctx.fillStyle = "rgba(255,255,255,0.025)";
        ctx.fillRect(cx - half * 0.94, y, half * 0.2, 1);
        ctx.fillRect(cx + half * 0.74, y, half * 0.2, 1);

        // gloss from headlights / sheen toward the centre
        ctx.fillStyle = `rgba(255,244,225,${0.05 * t})`;
        ctx.fillRect(cx - half * 0.55, y, half * 1.1, 1);

        // kerbs
        const kw = Math.max(2, half * 0.07);
        const red = frac(z * 2.4 + dist * 2.93) < 0.5;
        ctx.fillStyle = red ? `rgb(${(170 * lit) | 0},${(18 * lit) | 0},${(28 * lit) | 0})` : `rgb(${(210 * lit) | 0},${(210 * lit) | 0},${(212 * lit) | 0})`;
        ctx.fillRect(cx - half - kw, y, kw, 1);
        ctx.fillRect(cx + half, y, kw, 1);

        // white track-limit lines
        const lw = Math.max(1, half * 0.014);
        ctx.fillStyle = "rgba(235,235,235,0.8)";
        ctx.fillRect(cx - half * 0.97, y, lw, 1);
        ctx.fillRect(cx + half * 0.97 - lw, y, lw, 1);

        // periodic start/finish-style chequer line across the track
        if (frac(phase / 18) < 0.012) {
          ctx.fillStyle = "rgba(235,235,235,0.55)";
          ctx.fillRect(cx - half, y, half * 2, 1);
        }
      }

      drawTraffic(dist, curve, 0);

      // --- atmosphere: distance haze, headlight pool, vignette ---
      const fog = ctx.createLinearGradient(0, hz - 4, 0, hz + rows * 0.4);
      fog.addColorStop(0, "rgba(58,44,48,0.9)");
      fog.addColorStop(0.45, "rgba(18,18,26,0.55)");
      fog.addColorStop(1, "rgba(10,10,16,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, hz - 4, W, rows * 0.4 + 4);

      const pool = ctx.createRadialGradient(W / 2, H * 0.95, 0, W / 2, H * 0.95, W * 0.55);
      pool.addColorStop(0, "rgba(255,240,215,0.07)");
      pool.addColorStop(1, "rgba(255,240,215,0)");
      ctx.fillStyle = pool;
      ctx.fillRect(0, hz, W, rows);

      drawTraffic(dist, curve, 1);

      const vig = ctx.createRadialGradient(W / 2, H * 0.6, H * 0.35, W / 2, H * 0.6, Math.max(W, H) * 0.8);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };

    // ---------- "AAROHAN AHEAD" road banner ----------
    // The gantry stands at a fixed world depth (BANNER_Z) and the road scrolls
    // toward the car at the same rate as the stripes, so it stays planted on
    // the asphalt and the car drives under it.
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
      // only fade as it swallows the screen right at the end of the pass
      el.style.opacity = clamp((z - BANNER_GONE_Z) / 0.35).toString();
      el.style.transform = `translate(calc(-50% + ${dx}px), ${
        baseY - 600
      }px) scale(${s})`;
    };

    // ---------- Traffic signal beside the banner ----------
    // Planted at the same world depth as the gantry, just to its left, so it
    // scrolls, scales and disappears exactly like the banner does.
    const updateSignal = () => {
      const el = signalRef.current;
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

      // banner is 1.3 * W * tr wide and centred on the road; stand just outside its left edge
      const gap = 0.20 * W * tr;
      const x = W / 2 + dx - 0.65 * W * tr - gap;

      el.style.display = "block";
      el.style.opacity = clamp((z - BANNER_GONE_Z) / 0.35).toString();
      el.style.transform = `translate(${x - el.offsetWidth / 2}px, ${
        baseY - el.offsetHeight
      }px) scale(${s})`;
    };

    // ---------- Roadside billboards ----------
    // Each event board stands at a fixed world depth beside the road (right,
    // left, right, ...). Like the gantry, it is placed from its depth z: ground
    // row = horizon + rows / z, scale and lateral offset both follow 1 / z, so
    // it grows as you approach and is swept past the car.
    const updateBillboards = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const hz = Math.round(H * 0.38);
      const dist = progress * panelsCount * DIST_PER_PANEL;
      const gate = clamp(progress * 30); // stay hidden until the drive begins

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
        // pivot = bottom-centre (ground contact), then scale, then move there
        el.style.transform = `translate(${x}px, ${groundY}px) scale(${s}) translate(-50%, -100%)`;
        // nearer boards paint over farther ones, all behind the car (z 5)
        el.style.zIndex = String(
          1 + Math.round((1 - clamp((z - BILL_GONE_Z) / BILL_FAR_Z)) * 3)
        );
        // LED strip brightens as the board comes into reading range
        el.style.setProperty(
          "--lit",
          clamp(1 - Math.abs(z - BILL_FOCUS_Z) / 4).toFixed(2)
        );
      });

      setActiveDotIndex(nearest);
    };

    // ---------- Main scroll update ----------
    const update = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      progress = clamp(window.scrollY / (maxScroll || 1));
      const section = progress * panelsCount;

      const intro = smooth(clamp(progress / 0.05));
      turn = Math.sin((section + BILL_TURN_PHASE) * Math.PI) * intro;
      zigAmp = 1 - smooth(clamp((progress - 0.04) / 0.14));
      const zDist = progress * panelsCount * DIST_PER_PANEL;
      // steer toward where the zig-zag road is heading a few car-lengths ahead
      drive = clamp(
        turn +
          zigAmp * 0.6 * smooth(clamp(progress / 0.02)) *
            Math.sin(ZIG_K * (4 + 1.222 * zDist)),
        -1.2,
        1.2
      );

      drawRoad(progress * panelsCount * DIST_PER_PANEL, turn);
      updateBanner();
      updateSignal();
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

        ctx.strokeStyle = `rgba(215, 210, 222, ${Math.max(0, alpha)})`;
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
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    // progress at which billboard `index` reaches its readable depth
    const target =
      (BILL_Z0 - BILL_FOCUS_Z + index * BILL_SPACING) /
      (allEvents.length * BILL_SPACING);
    window.scrollTo({
      top: Math.min(1, Math.max(0, target)) * maxScroll,
      behavior: "smooth",
    });
  };

  return (
    <>
      <style>{`
        @keyframes tyre-roll-down {
          to { stroke-dashoffset: -120; }
        }
        .tyre-roll {
          animation: tyre-roll-down var(--roll-speed, 0.4s) linear infinite;
          animation-play-state: var(--roll-state, paused);
        }
        .tyre-roll-fast {
          animation: tyre-roll-down calc(var(--roll-speed, 0.4s) * 0.6) linear infinite;
          animation-play-state: var(--roll-state, paused);
        }
      `}</style>

      <div
        id="track"
        style={{
          height: `${Math.max(500, allEvents.length * VH_PER_EVENT)}vh`,
        }}
      />

      <div
        id="stage"
        className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#030305] via-[#09090f] to-[#12121c]"
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

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoRef}
          id="logo"
          src="/assets/logo.png"
          alt="Aarohan logo"
          className="absolute z-10 mix-blend-screen opacity-95 pointer-events-none"
        />

        {/* Traffic signal: stands beside the road banner and is removed with it */}
        <div
          ref={signalRef}
          className="absolute left-0 top-0 z-[5] pointer-events-none will-change-transform"
          style={{ transformOrigin: "50% 100%", display: "none" }}
        >
        <aside
          className="club-signal"
          aria-label="Aarohan letters"
          style={{ position: "relative", left: "auto", right: "auto", top: "auto", bottom: "auto" }}
        >
          <span className="club-signal__title">AAROHAN</span>
          <div className="club-signal__housing pb-2">
            {["A", "A", "R", "O", "H", "A", "N"].map((letter, idx) => (
              <div
                className="club-signal__lamp flex items-center justify-center font-black text-xl text-white/90"
                key={idx}
                style={{
                  textShadow: "0 0 10px #ffeb84, 0 0 20px #ffaa00",
                  boxShadow: "inset 0 0 15px rgba(255, 170, 0, 0.4), 0 0 20px rgba(255, 170, 0, 0.6)"
                }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="club-signal__pole" aria-hidden="true" />
          <div className="club-signal__base" aria-hidden="true" />
        </aside>
        </div>

        <div
          ref={miniWrapRef}
          aria-hidden="true"
          className="absolute right-12 top-5 z-10 w-[168px] h-[103px] opacity-0 pointer-events-none will-change-transform"
        >
          <svg viewBox="0 0 176 108" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]">
            {/* run-off / outline */}
            <path d={CIRCUIT} fill="none" stroke="#050507" strokeWidth="11" strokeLinejoin="round" />
            {/* asphalt (also used to measure progress) */}
            <path ref={miniPathRef} d={CIRCUIT} fill="none" stroke="#3a3d45" strokeWidth="7" strokeLinejoin="round" />
            {/* sector colouring */}
            <path d={CIRCUIT} pathLength="100" fill="none" stroke="#b3141f" strokeWidth="1.6" strokeDasharray="33.3 66.7" strokeDashoffset="0" />
            <path d={CIRCUIT} pathLength="100" fill="none" stroke="#c9a227" strokeWidth="1.6" strokeDasharray="33.3 66.7" strokeDashoffset="-33.3" />
            <path d={CIRCUIT} pathLength="100" fill="none" stroke="#2a6fd0" strokeWidth="1.6" strokeDasharray="33.4 66.6" strokeDashoffset="-66.6" />
            {/* centre line */}
            <path d={CIRCUIT} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" strokeDasharray="2 3" strokeLinejoin="round" />
            {/* start / finish */}
            <path d="M23.5 72H32.5" stroke="#f1f1f1" strokeWidth="2.4" strokeDasharray="2 2" />
            <circle ref={miniDotRef} r="4" fill="#fff" stroke="#b3141f" strokeWidth="2" />
          </svg>
        </div>

        {/* Road gantry: AAROHAN AHEAD + arrow (removed after the intro scroll) */}
        <RoadBanner bannerRef={bannerRef} />

        {/* Upgraded car */}
        {carElement}

        {/* Roadside billboards: one per event, planted beside the road */}
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
                  ? "bg-[#b03a3f] scale-150"
                  : "bg-[#555] hover:bg-[#888]"
              }`}
            />
          ))}
        </div>

        <div
          ref={hintRef}
          id="hint"
          className="absolute left-1/2 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 text-[#a9a9b3] text-[11px] tracking-[4px] z-10"
        >
          SCROLL TO RACE
        </div>
      </div>
    </>
  );
};