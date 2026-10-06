import React from "react";

/**
 * Roadside billboard that stands at a fixed world depth beside the road.
 * Positioned and scaled every scroll tick by updateBillboards() in CarAnimation.
 *
 * Layout: 600px wide, height is auto (board + posts). The element is anchored
 * at its bottom-centre (the ground contact point) by the transform that
 * CarAnimation writes, so scaling keeps the posts planted on the grass.
 *
 * `side` is +1 for the right of the road, -1 for the left. The red accent
 * edge sits on the road-facing side and the board is angled slightly toward
 * the oncoming driver.
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

const chrome =
  "linear-gradient(180deg,#f4f6fa 0%,#b9bec8 28%,#6c717c 52%,#d5d9e1 74%,#80858f 100%)";
const postMetal =
  "linear-gradient(90deg,#14151a 0%,#8d929d 35%,#e9ecf2 50%,#6b707b 70%,#0e0f13 100%)";

const POST_HEIGHT = 190;
const ACCENT = "#e0182d";

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
      {/* board (turned a little toward the oncoming driver) */}
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          padding: 8,
          background: chrome,
          transform: `perspective(1400px) rotateY(${side * -12}deg)`,
          transformOrigin: "50% 50%",
          boxShadow:
            "0 18px 40px rgba(0,0,0,0.7), 0 0 0 2px #05050a, inset 0 2px 0 rgba(255,255,255,0.8)",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 8,
            padding: "30px 38px 30px 38px",
            background:
              "linear-gradient(180deg,#0b0b10 0%,#14141b 60%,#07070a 100%)",
            boxShadow: "inset 0 0 24px rgba(0,0,0,0.9)",
            [accentEdge]: `16px solid ${ACCENT}`,
          }}
        >
          {/* red LED strip along the top, brightens as the board gets close */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 5,
              background: `linear-gradient(90deg,transparent,${ACCENT} 20%,#ff4a58 50%,${ACCENT} 80%,transparent)`,
              boxShadow: `0 0 calc(6px + var(--lit, 0) * 16px) ${ACCENT}`,
              opacity: "calc(0.55 + var(--lit, 0) * 0.45)",
            }}
          />

          <div
            style={{
              color: "#ff4a58",
              fontSize: 24,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 10,
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
              backgroundImage: chrome,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.9))",
            }}
          >
            {event.title}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#b9bac4",
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
                  border: "1.5px solid rgba(255,255,255,0.22)",
                  borderRadius: 999,
                  fontSize: 21,
                  color: "#d8d9e0",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* posts */}
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
              boxShadow: "0 0 0 2px #05050a",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -12,
                right: -12,
                bottom: 0,
                height: 20,
                background: "linear-gradient(180deg,#5a5f6a,#15161b)",
                borderRadius: 3,
              }}
            />
          </div>
        ))}
        {/* contact shadow on the ground */}
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            bottom: -10,
            height: 22,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.65), rgba(0,0,0,0) 70%)",
          }}
        />
      </div>
    </div>
  );
};