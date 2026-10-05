"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

// Update the interfaces to match the nested clubs data structure
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
  const clubLineup = useMemo(
    () => {
      const signalOrder = ["GNU/Linux Users' Group", "Centre for Cognitive Activities", "SAE", "MATHS N TECH CLUB", "RECURSION"];
      return [...clubs].sort((a, b) => signalOrder.indexOf(a.name) - signalOrder.indexOf(b.name));
    },
    [clubs]
  );

  // Flatten the clubs data into a single array of events, attaching the club name and logo to each
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

    // Create SVG Lane Dashes
    const dashGroup = dashRef.current;
    const dashShapes: SVGPolygonElement[] = [];
    if (dashGroup) {
      dashGroup.innerHTML = "";
      for (let i = 0; i < DASHES; i++) {
        const shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        dashGroup.appendChild(shape);
        dashShapes.push(shape);
      }
    }

    // Main event logo placement
    const placeLogo = () => {
      if (!logoRef.current) return;
      const scale = Math.max(window.innerWidth / 1088, window.innerHeight / 780);
      const width = Math.min(84, Math.max(44, 66 * scale));
      const offsetX = (window.innerWidth - 1088 * scale) / 2;
      const offsetY = window.innerHeight - 780 * scale;

      logoRef.current.style.width = `${width}px`;
      logoRef.current.style.height = `${width * 0.758}px`;
      logoRef.current.style.left = `${Math.max(12, offsetX + 13 * scale)}px`;
      logoRef.current.style.top = `${Math.max(12, offsetY + 13 * scale)}px`;
    };

    // Scroll Update Handler
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = clamp(window.scrollY / (maxScroll || 1));
      const section = progress * panelsCount;

      // Update Lane Dashes
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
          `${CENTER_X - w1},${y1} ${CENTER_X + w1},${y1} ${CENTER_X + w2},${y2} ${CENTER_X - w2},${y2}`
        );
        shape.setAttribute("opacity", (clamp(t * 3) * clamp(progress * 12)).toString());
      });

      // Road Zoom
      if (roadRef.current) {
        const intro = smooth(clamp(progress / 0.12));
        const zoom = 0.5 * intro + 0.5 * progress;
        const midBoost = 0.07 * Math.sin(progress * Math.PI);
        roadRef.current.style.transform = `scale(${1 + zoom * 0.4 + midBoost})`;
      }

      // Scroll Hint Fade
      if (hintRef.current) {
        hintRef.current.style.opacity = (clamp(1 - progress * 10)).toString();
      }

      // Car Translation & Shake
      if (carRef.current) {
        const intro = smooth(clamp(progress / 0.12));
        const zoom = 0.5 * intro + 0.5 * progress;
        const wave = progress * panelsCount * Math.PI * 2;
        const shake = Math.sin(progress * 900) * 0.7 * intro;
        carRef.current.style.transform =
          `translateX(calc(-50% + ${Math.sin(wave) * 4}vw)) ` +
          `translateY(calc(${-intro * 13}vh + ${shake}px)) ` +
          `scale(${1 + zoom * 0.2 - intro * 0.08}) ` +
          `rotate(${Math.cos(wave) * 2.5}deg)`;
      }

      // Panels Transition
      panelRefs.current.forEach((panel, i) => {
        if (!panel) return;
        const distance = section - (i + 0.5);
        const away = Math.abs(distance);
        const opacity = clamp(1.1 - away * 2.2) * clamp(progress * 40);

        panel.style.opacity = opacity.toString();
        panel.style.transform = `translate(-50%, ${-distance * 40}vh) scale(${1 + distance * 0.9})`;
        panel.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      });

      // Dot Indicator State
      const currentActive = Math.floor(section);
      setActiveDotIndex(clamp(currentActive, 0, panelsCount - 1));
    };

    // Wind Canvas Configuration
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

    const streaks: Streak[] = Array.from({ length: STREAKS }, () => newStreak(true));
    let wind = 0;
    let lastY = window.scrollY;
    let windRunning = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
        const alpha = s.alpha * wind * Math.min(1, s.t * 2.5) * (1 - Math.max(0, s.t - 0.85) * 5);

        ctx.strokeStyle = `rgba(215, 210, 222, ${Math.max(0, alpha)})`;
        ctx.lineWidth = s.width * (0.5 + s.t);
        ctx.beginPath();
        ctx.moveTo(cx + cos * tail * reach, cy + sin * tail * reach);
        ctx.lineTo(cx + cos * head * reach, cy + sin * head * reach);
        ctx.stroke();
      });

      if (wind > 0.01) {
        requestAnimationFrame(drawWind);
      } else {
        windRunning = false;
        ctx.clearRect(0, 0, w, h);
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
      {/* Tall container providing scroll space based on total events */}
      <div id="track" style={{ height: `${Math.max(600, allEvents.length * 150)}vh` }} />

      {/* Fixed viewport stage */}
      <div id="stage" className="fixed inset-0 overflow-hidden bg-[#050505]">
        {/* Road SVG */}
        <svg
          ref={roadRef}
          id="road"
          viewBox="0 0 1088 780"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full origin-[50%_78%] will-change-transform"
        >
          <image href="/assets/background.png" x="0" y="0" width="1088" height="780" />
          <g ref={dashRef} id="dash" fill="#cfcfd5" />
        </svg>

        {/* Wind Canvas */}
        <canvas
          ref={windCanvasRef}
          id="wind"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Main Event Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoRef}
          id="logo"
          src="/assets/logo.png"
          alt="Aarohan logo"
          className="absolute z-10 mix-blend-screen opacity-95 pointer-events-none"
        />

        {/* Trackside boards — styled like sponsor signage on a circuit wall. */}
        <aside className="track-welcome" aria-label="Festival welcome message">
          <span className="track-welcome__eyebrow">AAROHAN 2026 · TEAM</span>
          <strong>AAVISHKAR</strong>
          <span className="track-welcome__rule" />
          <p>National Institute of Technology Durgapur<br />proudly welcomes you.</p>
        </aside>

        {/* A ground-mounted race signal carries each club logo in a light. */}
        <aside className="club-signal" aria-label="Participating clubs">
          <span className="club-signal__title">CLUB GRID</span>
          <div className="club-signal__housing">
            {clubLineup.map((club) => (
              <div className="club-signal__lamp" key={club.name} title={club.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={club.logo} alt={club.name} className="club-signal__logo" />
              </div>
            ))}
          </div>
          <div className="club-signal__pole" aria-hidden="true" />
          <div className="club-signal__base" aria-hidden="true" />
        </aside>

        {/* Futuristic F1-style car, viewed primarily from above and behind. */}
        <svg
          ref={carRef}
          id="car"
          viewBox="0 0 360 230"
          aria-hidden="true"
          className="absolute left-1/2 bottom-[5vh] w-[min(39vw,450px)] min-w-[235px] origin-[50%_100%] will-change-transform drop-shadow-[0_0_22px_rgba(255,40,40,0.4)]"
        >
          <defs>
            <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4b4e5a" />
              <stop offset=".32" stopColor="#161820" />
              <stop offset="1" stopColor="#050507" />
            </linearGradient>
            <linearGradient id="cc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#26313c" />
              <stop offset=".45" stopColor="#080a0f" />
              <stop offset="1" stopColor="#1c202a" />
            </linearGradient>
            <linearGradient id="tr" x1="0" x2="1">
              <stop offset="0" stopColor="#030304" />
              <stop offset=".5" stopColor="#26262c" />
              <stop offset="1" stopColor="#030304" />
            </linearGradient>
            <linearGradient id="lb" x1="0" x2="1">
              <stop offset="0" stopColor="#ff1f3a" />
              <stop offset=".5" stopColor="#ffd9dc" />
              <stop offset="1" stopColor="#ff1f3a" />
            </linearGradient>
            <filter id="gl" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <ellipse cx="180" cy="217" rx="150" ry="10" fill="#000" opacity=".72" />
          <ellipse cx="180" cy="208" rx="108" ry="7" fill="#ff1f3a" opacity=".28" filter="url(#gl)" />
          <g className="cb">
            {/* Front-facing red Formula 1 car, based on the first supplied reference. */}
            <rect x="32" y="94" width="68" height="95" rx="23" fill="url(#tr)" stroke="#5b606c" strokeWidth="2" />
            <rect x="260" y="94" width="68" height="95" rx="23" fill="url(#tr)" stroke="#5b606c" strokeWidth="2" />
            <path d="M40 118h52M40 137h52M40 156h52M268 118h52M268 137h52M268 156h52" stroke="#050507" strokeWidth="2" />
            <path d="M96 116L126 64Q140 42 158 34H202Q220 42 234 64L264 116 238 160H122Z" fill="url(#bd)" stroke="#777d89" strokeWidth="1.5" />
            <path d="M133 88L150 39H210L227 88 208 114H152Z" fill="url(#cc)" />
            <path d="M150 48Q180 23 210 48L204 75H156Z" fill="#0c1117" stroke="#9beeff" strokeOpacity=".6" />
            <path d="M158 51Q180 37 202 51" stroke="#bdf6ff" strokeOpacity=".58" strokeWidth="2" fill="none" />
            <path d="M136 68L114 122M224 68L246 122" stroke="#ff2a43" strokeWidth="6" />
            <path d="M136 68L114 122M224 68L246 122" stroke="#c9fbff" strokeOpacity=".5" strokeWidth="1.2" />
            <path d="M147 96H213L225 149H135Z" fill="#bc162c" />
            <path d="M161 99H199L208 151H152Z" fill="#11131a" />
            <path d="M173 102H187L192 174H168Z" fill="#d72539" />
            <path d="M176 105H184L187 166H173Z" fill="#e8edf0" opacity=".8" />
            <path d="M68 168H292L326 203H34Z" fill="#08090d" stroke="#626875" strokeWidth="2" />
            <path d="M39 193H321" stroke="#ff1f3a" strokeWidth="7" filter="url(#gl)" className="tl" />
            <path d="M48 190H312" stroke="url(#lb)" strokeWidth="4" />
            <path d="M54 176L118 162M306 176L242 162" stroke="#c51e34" strokeWidth="5" />
            <path d="M96 180L128 165M264 180L232 165" stroke="#9df0ff" strokeOpacity=".45" strokeWidth="1.5" />
            <path d="M119 203H241" stroke="#c9faff" strokeOpacity=".55" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Dynamic Event Panels */}
        {allEvents.map((event, index) => (
          <section
            key={`${event.clubName}-${event.id}-${index}`}
            ref={(el) => {
              panelRefs.current[index] = el;
            }}
            className="absolute left-1/2 top-[14vh] w-[min(720px,88vw)] p-7 border border-[var(--line)] rounded-2xl bg-[var(--glass)] backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)] opacity-0 will-change-transform"
          >
            {/* Display Club Name alongside the event info */}
            <div className="flex items-center gap-3 mb-2">
              {event.clubLogo && (
                 /* eslint-disable-next-line @next/next/no-img-element */
                 <img src={event.clubLogo} alt={`${event.clubName} Logo`} className="w-6 h-6 object-contain mix-blend-screen" />
              )}
              <small className="text-[#b03a3f] text-xs tracking-[3px] uppercase">
                {event.clubName} &middot; {event.number} &middot; {event.category}
              </small>
            </div>
            
            <h2 className="my-1.5 text-[clamp(24px,4vw,40px)] tracking-widest">{event.title}</h2>
            <p className="m-0 text-[#a9a9b3] leading-relaxed">{event.description}</p>
            <div className="flex flex-wrap gap-2 mt-3.5">
              {event.tags.map((tag, tagIdx) => (
                <span key={tagIdx} className="px-2.5 py-1 border border-[var(--line)] rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        ))}

        {/* Progress Dots */}
        <div id="dots" className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5">
          {allEvents.map((_, idx) => (
            <b
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeDotIndex === idx ? "bg-[#b03a3f] scale-150" : "bg-[#555]"
              }`}
            />
          ))}
        </div>

        {/* Scroll Hint */}
        <div
          ref={hintRef}
          id="hint"
          className="absolute left-1/2 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 text-[#a9a9b3] text-[11px] tracking-[4px]"
        >
          SCROLL TO RACE
        </div>
      </div>
    </>
  );
};
