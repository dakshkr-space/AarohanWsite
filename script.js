// Aarohan landing page: scroll-driven race car animation

const car   = document.getElementById("car");
const road  = document.getElementById("road");
const logo  = document.getElementById("logo");
const hint  = document.getElementById("hint");
const dash  = document.getElementById("dash");
const panels = Array.from(document.querySelectorAll(".panel"));
const dots   = Array.from(document.querySelectorAll("#dots b"));

const PANELS = panels.length;   // number of scroll sections
const DASHES = 14;              // lane dashes drawn on the road
const HORIZON_Y = 532;          // y of the vanishing point in the 1088 x 780 image
const BOTTOM_Y  = 780;
const CENTER_X  = 544;

const clamp  = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = t => t * t * (3 - 2 * t);

// Create the lane dashes once, then only update their points on scroll
const dashShapes = [];
for (let i = 0; i < DASHES; i++) {
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  dash.appendChild(shape);
  dashShapes.push(shape);
}

// Keep the logo where it sits in the original design (13px from the corner of the 1088 x 780 image)
function placeLogo() {
  const scale = Math.max(window.innerWidth / 1088, window.innerHeight / 780);
  const width = Math.min(84, Math.max(44, 66 * scale));
  const offsetX = (window.innerWidth - 1088 * scale) / 2;
  const offsetY = window.innerHeight - 780 * scale;

  logo.style.width  = width + "px";
  logo.style.height = width * 0.758 + "px";
  logo.style.left   = Math.max(12, offsetX + 13 * scale) + "px";
  logo.style.top    = Math.max(12, offsetY + 13 * scale) + "px";
}

function update() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress  = clamp(window.scrollY / maxScroll);   // 0 at the top, 1 at the bottom
  const section   = progress * PANELS;                    // 0 to PANELS

  // Lane dashes move toward the viewer. They fade in only after scrolling starts,
  // so the first screen matches the design exactly.
  const phase = progress * 40;
  dashShapes.forEach((shape, i) => {
    const t  = ((i + phase) % DASHES) / DASHES;
    const t2 = Math.pow(t + 0.035, 2);
    const y1 = HORIZON_Y + (BOTTOM_Y - HORIZON_Y) * t * t;
    const y2 = HORIZON_Y + (BOTTOM_Y - HORIZON_Y) * t2;
    const w1 = 1 + 9 * t * t;
    const w2 = 1 + 9 * t2;

    shape.setAttribute("points",
      `${CENTER_X - w1},${y1} ${CENTER_X + w1},${y1} ${CENTER_X + w2},${y2} ${CENTER_X - w2},${y2}`);
    shape.setAttribute("opacity", clamp(t * 3) * clamp(progress * 12));
  });

  // Camera: the first part of the scroll dollies in toward the car (chase-cam view),
  // then the view keeps pushing forward slowly for the rest of the race.
  const intro = smooth(clamp(progress / 0.08));
  road.style.transform = `scale(${1 + intro * 0.2 + progress * 0.2})`;

  hint.style.opacity = clamp(1 - progress * 10);

  // Car holds its place in front of the camera, banking into the turns with a little road shake
  const wave  = progress * PANELS * Math.PI * 2;
  const shake = Math.sin(progress * 900) * 0.7 * intro;
  car.style.transform =
    `translateX(calc(-50% + ${Math.sin(wave) * 4}vw)) ` +
    `translateY(${intro * 1.5 + shake}px) ` +
    `scale(${1 + intro * 0.18}) ` +
    `rotate(${Math.cos(wave) * 2.5}deg)`;

  // Each panel rises from the horizon toward the camera, then passes overhead
  panels.forEach((panel, i) => {
    const distance = section - (i + 0.5);        // -0.5 far away, 0 in front, +0.5 passed
    const away     = Math.abs(distance);
    const opacity  = clamp(1.1 - away * 2.2) * clamp(progress * 40);

    panel.style.opacity = opacity;
    panel.style.transform =
      `translate(-50%, ${-distance * 40}vh) scale(${1 + distance * 0.9})`;
    panel.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("on", Math.abs(section - (i + 0.5)) < 0.5);
  });
}

let waiting = false;
function onScroll() {
  if (waiting) return;
  waiting = true;
  requestAnimationFrame(() => { update(); waiting = false; });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => { placeLogo(); update(); });

placeLogo();
update();