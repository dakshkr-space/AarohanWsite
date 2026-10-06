import React from "react";

/**
 * Roadside billboard that stands at a fixed world depth beside the road.
 * Positioned and scaled every scroll tick by updateBillboards() in CarAnimation.
 *
 * Refined palette matching the dark crimson/wine circuit aesthetic from the Figma frame.
 */
export const BILLBOARD_WIDTH = 600;

export interface BillboardEvent {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
}

interface RoadBillboardProps {
  event: BillboardEvent;
  side: 1 | -1;
  billboardRef: (el: HTMLDivElement | null) => void;
}

const darkTitanium =
  "linear-gradient(180deg,#2e313c 0%,#191b22 35%,#0d0e13 70%,#262832 100%)";
const postMetal =
  "linear-gradient(90deg,#0a0b0e 0%,#22242c 35%,#4a4e5c 50%,#1c1d24 70%,#08090c 100%)";

const POST_HEIGHT = 190;
const ACCENT = "#ff233b";

export const RoadBillboard: React.FC<RoadBillboardProps> = ({
  event,
  side,
  billboardRef,
}) => {
  // the accent edge faces the road: left edge for right-hand boards and vice versa
  const accentEdge = side === 1 ? "borderLeft" : "borderRight";

  return (
    <div
      ref={billboardRef}
      role="group"
      aria-label={event.title}
      className="absolute left-0 top-0 pointer-events-none will-change-transform"
      style={{
        width: BILLBOARD_WIDTH,
        transformOrigin: "0 0",
        opacity: 0,
        transform: "translate(-9999px, 0)",
        zIndex: 1,
      }}
    >
      {/* Board (angled toward the oncoming driver) */}
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          padding: 8,
          background: darkTitanium,
          transform: `perspective(1400px) rotateY(${side * -10}deg)`,
          transformOrigin: "50% 50%",
          boxShadow:
            "0 20px 45px rgba(0,0,0,0.85), 0 0 0 2px #040508, inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 8,
            padding: "30px 38px",
            background:
              "linear-gradient(180deg,#09070d 0%,#130e18 55%,#060408 100%)",
            boxShadow: "inset 0 0 28px rgba(0,0,0,0.95)",
            [accentEdge]: `16px solid ${ACCENT}`,
          }}
        >
          {/* Red LED strip along the top, brightens as the board gets close */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 5,
              background: `linear-gradient(90deg,transparent,${ACCENT} 20%,#ff5568 50%,${ACCENT} 80%,transparent)`,
              boxShadow: `0 0 calc(6px + var(--lit, 0) * 16px) ${ACCENT}`,
              opacity: "calc(0.6 + var(--lit, 0) * 0.4)",
            }}
          />

          <div
            style={{
              color: "#ff4055",
              fontSize: 24,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 10,
              textShadow: "0 0 10px rgba(255,64,85,0.4)",
            }}
          >
            {event.number} &middot; {event.category}
          </div>

          <h2
            style={{
              margin: "0 0 14px",
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: 64,
              lineHeight: 1.05,
              letterSpacing: "0.06em",
              backgroundImage:
                "linear-gradient(180deg,#ffffff 0%,#d2d5de 35%,#9296a2 65%,#f2f4fa 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.95))",
            }}
          >
            {event.title}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#b4b2bc",
              fontSize: 30,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.description}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {event.tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  padding: "4px 14px",
                  border: "1.5px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  fontSize: 21,
                  color: "#d8d7df",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div style={{ position: "relative", height: POST_HEIGHT }}>
        {[88, BILLBOARD_WIDTH - 88 - 30].map((left) => (
          <div
            key={left}
            style={{
              position: "absolute",
              left,
              top: -6,
              bottom: 0,
              width: 30,
              background: postMetal,
              boxShadow: "0 0 0 2px #040508",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -12,
                right: -12,
                bottom: 0,
                height: 20,
                background: "linear-gradient(180deg,#424652,#0e1014)",
                borderRadius: 3,
              }}
            />
          </div>
        ))}
        {/* Contact shadow on the ground */}
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            bottom: -10,
            height: 22,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.7), rgba(0,0,0,0) 70%)",
          }}
        />
      </div>
    </div>
  );
};