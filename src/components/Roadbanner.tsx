import React from "react";

/**
 * Overhead gantry that sits on the road ("AAROHAN AHEAD" + arrow).
 * Positioned and scaled every scroll tick by updateBanner() in CarAnimation.
 *
 * The element is 1000 x 600 and anchored at its bottom-centre (the road
 * contact point), so scaling it keeps the posts planted on the asphalt.
 */
interface RoadBannerProps {
  bannerRef: React.RefObject<HTMLDivElement | null>;
}

const chrome =
  "linear-gradient(180deg,#f4f6fa 0%,#b9bec8 28%,#6c717c 52%,#d5d9e1 74%,#80858f 100%)";

export const RoadBanner: React.FC<RoadBannerProps> = ({ bannerRef }) => (
  <div
    ref={bannerRef}
    aria-hidden="true"
    className="absolute left-1/2 top-0 z-[6] pointer-events-none will-change-transform"
    style={{
      width: 1000,
      height: 600,
      transformOrigin: "50% 100%",
      transform: "translate(-50%, 0) scale(0)",
    }}
  >
    {/* posts */}
    {[40, 924].map((left) => (
      <div
        key={left}
        style={{
          position: "absolute",
          left,
          top: 150,
          bottom: 0,
          width: 36,
          background:
            "linear-gradient(90deg,#14151a 0%,#8d929d 35%,#e9ecf2 50%,#6b707b 70%,#0e0f13 100%)",
          boxShadow: "0 0 0 2px #05050a",
        }}
      >
        {/* base plate */}
        <div
          style={{
            position: "absolute",
            left: -14,
            right: -14,
            bottom: 0,
            height: 22,
            background: "linear-gradient(180deg,#5a5f6a,#15161b)",
            borderRadius: 3,
          }}
        />
      </div>
    ))}

    {/* beam */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 170,
        borderRadius: 14,
        padding: 8,
        background: chrome,
        boxShadow:
          "0 18px 40px rgba(0,0,0,0.7), 0 0 0 2px #05050a, inset 0 2px 0 rgba(255,255,255,0.8)",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 8,
          background:
            "linear-gradient(180deg,#0b0b10 0%,#14141b 60%,#07070a 100%)",
          boxShadow: "inset 0 0 24px rgba(0,0,0,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          position: "relative",
        }}
      >
        <span
          style={{
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontWeight: 900,
            fontSize: 70,
            letterSpacing: "0.12em",
            lineHeight: 1,
            backgroundImage: chrome,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.9))",
            whiteSpace: "nowrap",
          }}
        >
          AAROHAN AHEAD
        </span>

        {/* arrow */}
        <svg width="84" height="104" viewBox="0 0 84 104" style={{ filter: "drop-shadow(0 0 10px rgba(224,24,45,0.9))" }}>
          <path d="M42 4L80 48H56V100H28V48H4Z" fill="#e0182d" stroke="#ffd0d4" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M42 12L68 42" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* red light strip */}
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 8,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg,transparent,#e0182d 20%,#ff4a58 50%,#e0182d 80%,transparent)",
            boxShadow: "0 0 12px #e0182d",
          }}
        />
      </div>
    </div>
  </div>
);