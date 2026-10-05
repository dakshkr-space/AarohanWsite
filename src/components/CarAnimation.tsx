"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

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

export const CarAnimation: React.FC<CarAnimationProps> = ({ clubs }) => {
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const clubLineup = useMemo(() => {
    const signalOrder = [
      "GNU/Linux Users' Group",
      "Centre for Cognitive Activities",
      "SAE",
      "MATHS N TECH CLUB",
      "RECURSION",
    ];
    return [...clubs].sort(
      (a, b) => signalOrder.indexOf(a.name) - signalOrder.indexOf(b.name)
    );
  }, [clubs]);

  const allEvents = useMemo(() => {
    return clubs.flatMap((club) =>
      club.events.map((event) => ({
        ...event,
        clubName: club.name,
        clubLogo: club.logo,
      }))
    );
  }, [clubs]);

  const roadRef = useRef<SVGSVGElement | null>(null);
  const dashRef = useRef<SVGGElement | null>(null);
  const windCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const carRef = useRef<SVGSVGElement | null>(null);
  const glintRef = useRef<SVGGElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const panelsCount = allEvents.length;
    if (panelsCount === 0) return;

    const DASHES = 14;
    const HORIZON_Y = 532;
    const BOTTOM_Y = 780;
    const CENTER_X = 544;

    const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dashGroup = dashRef.current;
    const dashShapes: SVGPolygonElement[] = [];
    if (dashGroup) {
      dashGroup.innerHTML = "";
      for (let i = 0; i < DASHES; i++) {
        const shape = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        dashGroup.appendChild(shape);
        dashShapes.push(shape);
      }
    }

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

    let progress = 0;
    let wind = 0;

    const applyCar = () => {
      const car = carRef.current;
      if (!car) return;
      const intro = smooth(clamp(progress / 0.1));
      const wave = progress * panelsCount * Math.PI * 2;
      const t = performance.now() / 1000;

      const live = reduceMotion ? 0 : 1;
      const shakeY =
        (Math.sin(t * 43) * 1.8 + Math.sin(t * 71) * 1.0) * wind * live;
      const shakeX = Math.sin(t * 53) * 1.2 * wind * live;
      const idle = Math.sin(t * 2.2) * 0.6 * live;
      const squat = wind * 7;
      const sway = Math.sin(wave) * 1.4;
      const roll = Math.cos(wave) * 0.7 + shakeX * 0.25;
      const scale = 1 + progress * 0.03 + wind * 0.025;
      const rise = (1 - intro) * 5;

      car.style.transform =
        `translateX(-50%) ` +
        `translate3d(${sway + shakeX * 0.1}vw, calc(${rise}vh + ${
          squat + shakeY + idle
        }px), 0) ` +
        `scale(${scale}) rotate(${roll}deg)`;

      // Update tyre rotation speed and state based on scroll velocity
      car.style.setProperty("--roll-state", wind > 0.005 ? "running" : "paused");
      car.style.setProperty("--roll-speed", `${Math.max(0.08, 0.4 - wind * 0.8)}s`);
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

    const update = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      progress = clamp(window.scrollY / (maxScroll || 1));
      const section = progress * panelsCount;

      const phase = progress * 40;
      dashShapes.forEach((shape, i) => {
        const t = ((i + phase) % DASHES) / DASHES;
        const t2 = Math.pow(t + 0.035, 2);
        const y1 = HORIZON_Y + (BOTTOM_Y - HORIZON_Y) * t * t;
        const y2 = HORIZON_Y + (BOTTOM_Y - HORIZON_Y) * t2;
        const w1 = 1 + 9 * t * t;
        const w2 = 1 + 9 * t2;

        shape.setAttribute(
          "points",
          `${CENTER_X - w1},${y1} ${CENTER_X + w1},${y1} ${
            CENTER_X + w2
          },${y2} ${CENTER_X - w2},${y2}`
        );
        shape.setAttribute(
          "opacity",
          (clamp(t * 3) * clamp(progress * 12)).toString()
        );
      });

      if (roadRef.current) {
        const intro = smooth(clamp(progress / 0.12));
        const zoom = 0.5 * intro + 0.5 * progress;
        const midBoost = 0.07 * Math.sin(progress * Math.PI);
        roadRef.current.style.transform = `scale(${1 + zoom * 0.4 + midBoost})`;
      }

      if (hintRef.current) {
        hintRef.current.style.opacity = clamp(1 - progress * 10).toString();
      }

      updateGlints(progress);
      applyCar();

      panelRefs.current.forEach((panel, i) => {
        if (!panel) return;
        const distance = section - (i + 0.5);
        const away = Math.abs(distance);
        const opacity = clamp(1.1 - away * 2.2) * clamp(progress * 40);

        panel.style.opacity = opacity.toString();
        panel.style.transform = `translate(-50%, ${-distance * 40}vh) scale(${
          1 + distance * 0.9
        })`;
        panel.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      });

      setActiveDotIndex(clamp(Math.floor(section), 0, panelsCount - 1));
    };

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
        const cos = Math.cos(s.angle);
        const sin = Math.sin(s.angle);
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
        requestAnimationFrame(drawWind);
      } else {
        windRunning = false;
        wind = 0;
        ctx.clearRect(0, 0, w, h);
        applyCar();
      }
    };

    const startWind = () => {
      if (reduceMotion || windRunning) return;
      windRunning = true;
      requestAnimationFrame(drawWind);
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
      update();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    placeLogo();
    sizeCanvas();
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [allEvents]);

  return (
    <>
      {/* CSS for animating the tyre treads */}
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
        style={{ height: `${Math.max(600, allEvents.length * 150)}vh` }}
      />

      <div id="stage" className="fixed inset-0 overflow-hidden bg-[#050505]">
        <svg
          ref={roadRef}
          id="road"
          viewBox="0 0 1088 780"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full origin-[50%_78%] will-change-transform"
        >
          <image
            href="/assets/background.png"
            x="0"
            y="0"
            width="1088"
            height="780"
          />
          <g ref={dashRef} id="dash" fill="#cfcfd5" />
        </svg>

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

        <aside className="track-welcome" aria-label="Festival welcome message">
          <span className="track-welcome__eyebrow">AAROHAN 2026 · TEAM</span>
          <strong>AAVISHKAR</strong>
          <span className="track-welcome__rule" />
          <p>
            National Institute of Technology Durgapur
            <br />
            proudly welcomes you.
          </p>
        </aside>

        <aside className="club-signal" aria-label="Participating clubs">
          <span className="club-signal__title">CLUB GRID</span>
          <div className="club-signal__housing">
            {clubLineup.map((club) => (
              <div
                className="club-signal__lamp"
                key={club.name}
                title={club.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={club.logo}
                  alt={club.name}
                  className="club-signal__logo"
                />
              </div>
            ))}
          </div>
          <div className="club-signal__pole" aria-hidden="true" />
          <div className="club-signal__base" aria-hidden="true" />
        </aside>

        {/* Pro 3D SVG Car with Rotating Tyres */}
        <svg
          ref={carRef}
          id="car"
          viewBox="0 0 1000 520"
          aria-hidden="true"
          className="absolute left-1/2 bottom-[-1vh] z-[5] w-[min(62vw,780px)] min-w-[440px] origin-[50%_100%] will-change-transform pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
        >
          <defs>
            <pattern
              id="carbon"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
            >
              <rect width="6" height="6" fill="#141414" />
              <path d="M0,0 L3,3 M3,0 L6,3 M0,3 L3,6 M3,3 L6,6" stroke="#252525" strokeWidth="1.5" />
            </pattern>

            <linearGradient id="bodyRed" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4a0004" />
              <stop offset="15%" stopColor="#a30009" />
              <stop offset="50%" stopColor="#f51120" />
              <stop offset="85%" stopColor="#a30009" />
              <stop offset="100%" stopColor="#4a0004" />
            </linearGradient>
            
            <linearGradient id="paintGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="shadowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="tyreTread" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#050505" />
              <stop offset="20%" stopColor="#1a1c21" />
              <stop offset="50%" stopColor="#22242a" />
              <stop offset="80%" stopColor="#1a1c21" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>

            <linearGradient id="tyreWall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="50%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>

            <linearGradient id="screenGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="40.1%" stopColor="#000000" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
            </linearGradient>

            <radialGradient id="gloveShadow" cx="50%" cy="50%" r="50%">
              <stop offset="50%" stopColor="#d91828" />
              <stop offset="100%" stopColor="#5c040d" />
            </radialGradient>

            <clipPath id="hoodClip">
              <path d="M478 250Q500 243 522 250Q620 390 810 520H190Q380 390 478 250Z" />
            </clipPath>

            <g id="tyre">
              {/* Main Tread Profile */}
              <path d="M20 300Q20 250 80 245L190 235Q230 238 238 290L244 485Q240 525 192 530L72 530Q18 525 15 480Z" fill="url(#tyreTread)" />
              {/* Inner Sidewall Curve */}
              <path d="M78 245L190 235Q228 238 234 285Q140 315 35 305Q30 255 78 245Z" fill="url(#tyreWall)" />
              
              {/* Rotating Tread Grooves using CSS stroke-dashoffset animation */}
              <path d="M25 330Q35 430 70 510M45 330Q55 430 90 510M65 330Q75 430 110 510" 
                    stroke="#0a0a0a" strokeWidth="8" strokeLinecap="round" fill="none" 
                    strokeDasharray="25 15" 
                    className="tyre-roll" />
                    
              {/* Animated Red Heat/Motion Line overlay */}
              <path d="M40 340Q50 430 86 512" 
                    stroke="#d61525" strokeOpacity="0.8" strokeWidth="4" strokeLinecap="round" fill="none" 
                    strokeDasharray="40 30" 
                    className="tyre-roll-fast" />
            </g>

            <g id="arms">
              <path d="M225 295L360 390M225 345L360 415" stroke="url(#carbon)" strokeWidth="16" strokeLinecap="round" />
              <path d="M225 295L360 390M225 345L360 415" stroke="#111" strokeWidth="16" strokeOpacity="0.4" strokeLinecap="round" />
              <path d="M230 315L335 335" stroke="url(#carbon)" strokeWidth="8" strokeLinecap="round" />
            </g>

            <g id="shoulder">
              <path d="M150 520Q160 420 262 390L370 410Q390 460 404 520Z" fill="url(#bodyRed)" />
              <path d="M150 520Q160 420 262 390L370 410Q390 460 404 520Z" fill="url(#paintGloss)" />
              <path d="M262 390L370 410Q390 460 404 520H150Q160 420 262 390Z" fill="url(#shadowGradient)" opacity="0.6"/>
              <path d="M262 390L370 410" stroke="#ff8c96" strokeOpacity="0.6" strokeWidth="2" />
            </g>

            <g id="mirror">
              <path d="M214 345L300 400" stroke="url(#carbon)" strokeWidth="12" strokeLinecap="round" />
              <rect x="76" y="312" width="146" height="68" rx="12" fill="url(#carbon)" />
              <rect x="76" y="312" width="146" height="68" rx="12" fill="url(#paintGloss)" opacity="0.5" />
              <rect x="88" y="324" width="122" height="44" rx="6" fill="#1c2029" />
              <rect x="88" y="324" width="122" height="44" rx="6" fill="url(#screenGloss)" />
              <path d="M90 346L208 346" stroke="#fff" strokeWidth="1" strokeOpacity="0.1" />
            </g>
          </defs>

          <use href="#arms" />
          <use href="#arms" transform="translate(1000 0) scale(-1 1)" />
          <use href="#tyre" />
          <use href="#tyre" transform="translate(1000 0) scale(-1 1)" />

          <path d="M478 250Q500 240 522 250Q620 390 810 520H190Q380 390 478 250Z" fill="url(#bodyRed)" />
          <path d="M478 250Q500 240 522 250Q620 390 810 520H190Q380 390 478 250Z" fill="url(#paintGloss)" />
          
          <path d="M500 245V520" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M497 245V520M503 245V520" stroke="#000" strokeOpacity="0.15" strokeWidth="1" />
          
          <path d="M488 262Q430 400 380 520M512 262Q570 400 620 520" stroke="#000" strokeOpacity="0.4" strokeWidth="2" fill="none" />
          <path d="M489 262Q431 400 381 520M511 262Q569 400 619 520" stroke="#fff" strokeOpacity="0.2" strokeWidth="1" fill="none" />
          
          <path d="M500 242V195" stroke="#aab0ba" strokeWidth="2.5" />
          <circle cx="500" cy="193" r="3.5" fill="#e2e6eb" />

          <g ref={glintRef} clipPath="url(#hoodClip)" />

          <use href="#shoulder" />
          <use href="#shoulder" transform="translate(1000 0) scale(-1 1)" />
          <path d="M404 520Q410 430 448 410H552Q590 430 596 520Z" fill="#030304" stroke="#4a0004" strokeWidth="4" />
          <path d="M404 520Q410 430 448 410H552Q590 430 596 520Z" fill="url(#shadowGradient)" />

          <use href="#mirror" />
          <use href="#mirror" transform="translate(1000 0) scale(-1 1)" />

          <g id="steering-wheel">
            <ellipse cx="385" cy="510" rx="35" ry="28" fill="url(#gloveShadow)" />
            <ellipse cx="615" cy="510" rx="35" ry="28" fill="url(#gloveShadow)" />
            
            <path d="M400 450Q400 425 430 425H570Q600 425 600 450V520Q600 540 570 540H430Q400 540 400 520Z" fill="url(#carbon)" stroke="#1a1a1a" strokeWidth="3" />
            
            <path d="M400 450V520Q400 535 415 535V435Q400 435 400 450Z" fill="#141518" />
            <path d="M600 450V520Q600 535 585 535V435Q600 435 600 450Z" fill="#141518" />

            <rect x="445" y="440" width="110" height="50" rx="4" fill="#04121a" stroke="#2c3038" strokeWidth="2" />
            <rect x="445" y="440" width="110" height="50" rx="4" fill="url(#screenGloss)" />
            
            <text x="500" y="475" fill="#fff" fontSize="24" fontFamily="monospace" fontWeight="bold" textAnchor="middle">8</text>
            <rect x="455" y="450" width="40" height="4" fill="#00ff00" />
            <rect x="455" y="458" width="30" height="4" fill="#00ff00" />
            <rect x="505" y="450" width="40" height="4" fill="#ff0000" />
            <rect x="515" y="458" width="30" height="4" fill="#ff0000" />
            <text x="455" y="480" fill="#0ff" fontSize="8" fontFamily="sans-serif">SPEED 312</text>
            <text x="545" y="480" fill="#ff0" fontSize="8" fontFamily="sans-serif" textAnchor="end">LAP 42</text>

            <circle cx="440" cy="433" r="3" fill="#0f0" />
            <circle cx="455" cy="433" r="3" fill="#0f0" />
            <circle cx="470" cy="433" r="3" fill="#0f0" />
            <circle cx="485" cy="433" r="3" fill="#ff0" />
            <circle cx="500" cy="433" r="3" fill="#ff0" />
            <circle cx="515" cy="433" r="3" fill="#ff0" />
            <circle cx="530" cy="433" r="3" fill="#f00" />
            <circle cx="545" cy="433" r="3" fill="#f00" />
            <circle cx="560" cy="433" r="3" fill="#f00" />

            <circle cx="430" cy="470" r="10" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            <circle cx="430" cy="470" r="6" fill="#e0182d" />
            <path d="M430 470L426 466" stroke="#fff" strokeWidth="2" />
            
            <circle cx="430" cy="505" r="10" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            <circle cx="430" cy="505" r="6" fill="#ffd400" />
            <path d="M430 505L434 501" stroke="#fff" strokeWidth="2" />

            <circle cx="570" cy="470" r="10" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            <circle cx="570" cy="470" r="6" fill="#2f7bff" />
            <path d="M570 470L574 466" stroke="#fff" strokeWidth="2" />
            
            <circle cx="570" cy="505" r="10" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            <circle cx="570" cy="505" r="6" fill="#2ecc71" />
            <path d="M570 505L566 501" stroke="#fff" strokeWidth="2" />

            <circle cx="500" cy="510" r="14" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
            <circle cx="500" cy="510" r="8" fill="#e0182d" />
            <path d="M500 510V498" stroke="#fff" strokeWidth="2" />
          </g>
        </svg>

        {allEvents.map((event, index) => (
          <section
            key={`${event.clubName}-${event.id}-${index}`}
            ref={(el) => {
              panelRefs.current[index] = el;
            }}
            className="absolute left-1/2 top-[14vh] w-[min(720px,88vw)] p-7 border border-[var(--line)] rounded-2xl bg-[var(--glass)] backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)] opacity-0 will-change-transform"
          >
            <div className="flex items-center gap-3 mb-2">
              {event.clubLogo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={event.clubLogo}
                  alt={`${event.clubName} Logo`}
                  className="w-6 h-6 object-contain mix-blend-screen"
                />
              )}
              <small className="text-[#b03a3f] text-xs tracking-[3px] uppercase">
                {event.clubName} &middot; {event.number} &middot; {event.category}
              </small>
            </div>

            <h2 className="my-1.5 text-[clamp(24px,4vw,40px)] tracking-widest">
              {event.title}
            </h2>
            <p className="m-0 text-[#a9a9b3] leading-relaxed">
              {event.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-3.5">
              {event.tags.map((tag, tagIdx) => (
                <span
                  key={tagIdx}
                  className="px-2.5 py-1 border border-[var(--line)] rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        ))}

        <div
          id="dots"
          className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5"
        >
          {allEvents.map((_, idx) => (
            <b
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeDotIndex === idx
                  ? "bg-[#b03a3f] scale-150"
                  : "bg-[#555]"
              }`}
            />
          ))}
        </div>

        <div
          ref={hintRef}
          id="hint"
          className="absolute left-1/2 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 text-[#a9a9b3] text-[11px] tracking-[4px] z-10"
        >
          SCROLL TO RACE
        </div>
      </div>
    </>
  );
};