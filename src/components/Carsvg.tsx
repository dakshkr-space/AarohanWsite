import React from "react";

/**
 * Photoreal-style first-person single-seater (cockpit POV).
 * Props/ids kept compatible with CarAnimation (carRef, glintRef, hoodClip,
 * .tyre-roll classes, hood geometry used by the glint effect).
 */
interface CarSvgProps {
  carRef: React.RefObject<SVGSVGElement | null>;
  glintRef: React.RefObject<SVGGElement | null>;
}

const HOOD = "M478 250Q500 238 522 250Q620 390 810 520H190Q380 390 478 250Z";
const POD = "M136 520Q150 410 262 392L370 410Q396 460 414 520Z";
const MIRROR_FLIP = "translate(1000 0) scale(-1 1)";

export const CarSvg: React.FC<CarSvgProps> = ({ carRef, glintRef }) => (
  <svg
    ref={carRef}
    id="car"
    viewBox="0 0 1000 520"
    aria-hidden="true"
    className="absolute left-1/2 bottom-[1vh] z-[5] w-[min(62vw,780px)] min-w-[440px] origin-[50%_100%] will-change-transform pointer-events-none drop-shadow-[0_24px_40px_rgba(0,0,0,0.9)]"
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
        <stop offset="0" stopColor="#140305" />
        <stop offset="0.16" stopColor="#4a0a12" />
        <stop offset="0.38" stopColor="#7d1220" />
        <stop offset="0.5" stopColor="#92162a" />
        <stop offset="0.62" stopColor="#7d1220" />
        <stop offset="0.84" stopColor="#4a0a12" />
        <stop offset="1" stopColor="#140305" />
      </linearGradient>
      {/* clearcoat: sky reflection top, ground bounce bottom */}
      <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#cfd8ea" stopOpacity="0.42" />
        <stop offset="0.16" stopColor="#cfd8ea" stopOpacity="0.07" />
        <stop offset="0.5" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.78" />
      </linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.95" />
      </linearGradient>
      <radialGradient id="spec" cx="0.5" cy="0.1" r="0.55">
        <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="rubber" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#030304" />
        <stop offset="0.45" stopColor="#17181c" />
        <stop offset="1" stopColor="#050506" />
      </linearGradient>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#202226" />
        <stop offset="1" stopColor="#08080a" />
      </linearGradient>
      <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6d727c" />
        <stop offset="0.5" stopColor="#2b2e35" />
        <stop offset="1" stopColor="#101114" />
      </linearGradient>
      <linearGradient id="titanium" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#aab0ba" />
        <stop offset="0.45" stopColor="#5c616b" />
        <stop offset="1" stopColor="#23262c" />
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6f7f96" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="#1a212c" stopOpacity="0.85" />
        <stop offset="1" stopColor="#07090d" />
      </linearGradient>
      <radialGradient id="disc" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.6" stopColor="#ff5a1f" stopOpacity="0" />
        <stop offset="0.85" stopColor="#ff5a1f" stopOpacity="0.5" />
        <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
      </radialGradient>

      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <filter id="led" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      <clipPath id="hoodClip"><path d={HOOD} /></clipPath>

      {/* ---- front tyre + wheel ---- */}
      <g id="tyre">
        <path d="M18 298Q18 245 78 240L190 230Q232 233 240 286L246 488Q242 528 192 534L70 534Q16 528 13 478Z" fill="url(#rubber)" />
        <path d="M18 298Q18 245 78 240L190 230Q232 233 240 286L246 488Q242 528 192 534L70 534Q16 528 13 478Z" fill="#fff" filter="url(#grain)" opacity="0.08" />
        {/* shoulder / sidewall */}
        <path d="M76 240L190 230Q230 233 236 282Q138 312 33 302Q28 252 76 240Z" fill="url(#wall)" />
        {/* compound band + marking */}
        <path d="M60 262Q128 272 212 254" stroke="#b3141f" strokeWidth="3" strokeLinecap="round" fill="none" />
        <text x="104" y="291" fill="#8d9199" fontSize="10" fontFamily="Helvetica, Arial, sans-serif" fontWeight="600" letterSpacing="3" transform="rotate(10 104 291)">SOFT · C3</text>
        {/* circumferential grooves */}
        <path d="M58 318Q64 430 94 522M108 314Q114 430 138 526M158 312Q162 430 180 528" stroke="#000" strokeOpacity="0.9" strokeWidth="3" fill="none" />
        <path d="M61 318Q67 430 97 522M111 314Q117 430 141 526M161 312Q165 430 183 528" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" fill="none" />
        {/* rolling tread: driven by --roll-offset (accumulated from scroll speed).
            Crisp lugs at low speed, cross-fading into motion-blur streaks at high speed. */}
        <g style={{ opacity: "calc(1 - var(--roll-blur, 0))" }}>
          <path d="M28 326Q38 430 70 514M83 322Q90 430 116 518M133 318Q138 430 158 522M185 316Q188 430 203 524" stroke="#000" strokeOpacity="0.75" strokeWidth="8" fill="none" strokeDasharray="20 22" style={{ strokeDashoffset: "var(--roll-offset, 0)" }} />
          <path d="M40 330Q50 430 84 514M150 316Q155 430 176 524" stroke="#2a2c31" strokeWidth="2" fill="none" strokeDasharray="14 26" style={{ strokeDashoffset: "var(--roll-offset, 0)" }} />
        </g>
        <g style={{ opacity: "var(--roll-blur, 0)" }}>
          <path d="M28 326Q38 430 70 514M83 322Q90 430 116 518M133 318Q138 430 158 522M185 316Q188 430 203 524" stroke="#23252a" strokeOpacity="0.55" strokeWidth="9" fill="none" strokeDasharray="110 30" style={{ strokeDashoffset: "var(--roll-offset, 0)" }} />
          <path d="M55 322Q64 430 98 516M108 318Q114 430 140 520M160 316Q164 430 182 522" stroke="#000" strokeOpacity="0.5" strokeWidth="14" fill="none" strokeDasharray="70 50" style={{ strokeDashoffset: "var(--roll-offset, 0)" }} />
        </g>
        {/* brake disc heat + forged rim */}
        <ellipse cx="214" cy="410" rx="30" ry="78" fill="url(#disc)" style={{ opacity: "calc(0.3 + var(--heat, 0) * 0.7)" }} />
        <ellipse cx="222" cy="410" rx="20" ry="70" fill="#0b0c0f" stroke="#3b3e46" strokeWidth="1.5" />
        <ellipse cx="226" cy="410" rx="13" ry="56" fill="url(#rim)" stroke="#0a0a0c" strokeWidth="2" />
        {/* rim turns about the axle: 5 spokes rotated in the wheel plane, squashed by the viewing angle */}
        <g style={{ transform: "translate(226px,410px) scale(0.23,1) rotate(calc(var(--spin, 0) * 1deg))", opacity: "calc(1 - var(--roll-blur, 0) * 0.8)" }}>
          {[0, 72, 144, 216, 288].map((a) => (
            <line key={a} x1="0" y1="0" x2="0" y2="-50" transform={`rotate(${a})`} stroke="#14151a" strokeWidth="9" strokeLinecap="round" />
          ))}
        </g>
        {/* spinning-disc sheen at speed */}
        <ellipse cx="226" cy="410" rx="12" ry="52" fill="url(#rim)" style={{ opacity: "calc(var(--roll-blur, 0) * 0.65)" }} />
        <circle cx="226" cy="410" r="6" fill="url(#titanium)" stroke="#000" strokeWidth="1.5" />
        <path d="M18 298Q18 245 78 240L190 230" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.6" fill="none" />
      </g>

      {/* ---- suspension ---- */}
      <g id="arms">
        <path d="M232 292L372 388M232 350L372 418" stroke="#050506" strokeWidth="14" strokeLinecap="round" />
        <path d="M232 292L372 388M232 350L372 418" stroke="url(#carbon)" strokeWidth="11" strokeLinecap="round" />
        <path d="M232 289L372 385M232 347L372 415" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M238 322L342 348" stroke="url(#titanium)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="234" cy="293" r="6" fill="url(#titanium)" stroke="#0a0a0c" strokeWidth="1.2" />
        <circle cx="234" cy="350" r="6" fill="url(#titanium)" stroke="#0a0a0c" strokeWidth="1.2" />
      </g>

      {/* ---- sidepod ---- */}
      <g id="pod">
        <path d={POD} fill="url(#paint)" />
        <path d={POD} fill="url(#coat)" />
        <path d={POD} fill="url(#shade)" opacity="0.5" />
        <path d="M300 436L384 452L392 520H318Z" fill="#050506" opacity="0.88" />
        <path d="M304 452L388 468M308 474L392 490" stroke="#1d1f24" strokeWidth="3" />
        <path d="M262 392L370 410" stroke="#e8c9ce" strokeOpacity="0.5" strokeWidth="1.8" />
        <path d="M136 520Q150 410 262 392" stroke="#000" strokeOpacity="0.5" strokeWidth="2" fill="none" />
      </g>

      {/* ---- mirror ---- */}
      <g id="mirror">
        <path d="M212 352L292 398" stroke="url(#carbon)" strokeWidth="8" strokeLinecap="round" />
        <rect x="96" y="318" width="124" height="54" rx="14" fill="url(#carbon)" />
        <rect x="96" y="318" width="124" height="54" rx="14" fill="url(#coat)" opacity="0.5" />
        <rect x="96" y="318" width="124" height="54" rx="14" fill="none" stroke="#000" strokeOpacity="0.7" strokeWidth="1.5" />
        <rect x="106" y="327" width="104" height="36" rx="8" fill="url(#glass)" />
        <path d="M112 356Q160 340 206 348" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.2" fill="none" />
        <path d="M96 340H220" stroke="#8f1020" strokeWidth="1.6" strokeOpacity="0.8" />
      </g>

      {/* ---- glove ---- */}
      <g id="glove">
        <path d="M356 514Q352 484 380 478Q412 474 424 496Q430 514 426 524H360Z" fill="#0c0c0e" />
        <path d="M356 514Q352 484 380 478Q412 474 424 496" stroke="#2a2b30" strokeWidth="2" fill="none" />
        <path d="M368 500Q390 494 414 502M366 512Q390 506 418 514" stroke="#000" strokeOpacity="0.8" strokeWidth="1.6" fill="none" />
        <path d="M374 488Q392 482 410 489" stroke="#fff" strokeOpacity="0.1" strokeWidth="1.2" fill="none" />
      </g>
    </defs>

    {/* suspension + tyres */}
    <use href="#arms" />
    <use href="#arms" transform={MIRROR_FLIP} />
    {/* tyres steer sideways with the wheel and lag the body over bumps (unsprung mass) */}
    <g style={{ transform: "translate(calc(var(--steer-n, 0) * 8px), calc(var(--unsprung, 0) * 1px))" }}>
      <use href="#tyre" />
    </g>
    <g style={{ transform: "translate(calc(var(--steer-n, 0) * 8px), calc(var(--unsprung, 0) * 1px))" }}>
      <use href="#tyre" transform={MIRROR_FLIP} />
    </g>

    {/* nose + hood */}
    <path d={HOOD} fill="url(#paint)" />
    <path d={HOOD} fill="url(#coat)" />
    <path d={HOOD} fill="url(#spec)" />
    <g clipPath="url(#hoodClip)">
      <path d="M489 245L452 520H470L497 245Z" fill="#e9e9ec" opacity="0.92" />
      <path d="M511 245L548 520H530L503 245Z" fill="#e9e9ec" opacity="0.92" />
      <path d="M190 520Q380 390 478 250L470 252Q372 392 176 520Z" fill="url(#carbon)" />
      <path d="M810 520Q620 390 522 250L530 252Q628 392 824 520Z" fill="url(#carbon)" />
      <path d="M478 250Q380 390 190 520" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" fill="none" />
      <path d="M522 250Q620 390 810 520" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" fill="none" />
      <path d={HOOD} fill="url(#shade)" opacity="0.35" />
    </g>

    {/* race number decal */}
    <rect x="474" y="326" width="52" height="40" rx="4" fill="#0b0b0d" opacity="0.92" />
    <text x="500" y="358" fill="#f2f2f4" fontSize="32" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="800" textAnchor="middle">8</text>

    {/* panel seams */}
    <path d="M488 262Q432 400 380 520M512 262Q568 400 620 520" stroke="#000" strokeOpacity="0.45" strokeWidth="1.5" fill="none" />
    <path d="M478 250Q500 238 522 250" stroke="#f0d6da" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />

    {/* glints */}
    <g ref={glintRef} clipPath="url(#hoodClip)" />

    {/* sidepods */}
    <use href="#pod" />
    <use href="#pod" transform={MIRROR_FLIP} />

    {/* cockpit opening + padding */}
    <path d="M398 520Q406 420 444 400H556Q594 420 602 520Z" fill="#020203" />
    <path d="M398 520Q406 420 444 400H556Q594 420 602 520Z" fill="none" stroke="#1b1c20" strokeWidth="7" />
    <path d="M404 516Q412 426 446 406" stroke="#8f1020" strokeOpacity="0.55" strokeWidth="1.5" fill="none" />
    <path d="M398 520Q406 420 444 400H556Q594 420 602 520Z" fill="url(#shade)" />

    {/* mirrors */}
    <use href="#mirror" />
    <use href="#mirror" transform={MIRROR_FLIP} />

    {/* halo (titanium) */}
    <g fill="none" strokeLinecap="round">
      <path d="M404 474Q414 388 500 368Q586 388 596 474" stroke="#020203" strokeWidth="16" />
      <path d="M404 474Q414 388 500 368Q586 388 596 474" stroke="url(#titanium)" strokeWidth="11" />
      <path d="M411 452Q423 394 500 375" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.4" />
      <path d="M500 370V312" stroke="#020203" strokeWidth="14" />
      <path d="M500 370V312" stroke="url(#titanium)" strokeWidth="9" />
      <path d="M497 366V316" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.2" />
    </g>

    {/* steering wheel (+ hands) rotates with --steer-deg */}
    <g style={{ transformOrigin: "500px 484px", transform: "rotate(calc(var(--steer-deg, 0) * 1deg))" }}>
      <use href="#glove" />
      <use href="#glove" transform={MIRROR_FLIP} />
      <path d="M394 446Q394 420 426 420H574Q606 420 606 446V524Q606 548 574 548H426Q394 548 394 524Z" fill="url(#carbon)" stroke="#050506" strokeWidth="3" />
      <path d="M394 446Q394 420 426 420H574" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.2" fill="none" />
      <path d="M394 446V524Q394 540 410 540V430Q394 430 394 446Z" fill="#0a0a0c" />
      <path d="M606 446V524Q606 540 590 540V430Q606 430 606 446Z" fill="#0a0a0c" />

      {/* display */}
      <rect x="440" y="436" width="120" height="54" rx="4" fill="#03070b" stroke="#23262c" strokeWidth="2" />
      <text x="500" y="470" fill="#e9eef5" fontSize="28" fontFamily="'Courier New', monospace" fontWeight="700" textAnchor="middle">8</text>
      <text x="448" y="450" fill="#7fa6c8" fontSize="7" fontFamily="Arial, sans-serif">LAP 42</text>
      <text x="552" y="450" fill="#7fa6c8" fontSize="7" fontFamily="Arial, sans-serif" textAnchor="end">DELTA −0.21</text>
      <text id="hud-speed" x="448" y="484" fill="#9aa3ad" fontSize="7" fontFamily="Arial, sans-serif">0 km/h</text>
      <text x="552" y="484" fill="#9aa3ad" fontSize="7" fontFamily="Arial, sans-serif" textAnchor="end">P1</text>
      <rect x="440" y="436" width="120" height="54" rx="4" fill="url(#glass)" opacity="0.35" />

      {/* shift lights */}
      <g filter="url(#led)">
        {[
          [434, "#2fd16b"], [451, "#2fd16b"], [468, "#2fd16b"],
          [484, "#e6b400"], [500, "#e6b400"], [516, "#e6b400"],
          [532, "#d6212b"], [549, "#d6212b"], [566, "#d6212b"],
        ].map(([x, c]) => (
          <circle key={x} className="shift-led" cx={x as number} cy="428" r="3" fill={c as string} style={{ opacity: 0.16 }} />
        ))}
      </g>

      {/* rotaries + buttons */}
      {[[424, 466, "#8f1020"], [424, 504, "#b88a00"], [576, 466, "#2a5fb0"], [576, 504, "#2a8a55"]].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x as number} cy={y as number} r="10" fill="#121316" stroke="#3a3c42" strokeWidth="1.5" />
          <circle cx={x as number} cy={y as number} r="5.5" fill={c as string} />
          <path d={`M${x} ${y}V${(y as number) - 8}`} stroke="#e8e8ea" strokeWidth="1.5" />
        </g>
      ))}
      <circle cx="500" cy="512" r="12" fill="#121316" stroke="#3a3c42" strokeWidth="1.5" />
      <circle cx="500" cy="512" r="7" fill="#8f1020" />
    </g>
  </svg>
);