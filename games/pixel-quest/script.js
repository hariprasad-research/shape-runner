const canvas = document.getElementById("questCanvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("questStatus");
const startBtn = document.getElementById("startQuestBtn");

let player = { x: 60, y: 140, size: 18, speed: 3 };
let stars = [];
let portal = { x: 480, y: 140 };
let collected = 0;
let running = false;
let animationId = null;
let round = 1;
let goalStars = 4;

function resetQuest() {
  player = { x: 60, y: 140, size: 18, speed: 3 + Math.min(1.6, round * 0.12) };
  collected = 0;
  stars = Array.from({ length: goalStars }, () => ({
    x: 80 + Math.random() * 400,
    y: 40 + Math.random() * 220,
    size: 10 + Math.random() * 3,
  }));
  portal = { x: 90 + Math.random() * 360, y: 40 + Math.random() * 220 };
  running = true;
  status.textContent = `Round ${round}: collect ${goalStars} stars and reach the portal.`;
  if (animationId) cancelAnimationFrame(animationId);
  animate();
}

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#38bdf8";
  for (let y = 0; y < canvas.height; y += 36) {
    ctx.fillRect(0, y, canvas.width, 2);
  }

  stars.forEach((star) => {
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#f472b6";
  ctx.fillRect(portal.x - 16, portal.y - 24, 32, 48);
  ctx.fillStyle = "#34d399";
  ctx.fillRect(portal.x - 12, portal.y - 16, 24, 32);

  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(player.x - 6, player.y - 6, 12, 12);
}

function update() {
  if (!running) return;

  if (keys.ArrowLeft) player.x -= player.speed;
  if (keys.ArrowRight) player.x += player.speed;
  if (keys.ArrowUp) player.y -= player.speed;
  if (keys.ArrowDown) player.y += player.speed;

  player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
  player.y = Math.max(20, Math.min(canvas.height - 20, player.y));

  stars = stars.filter((star) => {
    const near = Math.hypot(player.x - star.x, player.y - star.y) < 26;
    if (near) collected += 1;
    return !near;
  });

  if (collected >= goalStars) {
    status.textContent = `Round ${round}: all stars collected! Reach the portal.`;
  }

  if (Math.hypot(player.x - portal.x, player.y - portal.y) < 34 && collected >= goalStars) {
    running = false;
    round += 1;
    goalStars = 4 + Math.min(6, Math.floor((round - 1) / 2));
    status.textContent = `Round ${round - 1} complete! Preparing the next run...`;
    startBtn.textContent = "Restart";
    setTimeout(() => resetQuest(), 700);
  }
}

function animate() {
  if (!running) return;
  update();
  drawWorld();
  animationId = requestAnimationFrame(animate);
}

const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
    keys[event.key] = true;
  }
});
window.addEventListener("keyup", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
    keys[event.key] = false;
  }
});

startBtn.addEventListener("click", () => {
  round = 1;
  goalStars = 4;
  resetQuest();
});
resetQuest();
