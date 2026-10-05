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
  // The zoom is spread over the whole scroll. Part of it eases in over the first
  // stretch and the rest grows steadily, so the first scroll is not a big jump.
  // Total zoom stays at about 1.46x so the background keeps its sharpness.
  const intro = smooth(clamp(progress / 0.12));
  const zoom  = 0.5 * intro + 0.5 * progress;
  const midBoost = 0.07 * Math.sin(progress * Math.PI);   // extra push around the middle, none at either end
  road.style.transform = `scale(${1 + zoom * 0.4 + midBoost})`;

  hint.style.opacity = clamp(1 - progress * 10);

  // Car moves a little forward up the road while the track logo slides back toward the camera, banking into the turns with a little road shake
  const wave  = progress * PANELS * Math.PI * 2;
  const shake = Math.sin(progress * 900) * 0.7 * intro;
  car.style.transform =
    `translateX(calc(-50% + ${Math.sin(wave) * 4}vw)) ` +
    `translateY(calc(${-intro * 13}vh + ${shake}px)) ` +
    `scale(${1 + zoom * 0.2 - intro * 0.08}) ` +
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

// Wind: thin streaks rush outward from the horizon toward the viewer.
// Their strength follows how fast the page is being scrolled, so nothing shows at rest.
const canvas = document.getElementById("wind");
const ctx = canvas.getContext("2d");
const STREAKS = 90;
const streaks = [];
let wind = 0;          // current strength, 0 to 1
let lastY = window.scrollY;
let windRunning = false;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function sizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function newStreak(spread) {
  return {
    angle: Math.random() * Math.PI * 2,
    t: spread ? Math.random() : 0,          // 0 at the horizon, 1 at the screen edge
    speed: 0.5 + Math.random() * 0.9,
    length: 0.06 + Math.random() * 0.14,
    width: 0.6 + Math.random() * 1.1,
    alpha: 0.25 + Math.random() * 0.45
  };
}
for (let i = 0; i < STREAKS; i++) streaks.push(newStreak(true));

function drawWind() {
  const w = window.innerWidth, h = window.innerHeight;
  const cx = w / 2, cy = h * 0.64;                  // streaks start near the horizon
  const reach = Math.hypot(w, h) * 0.62;

  // Ease the strength toward the current scroll speed, then let it die down after scrolling stops
  const speed = Math.abs(window.scrollY - lastY);
  lastY = window.scrollY;
  wind += (clamp(speed / 45) - wind) * (speed > 0 ? 0.18 : 0.06);

  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "round";

  streaks.forEach(s => {
    s.t += s.speed * (0.004 + wind * 0.05);
    if (s.t > 1) Object.assign(s, newStreak(false));

    const head = s.t * s.t;                          // accelerates toward the viewer
    const tail = Math.max(0, s.t - s.length * (0.4 + wind)) ** 2;
    const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
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
}

function startWind() {
  if (reduceMotion || windRunning) return;
  windRunning = true;
  requestAnimationFrame(drawWind);
}

let waiting = false;
function onScroll() {
  if (waiting) return;
  waiting = true;
  requestAnimationFrame(() => { update(); waiting = false; });
  startWind();
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => { placeLogo(); sizeCanvas(); update(); });

placeLogo();
sizeCanvas();
update();