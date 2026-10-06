import React from "react";

/**
 * High-fidelity Single-Seater Race Car (Rear Chase Camera View).
 *
 * Consumes dynamic physics variables from CarAnimation:
 *   --roll-offset : smooth continuous tyre tread travel (px)
 *   --roll-blur   : motion blur intensity (0..1)
 *   --spin        : wheel disc angle (deg)
 *   --steer-deg   : front wheel steering angle (deg)
 *   --steer-n     : front axle lateral steering bias (-1..1)
 *   --heat        : brake disc & exhaust core temperature (0..1)
 *   --brake       : brake light & decelerating disc glow (0..1)
 *   --unsprung    : suspension travel offset (px)
 *   --yaw-n       : subtle aero parallax (-1..1)
 */
interface CarSvgProps {
  carRef: React.RefObject<SVGSVGElement | null>;
  glintRef: React.RefObject<SVGGElement | null>;
}

// Engine cover shape for glint clipping
const ENGINE = "M464 236H536Q564 330 614 432H386Q436 330 464 236Z";
const MIRROR_FLIP = "translate(1000 0) scale(-1 1)";

// Subtle natural parallax shifts (calibrated for realism without 2D shear)
const REAR_WING_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * -8px), calc(var(--unsprung, 0) * -0.2px))",
};
const REAR_TYRE_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * -4px), calc(var(--unsprung, 0) * 0.7px))",
};
const BODY_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * -2px), 0)",
};
const FRONT_SHIFT: React.CSSProperties = {
  transform: "translate(calc(var(--yaw-n, 0) * 10px), 0)",
};
const FRONT_TYRE_SHIFT: React.CSSProperties = {
  transform:
    "translate(calc(var(--steer-n, 0) * 4px + var(--yaw-n, 0) * 10px), calc(var(--unsprung, 0) * 0.4px))",
};

export const CarSvg: React.FC<CarSvgProps> = ({ carRef, glintRef }) => (
  <svg
    ref={carRef}
    id="car"
    viewBox="0 80 1000 440"
    aria-hidden="true"
    className="absolute left-1/2 bottom-[2vh] z-[5] w-[min(54vw,660px)] min-w-[340px] origin-[50%_100%] will-change-transform pointer-events-none drop-shadow-[0_24px_34px_rgba(0,0,0,0.92)]"
  >
    <defs>
      {/* Carbon fiber weave pattern */}
      <pattern id="carbon" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#090a0d" />
        <rect width="4" height="4" fill="#14161a" />
        <rect x="4" y="4" width="4" height="4" fill="#14161a" />
        <rect width="8" height="8" fill="none" stroke="#040405" strokeWidth="0.4" />
      </pattern>

      {/* Deep Metallic Racing Crimson (matching Figma frame) */}
      <linearGradient id="paint" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1a0408" />
        <stop offset="0.18" stopColor="#5a0b16" />
        <stop offset="0.5" stopColor="#a31427" />
        <stop offset="0.82" stopColor="#5a0b16" />
        <stop offset="1" stopColor="#1a0408" />
      </linearGradient>

      {/* Clearcoat sheen */}
      <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d5dbe8" stopOpacity="0.45" />
        <stop offset="0.18" stopColor="#d5dbe8" stopOpacity="0.08" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.75" />
      </linearGradient>

      {/* Ambient shadow gradient */}
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.92" />
      </linearGradient>

      {/* Specular highlight */}
      <radialGradient id="spec" cx="0.5" cy="0.1" r="0.55">
        <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>

      {/* Racing slick rubber */}
      <linearGradient id="rubber" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#040405" />
        <stop offset="0.2" stopColor="#121317" />
        <stop offset="0.5" stopColor="#1e2026" />
        <stop offset="0.8" stopColor="#121317" />
        <stop offset="1" stopColor="#040405" />
      </linearGradient>

      {/* Tyre sidewall gradient */}
      <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#07080a" />
        <stop offset="1" stopColor="#22242a" />
      </linearGradient>

      {/* Titanium alloy */}
      <linearGradient id="titanium" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c5cbd6" />
        <stop offset="0.45" stopColor="#676d78" />
        <stop offset="1" stopColor="#202328" />
      </linearGradient>

      {/* Glowing brake rotor radial gradient */}
      <radialGradient id="brakeglow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ff7a1a" stopOpacity="0.95" />
        <stop offset="0.55" stopColor="#e0182d" stopOpacity="0.8" />
        <stop offset="0.9" stopColor="#8a0c1a" stopOpacity="0.3" />
        <stop offset="1" stopColor="#8a0c1a" stopOpacity="0" />
      </radialGradient>

      {/* Helmet gradient */}
      <linearGradient id="helmet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f5f6fa" />
        <stop offset="0.6" stopColor="#bcc0c9" />
        <stop offset="1" stopColor="#555963" />
      </linearGradient>

      {/* Rain / brake light glow */}
      <radialGradient id="taillight" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ff3348" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#ff1129" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ff1129" stopOpacity="0" />
      </radialGradient>

      {/* Exhaust heat glow */}
      <radialGradient id="exhaust" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffab38" stopOpacity="0.95" />
        <stop offset="0.5" stopColor="#ff4e18" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ff4e18" stopOpacity="0" />
      </radialGradient>

      {/* Ground contact shadow */}
      <radialGradient id="ground" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.8" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>

      {/* LED glow filter */}
      <filter id="led" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2.5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Engine cover clip for reflections */}
      <clipPath id="hoodClip">
        <path d={ENGINE} />
      </clipPath>

      {/* Tyre contact patch clip for tread motion */}
      <clipPath id="tyreClipL">
        <rect x="168" y="272" width="144" height="236" rx="24" />
      </clipPath>

      {/* ================= REAR TYRE DEFINITION (LEFT, MIRRORED FOR RIGHT) ================= */}
      <g id="rtyre">
        {/* Glowing Carbon-Ceramic Brake Disc (visible through the inner wheel hub) */}
        <g opacity="calc(0.2 + var(--heat, 0) * 0.7 + var(--brake, 0) * 0.35)">
          <circle cx="298" cy="424" r="34" fill="url(#brakeglow)" />
          <circle cx="298" cy="424" r="26" fill="#180508" stroke="#ff5020" strokeWidth="2.5" />
          {/* Brake caliper */}
          <rect x="294" y="402" width="18" height="22" rx="3" fill="#d01424" />
        </g>

        {/* Tyre Rubber Base */}
        <rect x="168" y="272" width="144" height="236" rx="24" fill="url(#rubber)" />

        {/* Tyre Shoulder & Sidewall Curve */}
        <path
          d="M174 300Q174 274 204 272H276Q306 274 306 300Q240 316 174 300Z"
          fill="url(#wall)"
          opacity="0.92"
        />
        {/* Red Pirelli / Aarohan Compound Stripe */}
        <path
          d="M184 294Q240 306 296 294"
          stroke="#e0182d"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Circumferential Rain/Slick Grooves (stay stationary at fixed X channels) */}
        <path
          d="M208 318V506M240 318V508M272 318V506"
          stroke="#070709"
          strokeWidth="3"
          strokeOpacity="0.88"
          fill="none"
        />
        <path
          d="M210 318V506M242 318V508M274 318V506"
          stroke="#fff"
          strokeOpacity="0.06"
          strokeWidth="1"
          fill="none"
        />

        {/* Dynamic Continuous Tyre Tread Rotation (clipped to tyre body) */}
        <g clipPath="url(#tyreClipL)">
          {/* Repeating horizontal speed tread grooves scrolling smoothly downwards */}
          <g
            style={{
              transform: "translateY(calc(var(--roll-offset, 0px)))",
            }}
          >
            {/* Base tile of tread marks */}
            {[-120, -60, 0, 60, 120, 180, 240, 300].map((offsetY) => (
              <g key={offsetY} transform={`translate(0, ${offsetY})`}>
                <line
                  x1="184"
                  y1="340"
                  x2="296"
                  y2="340"
                  stroke="#08080b"
                  strokeWidth="3"
                  strokeOpacity="0.8"
                />
                <line
                  x1="184"
                  y1="341"
                  x2="296"
                  y2="341"
                  stroke="#fff"
                  strokeWidth="1"
                  strokeOpacity="0.08"
                />
                <circle cx="196" cy="355" r="2.2" fill="#08080b" opacity="0.6" />
                <circle cx="284" cy="355" r="2.2" fill="#08080b" opacity="0.6" />
              </g>
            ))}
          </g>

          {/* High-speed motion blur sheen (blends smoothly as car speeds up) */}
          <rect
            x="168"
            y="310"
            width="144"
            height="198"
            fill="url(#rubber)"
            opacity="calc(var(--roll-blur, 0) * 0.65)"
          />
          <g opacity="calc(var(--roll-blur, 0) * 0.5)">
            <line x1="200" y1="320" x2="200" y2="506" stroke="#25272e" strokeWidth="12" />
            <line x1="240" y1="320" x2="240" y2="508" stroke="#1d1e24" strokeWidth="16" />
            <line x1="280" y1="320" x2="280" y2="506" stroke="#25272e" strokeWidth="12" />
          </g>
        </g>

        {/* Specular edge light for 3D curvature */}
        <path d="M174 298V490" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.8" fill="none" />
        <path d="M308 298V490" stroke="#000" strokeOpacity="0.5" strokeWidth="2" fill="none" />
        <path
          d="M174 300Q174 274 204 272H276"
          stroke="#fff"
          strokeOpacity="0.16"
          strokeWidth="1.6"
          fill="none"
        />
      </g>

      {/* ================= FRONT TYRE DEFINITION (LEFT, ANGLED BY STEERING) ================= */}
      <g id="ftyre">
        <g
          style={{
            transformOrigin: "128px 434px",
            transform: "rotate(calc(var(--steer-deg, 0) * 0.45deg))",
          }}
        >
          <rect x="98" y="380" width="60" height="110" rx="14" fill="url(#rubber)" />
          {/* Shoulder */}
          <path
            d="M102 398Q102 384 116 382H142Q156 384 156 398Q130 406 102 398Z"
            fill="url(#wall)"
            opacity="0.9"
          />
          {/* Longitudinal grooves */}
          <path
            d="M116 408V486M128 408V487M140 408V486"
            stroke="#000"
            strokeOpacity="0.9"
            strokeWidth="2.2"
            fill="none"
          />
          {/* Rotating speed ribs */}
          <g
            style={{
              transform: "translateY(calc(var(--roll-offset, 0px) * 0.6))",
            }}
          >
            {[-60, 0, 60, 120].map((offsetY) => (
              <line
                key={offsetY}
                x1="106"
                y1={420 + offsetY}
                x2="150"
                y2={420 + offsetY}
                stroke="#000"
                strokeWidth="2.5"
                strokeOpacity="0.6"
              />
            ))}
          </g>
          <path d="M102 396V480" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.3" fill="none" />
        </g>
      </g>

      {/* Sidepod left */}
      <g id="pod">
        <path d="M420 318Q352 322 324 374L306 466Q312 484 342 486H426Z" fill="url(#paint)" />
        <path d="M420 318Q352 322 324 374L306 466Q312 484 342 486H426Z" fill="url(#coat)" />
        <path d="M420 318Q352 322 324 374L306 466Q312 484 342 486H426Z" fill="url(#shade)" opacity="0.4" />
        {/* Radiator cooling louvres */}
        <path d="M352 408L412 400V442L346 448Z" fill="#040507" opacity="0.94" />
        <path d="M350 420L411 413M348 433L411 427" stroke="#1c1e22" strokeWidth="3" />
        <path d="M420 318Q352 322 324 374" stroke="#f0d6da" strokeOpacity="0.5" strokeWidth="1.6" fill="none" />
      </g>

      {/* Rear wing endplate left */}
      <g id="endplate">
        <path d="M316 206Q328 196 342 202V342Q328 352 316 346Z" fill="url(#carbon)" />
        <path d="M316 206Q328 196 342 202V342Q328 352 316 346Z" fill="url(#coat)" opacity="0.5" />
        <path d="M316 206Q328 196 342 202" stroke="#a31427" strokeWidth="3.2" fill="none" />
        <path d="M320 214V338" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.2" />
      </g>
    </defs>

    {/* Ground contact shadow */}
    <ellipse cx="500" cy="508" rx="430" ry="18" fill="url(#ground)" />

    {/* ============ FRONT WING & NOSE ============ */}
    <g style={FRONT_SHIFT}>
      <path d="M60 474H940V492H60Z" fill="url(#carbon)" />
      <path d="M60 474H940" stroke="#a31427" strokeWidth="2.5" />
      <path d="M54 442Q62 436 70 442V494H54Z" fill="url(#carbon)" />
      <path d="M930 442Q938 436 946 442V494H930Z" fill="url(#carbon)" />
      <path d="M54 442Q62 436 70 442" stroke="#a31427" strokeWidth="2.5" fill="none" />
      <path d="M930 442Q938 436 946 442" stroke="#a31427" strokeWidth="2.5" fill="none" />
    </g>

    {/* Front Tyres */}
    <g style={FRONT_TYRE_SHIFT}>
      <use href="#ftyre" />
      <use href="#ftyre" transform={MIRROR_FLIP} />
    </g>

    {/* ============ DRIVER + HALO ============ */}
    <g style={BODY_SHIFT}>
      {/* Helmet */}
      <ellipse cx="500" cy="150" rx="33" ry="35" fill="url(#helmet)" />
      <path d="M470 140Q500 128 530 140" stroke="#a31427" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M500 118V176" stroke="#a31427" strokeWidth="4" />
      <ellipse cx="500" cy="150" rx="33" ry="35" fill="url(#shade)" opacity="0.35" />
      <path d="M480 128Q500 118 520 128" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" fill="none" />

      {/* Titanium Halo Hoop */}
      <g fill="none" strokeLinecap="round">
        <path d="M446 236Q448 116 500 104Q552 116 554 236" stroke="#020203" strokeWidth="15" />
        <path d="M446 236Q448 116 500 104Q552 116 554 236" stroke="url(#titanium)" strokeWidth="10" />
        <path d="M453 222Q456 124 500 111" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.4" />
      </g>

      {/* Shark fin airbox */}
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
        {/* Silver twin racing stripes */}
        <path d="M489 236L452 432H470L497 236Z" fill="#e9e9ec" opacity="0.9" />
        <path d="M511 236L548 432H530L503 236Z" fill="#e9e9ec" opacity="0.9" />
        <path d="M384 432Q434 330 462 236L470 238Q444 332 396 432Z" fill="url(#carbon)" />
        <path d="M616 432Q566 330 538 236L530 238Q556 332 604 432Z" fill="url(#carbon)" />
        <path d={ENGINE} fill="url(#shade)" opacity="0.35" />
      </g>
      <path
        d="M462 236Q434 330 384 432M538 236Q566 330 616 432"
        stroke="#fff"
        strokeOpacity="0.16"
        strokeWidth="1.2"
        fill="none"
      />
      {/* Glints (moving specular reflection bands) */}
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

      {/* Center Exhaust Outlet (glows with throttle and heat) */}
      <ellipse
        cx="500"
        cy="408"
        rx="32"
        ry="28"
        fill="url(#exhaust)"
        style={{ opacity: "calc(0.2 + var(--heat, 0) * 0.8)" }}
      />
      <circle cx="500" cy="408" r="14" fill="#050608" stroke="url(#titanium)" strokeWidth="3" />
      <circle
        cx="500"
        cy="408"
        r="7"
        fill="#ff7a2f"
        style={{ opacity: "calc(0.15 + var(--heat, 0) * 0.85)" }}
      />

      {/* Aerodynamic Carbon Diffuser */}
      <path d="M326 480H674L706 508H294Z" fill="#040507" />
      <path d="M326 480H674" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.2" />
      <path
        d="M356 482L336 508M392 482L378 508M428 482L420 508M464 482L462 508M500 482V508M536 482L538 508M572 482L580 508M608 482L622 508M644 482L664 508"
        stroke="#1a1c22"
        strokeWidth="3.5"
      />

      {/* FIA Central Rain / Brake Light */}
      <ellipse
        cx="500"
        cy="452"
        rx="48"
        ry="30"
        fill="url(#taillight)"
        style={{ opacity: "calc(0.2 + var(--brake, 0) * 0.8)" }}
      />
      <rect
        x="484"
        y="444"
        width="32"
        height="16"
        rx="3"
        fill="#ff1f35"
        filter="url(#led)"
        style={{ opacity: "calc(0.45 + var(--brake, 0) * 0.55)" }}
      />
    </g>

    {/* ============ REAR SUSPENSION WISHBONES ============ */}
    <g style={REAR_TYRE_SHIFT} strokeLinecap="round" fill="none">
      <path d="M312 380L424 410M312 446L424 436" stroke="#040507" strokeWidth="13" />
      <path d="M312 380L424 410M312 446L424 436" stroke="url(#carbon)" strokeWidth="10" />
      <path d="M688 380L576 410M688 446L576 436" stroke="#040507" strokeWidth="13" />
      <path d="M688 380L576 410M688 446L576 436" stroke="url(#carbon)" strokeWidth="10" />
      <path d="M312 378L424 408M688 378L576 408" stroke="#fff" strokeOpacity="0.15" strokeWidth="1.3" />
    </g>

    {/* ============ REAR TYRES (LEFT & RIGHT) ============ */}
    <g style={REAR_TYRE_SHIFT}>
      <use href="#rtyre" />
      <use href="#rtyre" transform={MIRROR_FLIP} />
    </g>

    {/* ============ REAR WING (AERODYNAMIC PROFILE) ============ */}
    <g style={REAR_WING_SHIFT}>
      {/* Carbon Wing Pylon */}
      <rect x="488" y="268" width="24" height="96" fill="url(#carbon)" />
      <rect x="488" y="268" width="24" height="96" fill="url(#shade)" opacity="0.4" />

      {/* Beam Wing */}
      <path d="M368 334H632L622 356H378Z" fill="url(#carbon)" />
      <path d="M368 334H632" stroke="#a31427" strokeWidth="2.5" />
      <path d="M368 334H632" stroke="#fff" strokeOpacity="0.15" strokeWidth="1" />

      {/* Main Plane Wing Element */}
      <path d="M338 244H662V270H338Z" fill="url(#carbon)" />
      <path d="M338 244H662" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.2" />
      <path d="M338 270H662" stroke="#000" strokeOpacity="0.6" strokeWidth="2" />

      {/* Upper DRS Flap in Racing Crimson */}
      <path d="M340 212H660V240H340Z" fill="url(#paint)" />
      <path d="M340 212H660V240H340Z" fill="url(#coat)" />
      <path d="M340 212H660" stroke="#f0d6da" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M340 240H660" stroke="#000" strokeOpacity="0.55" strokeWidth="2" />

      {/* DRS Actuator Pod */}
      <rect x="466" y="212" width="68" height="28" fill="#07080a" opacity="0.78" />

      {/* Aarohan Race Monogram */}
      <text
        x="500"
        y="237"
        fill="#f2f2f5"
        fontSize="24"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        letterSpacing="0.1em"
        textAnchor="middle"
      >
        AAROHAN
      </text>

      {/* Wing Endplates */}
      <use href="#endplate" />
      <use href="#endplate" transform={MIRROR_FLIP} />
    </g>
  </svg>
);