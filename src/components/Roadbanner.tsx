import React from "react";

/**
 * Overhead racing gantry that spans the track ("AAROHAN LOADING...").
 * Positioned and scaled every scroll tick by updateBanner() in CarAnimation.
 *
 * Matches the Figma frame:
 * - Industrial dark steel truss structure
 * - Top red LED dot row
 * - Official Aarohan glowing infinity symbol (replacing text)
 * - Digital LED "LOADING . . ." (replacing arrow)
 * - Blended dark palette matching the circuit
 */
interface RoadBannerProps {
  bannerRef: React.RefObject<HTMLDivElement | null>;
}

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
    {/* Truss support posts on left and right */}
    {[36, 928].map((left) => (
      <div
        key={left}
        style={{
          position: "absolute",
          left,
          top: 145,
          bottom: 0,
          width: 36,
          background:
            "linear-gradient(90deg,#09090d 0%,#24262f 30%,#4d515e 50%,#20222a 70%,#08080c 100%)",
          boxShadow: "0 0 0 2px #040507, 0 10px 25px rgba(0,0,0,0.8)",
        }}
      >
        {/* Lattice diagonal braces on the posts */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(0,0,0,0.65) 18px, rgba(0,0,0,0.65) 24px)",
            opacity: 0.75,
          }}
        />
        {/* Post base plate planted on track asphalt */}
        <div
          style={{
            position: "absolute",
            left: -16,
            right: -16,
            bottom: 0,
            height: 24,
            background: "linear-gradient(180deg,#2e313a,#0e1014)",
            borderRadius: 4,
            boxShadow: "0 4px 10px rgba(0,0,0,0.9)",
          }}
        />
      </div>
    ))}

    {/* Overhead gantry cross-beam / housing */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 180,
        borderRadius: 12,
        padding: "6px 8px",
        background:
          "linear-gradient(180deg,#181920 0%,#2d313c 20%,#15171d 50%,#0b0c10 100%)",
        boxShadow:
          "0 22px 50px rgba(0,0,0,0.85), 0 0 0 2px #040508, inset 0 2px 1px rgba(255,255,255,0.25)",
      }}
    >
      {/* Top red LED running light bar (matching Figma frame) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "#ff233b",
              boxShadow: "0 0 6px #ff233b, 0 0 10px rgba(255,35,59,0.7)",
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Main Electronic Display Screen */}
      <div
        style={{
          height: 136,
          borderRadius: 8,
          background:
            "linear-gradient(180deg,#060508 0%,#0c0a10 50%,#040306 100%)",
          boxShadow:
            "inset 0 0 30px rgba(0,0,0,0.95), inset 0 0 2px rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Subtle LED dot matrix mesh overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "6px 6px",
            pointerEvents: "none",
            opacity: 0.45,
          }}
        />

        {/* Aarohan official symbol logo (replacing plain text and arrow) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/aarohan_symbol.png"
          alt="Aarohan"
          style={{
            height: 94,
            width: "auto",
            objectFit: "contain",
            mixBlendMode: "screen",
            filter:
              "drop-shadow(0 0 16px rgba(230,24,45,0.85)) drop-shadow(0 0 35px rgba(255,50,70,0.45))",
            position: "relative",
            zIndex: 2,
          }}
        />

        {/* LOADING... in authentic LED digital scoreboard font */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', Courier, monospace, 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: 46,
              letterSpacing: "0.2em",
              color: "#e2e6f0",
              textShadow:
                "0 0 12px rgba(230,235,255,0.7), 0 0 28px rgba(255,40,60,0.5), 0 2px 0 #000",
              textTransform: "uppercase",
            }}
          >
            LOADING
          </span>
          <span
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontWeight: 900,
              fontSize: 52,
              letterSpacing: "0.24em",
              color: "#ff334b",
              textShadow: "0 0 14px #ff223b, 0 0 28px rgba(255,34,59,0.8)",
            }}
          >
            ...
          </span>
        </div>

        {/* Bottom crimson neon accent strip */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 6,
            height: 3,
            borderRadius: 2,
            background:
              "linear-gradient(90deg,transparent,#e0182d 20%,#ff5565 50%,#e0182d 80%,transparent)",
            boxShadow: "0 0 14px #e0182d, 0 0 6px #ff4055",
          }}
        />
      </div>
    </div>
  </div>
);