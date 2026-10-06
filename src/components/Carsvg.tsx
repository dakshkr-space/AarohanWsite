import React from "react";

/**
 * Full single-seater seen from BEHIND (chase camera) - the whole car is visible:
 * rear wing, helmet + halo, engine cover, sidepods, diffuser, rear tyres and the
 * front tyres / front wing peeking out on either side.
 *
 * Props / ids are kept compatible with CarAnimation (carRef, glintRef, hoodClip,
 * --roll-offset, --roll-blur, --spin, --steer-n, --unsprung, --heat).
 *
 * New CSS variables written by CarAnimation (all optional, default to 0):
 *   --yaw-n   -1..1  how far the car is rotated into a corner (drives parallax:
 *                    rear wing swings one way, front wing/tyres the other)
 *   --side-l  0..1   amount of the car's LEFT side revealed  (turning right)
 *   --side-r  0..1   amount of the car's RIGHT side revealed (turning left)
 *   --brake   0..1   brake-light intensity
 */
interface CarSvgProps {
  carRef: React.RefObject<SVGSVGElement | null>;
  glintRef: React.RefObject<SVGGElement | null>;
}

// Engine cover - the glint effect in CarAnimation is clipped to this shape
const ENGINE = "M462 236H538Q566 330 616 432H384Q434 330 462 236Z";
const MIRROR_FLIP = "translate(1000 0) scale(-1 1)";

// parallax groups: nearest parts swing the most, farthest swing the opposite way
const REAR_WING_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * -18px), calc(var(--unsprung, 0) * -0.3px))",
};
const REAR_TYRE_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * -10px), calc(var(--unsprung, 0) * 1px))",
};
const BODY_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * -4px), 0)",
};
const FRONT_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * 32px), 0)",
};
const FRONT_TYRE_SHIFT: React.CSSProperties = {
  transform:
    "translate(calc(var(--steer-n, 0) * 7px + var(--yaw-n, 0) * 32px), calc(var(--unsprung, 0) * 0.6px))",
};

export const CarSvg: React.FC<CarSvgProps> = ({ carRef, glintRef }) => (
  <svg
    ref={carRef}
    id="car"
    viewBox="0 80 1000 440"
    aria-hidden="true"
    className="absolute left-1/2 bottom-[1vh] z-[5] w-[min(66vw,840px)] min-w-[420px] origin-[50%_100%] will-change-transform pointer-events-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.85)]"
  >
    <defs>
      {/* carbon twill */}
      <pattern id="carbon" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#0d0e11" />
        <rect width="4" height="4" fill="#181a1f" />
        <rect x="4" y="4" width="4" height="4" fill="#181a1f" />
        <rect width="8" height="8" fill="none" stroke="#050506" strokeWidth="0.4" />
      </pattern>

      {/* deep metallic crimson */}
      <linearGradient id="paint" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2a060b" />
        <stop offset="0.2" stopColor="#6a0f1c" />
        <stop offset="0.5" stopColor="#a31a2f" />
        <stop offset="0.8" stopColor="#6a0f1c" />
        <stop offset="1" stopColor="#2a060b" />
      </linearGradient>
      <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#cfd8ea" stopOpacity="0.4" />
        <stop offset="0.18" stopColor="#cfd8ea" stopOpacity="0.07" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id="spec" cx="0.5" cy="0.1" r="0.55">
        <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="rubber" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#050506" />
        <stop offset="0.35" stopColor="#1a1b20" />
        <stop offset="0.7" stopColor="#121317" />
        <stop offset="1" stopColor="#040405" />
      </linearGradient>
      <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0a0a0c" />
        <stop offset="1" stopColor="#25272c" />
      </linearGradient>
      <linearGradient id="titanium" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b5bbc5" />
        <stop offset="0.45" stopColor="#5c616b" />
        <stop offset="1" stopColor="#23262c" />
      </linearGradient>
      <linearGradient id="helmet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f4f4f6" />
        <stop offset="0.6" stopColor="#c3c6cd" />
        <stop offset="1" stopColor="#6c7079" />
      </linearGradient>
      <radialGradient id="taillight" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ff4455" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#ff2233" stopOpacity="0.4" />
        <stop offset="1" stopColor="#ff2233" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="exhaust" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffb347" stopOpacity="0.95" />
        <stop offset="0.5" stopColor="#ff5a1f" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ground" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.75" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>

      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <filter id="led" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* engine cover - glints are clipped to this */}
      <clipPath id="hoodClip"><path d={ENGINE} /></clipPath>

      {/* ---- rear tyre (left); right one is mirrored ---- */}
      <g id="rtyre">
        <rect x="170" y="270" width="140" height="238" rx="26" fill="url(#rubber)" />
        <rect x="170" y="270" width="140" height="238" rx="26" fill="#fff" filter="url(#grain)" opacity="0.08" />
        {/* shoulder + compound band */}
        <path d="M176 302Q176 274 204 272H276Q304 274 304 302Q240 318 176 302Z" fill="url(#wall)" opacity="0.9" />
        <path d="M188 294Q240 306 294 294" stroke="#b3141f" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* circumferential grooves */}
        <path d="M212 322V504M240 322V506M268 322V504" stroke="#000" strokeOpacity="0.9" strokeWidth="3" fill="none" />
        <path d="M215 322V504M243 322V506M271 322V504" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" fill="none" />
        {/* rolling tread: scrolls UP the tyre face as the car pulls away */}
        <g style={{ opacity: "calc(1 - var(--roll-blur, 0))" }}>
          <path d="M192 322V504M226 322V506M254 322V506M286 322V504" stroke="#000" strokeOpacity="0.75" strokeWidth="9" fill="none" strokeDasharray="20 22" style={{ strokeDashoffset: "calc(var(--roll-offset, 0px) * -1)" }} />
          <path d="M200 322V504M278 322V504" stroke="#2a2c31" strokeWidth="2" fill="none" strokeDasharray="14 26" style={{ strokeDashoffset: "calc(var(--roll-offset, 0px) * -1)" }} />
        </g>
        <g style={{ opacity: "var(--roll-blur, 0)" }}>
          <path d="M192 322V504M226 322V506M254 322V506M286 322V504" stroke="#23252a" strokeOpacity="0.55" strokeWidth="10" fill="none" strokeDasharray="110 30" style={{ strokeDashoffset: "calc(var(--roll-offset, 0px) * -1)" }} />
          <path d="M212 322V504M240 322V506M268 322V504" stroke="#000" strokeOpacity="0.5" strokeWidth="14" fill="none" strokeDasharray="70 50" style={{ strokeDashoffset: "calc(var(--roll-offset, 0px) * -1)" }} />
        </g>
        {/* edge light */}
        <path d="M176 300V488" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.6" fill="none" />
        <path d="M176 302Q176 274 204 272H276" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.6" fill="none" />
      </g>

      {/* ---- front tyre (left); right one is mirrored ---- */}
      <g id="ftyre">
        <rect x="100" y="380" width="58" height="108" rx="14" fill="url(#rubber)" />
        <path d="M104 398Q104 384 118 382H140Q154 384 154 398Q129 406 104 398Z" fill="url(#wall)" opacity="0.9" />
        <path d="M118 408V484M129 408V485M140 408V484" stroke="#000" strokeOpacity="0.9" strokeWidth="2.2" fill="none" />
        <path d="M110 408V484M148 408V484" stroke="#000" strokeOpacity="0.6" strokeWidth="5" fill="none" strokeDasharray="12 14" style={{ strokeDashoffset: "calc(var(--roll-offset, 0px) * -1)" }} />
        <path d="M104 396V478" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.3" fill="none" />
      </g>

      {/* ---- sidepod (left); right one is mirrored ---- */}
      <g id="pod">
        <path d="M420 318Q352 322 324 374L306 466Q312 484 342 486H426Z" fill="url(#paint)" />
        <path d="M420 318Q352 322 324 374L306 466Q312 484 342 486H426Z" fill="url(#coat)" />
        <path d="M420 318Q352 322 324 374L306 466Q312 484 342 486H426Z" fill="url(#shade)" opacity="0.4" />
        {/* cooling outlet + louvres */}
        <path d="M352 408L412 400V442L346 448Z" fill="#050506" opacity="0.92" />
        <path d="M350 420L411 413M348 433L411 427" stroke="#1d1f24" strokeWidth="3" />
        <path d="M420 318Q352 322 324 374" stroke="#f0d6da" strokeOpacity="0.5" strokeWidth="1.6" fill="none" />
      </g>

      {/* ---- rear-wing endplate (left); right one is mirrored ---- */}
      <g id="endplate">
        <path d="M316 206Q328 196 342 202V342Q328 352 316 346Z" fill="url(#carbon)" />
        <path d="M316 206Q328 196 342 202V342Q328 352 316 346Z" fill="url(#coat)" opacity="0.5" />
        <path d="M316 206Q328 196 342 202" stroke="#a31a2f" strokeWidth="3" fill="none" />
        <path d="M320 214V338" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.2" />
      </g>
    </defs>

    {/* ground contact shadow */}
    <ellipse cx="500" cy="508" rx="440" ry="20" fill="url(#ground)" />

    {/* ============ FRONT END (far - peeks out beside the car, swings opposite the tail) ============ */}
    <g style={FRONT_SHIFT}>
      {/* front wing, mostly hidden behind the car */}
      <path d="M60 474H940V492H60Z" fill="url(#carbon)" />
      <path d="M60 474H940" stroke="#a31a2f" strokeWidth="2" />
      <path d="M54 442Q62 436 70 442V494H54Z" fill="url(#carbon)" />
      <path d="M930 442Q938 436 946 442V494H930Z" fill="url(#carbon)" />
      <path d="M54 442Q62 436 70 442" stroke="#a31a2f" strokeWidth="2.5" fill="none" />
      <path d="M930 442Q938 436 946 442" stroke="#a31a2f" strokeWidth="2.5" fill="none" />
    </g>
    <g style={FRONT_TYRE_SHIFT}>
      <use href="#ftyre" />
      <use href="#ftyre" transform={MIRROR_FLIP} />
    </g>

    {/* ============ DRIVER + HALO (parallax: mid depth) ============ */}
    <g style={BODY_SHIFT}>
      {/* helmet */}
      <ellipse cx="500" cy="150" rx="33" ry="35" fill="url(#helmet)" />
      <path d="M470 140Q500 128 530 140" stroke="#a31a2f" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M500 118V176" stroke="#a31a2f" strokeWidth="4" />
      <ellipse cx="500" cy="150" rx="33" ry="35" fill="url(#shade)" opacity="0.35" />
      <path d="M480 128Q500 118 520 128" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" fill="none" />
      {/* halo hoop around the helmet */}
      <g fill="none" strokeLinecap="round">
        <path d="M446 236Q448 116 500 104Q552 116 554 236" stroke="#020203" strokeWidth="15" />
        <path d="M446 236Q448 116 500 104Q552 116 554 236" stroke="url(#titanium)" strokeWidth="10" />
        <path d="M453 222Q456 124 500 111" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.4" />
      </g>
      {/* airbox / shark fin */}
      <path d="M468 178Q500 166 532 178L544 252H456Z" fill="url(#paint)" />
      <path d="M468 178Q500 166 532 178L544 252H456Z" fill="url(#coat)" />
      <path d="M468 178Q500 166 532 178" stroke="#f0d6da" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />
    </g>

    {/* ============ ENGINE COVER ============ */}
    <g style={BODY_SHIFT}>
      <path d={ENGINE} fill="url(#paint)" />
      <path d={ENGINE} fill="url(#coat)" />
      <path d={ENGINE} fill="url(#spec)" />
      <g clipPath="url(#hoodClip)">
        <path d="M489 236L452 432H470L497 236Z" fill="#e9e9ec" opacity="0.9" />
        <path d="M511 236L548 432H530L503 236Z" fill="#e9e9ec" opacity="0.9" />
        <path d="M384 432Q434 330 462 236L470 238Q444 332 396 432Z" fill="url(#carbon)" />
        <path d="M616 432Q566 330 538 236L530 238Q556 332 604 432Z" fill="url(#carbon)" />
        <path d={ENGINE} fill="url(#shade)" opacity="0.35" />
      </g>
      <path d="M462 236Q434 330 384 432M538 236Q566 330 616 432" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.2" fill="none" />
      {/* glints (moving reflection bands on the cover) */}
      <g ref={glintRef} clipPath="url(#hoodClip)" />
    </g>

    {/* ============ SIDEPODS ============ */}
    <g style={BODY_SHIFT}>
      <use href="#pod" />
      <use href="#pod" transform={MIRROR_FLIP} />
    </g>

    {/* ============ GEARBOX / EXHAUST / DIFFUSER ============ */}
    <g style={BODY_SHIFT}>
      <path d="M424 426H576L592 476H408Z" fill="url(#carbon)" />
      <path d="M424 426H576L592 476H408Z" fill="url(#shade)" opacity="0.45" />
      <path d="M424 426H576" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.2" />
      {/* exhaust tailpipe - glows with heat */}
      <ellipse cx="500" cy="408" rx="30" ry="26" fill="url(#exhaust)" style={{ opacity: "calc(0.15 + var(--heat, 0) * 0.85)" }} />
      <circle cx="500" cy="408" r="12" fill="#06070a" stroke="url(#titanium)" strokeWidth="3" />
      <circle cx="500" cy="408" r="6" fill="#ff7a2f" style={{ opacity: "calc(0.1 + var(--heat, 0) * 0.8)" }} />
      {/* diffuser */}
      <path d="M326 480H674L706 508H294Z" fill="#050506" />
      <path d="M326 480H674" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.2" />
      <path d="M356 482L336 508M392 482L378 508M428 482L420 508M464 482L462 508M500 482V508M536 482L538 508M572 482L580 508M608 482L622 508M644 482L664 508" stroke="#1f2126" strokeWidth="3.5" />
      {/* rain / brake light */}
      <ellipse cx="500" cy="452" rx="48" ry="30" fill="url(#taillight)" style={{ opacity: "calc(0.2 + var(--brake, 0) * 0.8)" }} />
      <rect x="484" y="444" width="32" height="16" rx="3" fill="#ff2b3a" filter="url(#led)" style={{ opacity: "calc(0.45 + var(--brake, 0) * 0.55)" }} />
    </g>

    {/* ============ REAR SUSPENSION ============ */}
    <g style={REAR_TYRE_SHIFT} strokeLinecap="round" fill="none">
      <path d="M312 380L424 410M312 446L424 436" stroke="#050506" strokeWidth="13" />
      <path d="M312 380L424 410M312 446L424 436" stroke="url(#carbon)" strokeWidth="10" />
      <path d="M688 380L576 410M688 446L576 436" stroke="#050506" strokeWidth="13" />
      <path d="M688 380L576 410M688 446L576 436" stroke="url(#carbon)" strokeWidth="10" />
      <path d="M312 378L424 408M688 378L576 408" stroke="#fff" strokeOpacity="0.15" strokeWidth="1.3" />
    </g>

    {/* ============ REAR TYRES (near) + the side of the car revealed in a corner ============ */}
    <g style={REAR_TYRE_SHIFT}>
      {/* left sidewall - shows when the car turns right */}
      <g style={{ transformOrigin: "170px 0px", transform: "scaleX(var(--side-l, 0))" }}>
        <path d="M170 294Q122 312 116 402Q118 484 170 506Z" fill="url(#wall)" />
        <path d="M150 360Q132 404 150 456" stroke="#5c616b" strokeOpacity="0.7" strokeWidth="3" fill="none" />
        <path d="M170 294Q122 312 116 402" stroke="#fff" strokeOpacity="0.15" strokeWidth="1.4" fill="none" />
      </g>
      {/* right sidewall - shows when the car turns left */}
      <g style={{ transformOrigin: "830px 0px", transform: "scaleX(var(--side-r, 0))" }}>
        <path d="M830 294Q878 312 884 402Q882 484 830 506Z" fill="url(#wall)" />
        <path d="M850 360Q868 404 850 456" stroke="#5c616b" strokeOpacity="0.7" strokeWidth="3" fill="none" />
        <path d="M830 294Q878 312 884 402" stroke="#fff" strokeOpacity="0.15" strokeWidth="1.4" fill="none" />
      </g>
      <use href="#rtyre" />
      <use href="#rtyre" transform={MIRROR_FLIP} />
    </g>

    {/* ============ REAR WING (nearest - swings the most) ============ */}
    <g style={REAR_WING_SHIFT}>
      {/* pylon */}
      <rect x="488" y="268" width="24" height="96" fill="url(#carbon)" />
      <rect x="488" y="268" width="24" height="96" fill="url(#shade)" opacity="0.4" />
      {/* beam wing */}
      <path d="M368 334H632L622 356H378Z" fill="url(#carbon)" />
      <path d="M368 334H632" stroke="#a31a2f" strokeWidth="2.5" />
      <path d="M368 334H632" stroke="#fff" strokeOpacity="0.15" strokeWidth="1" />
      {/* main plane */}
      <path d="M338 244H662V270H338Z" fill="url(#carbon)" />
      <path d="M338 244H662" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.2" />
      <path d="M338 270H662" stroke="#000" strokeOpacity="0.6" strokeWidth="2" />
      {/* upper (DRS) flap */}
      <path d="M340 212H660V240H340Z" fill="url(#paint)" />
      <path d="M340 212H660V240H340Z" fill="url(#coat)" />
      <path d="M340 212H660" stroke="#f0d6da" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M340 240H660" stroke="#000" strokeOpacity="0.55" strokeWidth="2" />
      {/* DRS actuator pods */}
      <rect x="466" y="212" width="68" height="28" fill="#08080a" opacity="0.75" />
      {/* race number */}
      <text x="500" y="237" fill="#f2f2f4" fontSize="26" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="800" textAnchor="middle">8</text>
      {/* endplates */}
      <use href="#endplate" />
      <use href="#endplate" transform={MIRROR_FLIP} />
    </g>
  </svg>
);