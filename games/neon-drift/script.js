const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const statusText = document.getElementById("statusText");
const controlButtons = document.querySelectorAll("[data-dir]");

const lanes = [110, 260, 410];
let playerLane = 1;
let playerY = 280;
let obstacles = [];
let score = 0;
let bestScore = 0;
let running = false;
let animationFrameId = null;
let lastTime = 0;

function resetGame(keepScore = false) {
  playerLane = 1;
  if (!keepScore) {
    score = 0;
    bestScore = 0;
  }
  obstacles = [];
  running = true;
  lastTime = 0;
  statusText.textContent = keepScore ? "Back in the lane — keep the streak alive!" : "Stay centered and dodge the neon blocks!";
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  gameLoop(0);
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * lanes.length);
  obstacles.push({ x: canvas.height + 30, lane, size: 34 + Math.random() * 24, speed: 3 + Math.random() * 2 });
}

function movePlayer(direction) {
  if (!running) return;
  if (direction === "left" && playerLane > 0) playerLane -= 1;
  if (direction === "right" && playerLane < lanes.length - 1) playerLane += 1;
}

function drawRoad() {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, canvas.height);
  ctx.moveTo(canvas.width, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();

  ctx.setLineDash([18, 18]);
  ctx.strokeStyle = "#38bdf8";
  for (let i = 0; i < 5; i += 1) {
    const y = (i * 80) - (performance.now() / 20) % 80;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, y);
    ctx.lineTo(canvas.width / 2, y + 40);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  lanes.forEach((x) => {
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(x - 34, 0, 68, canvas.height);
  });
}

function drawPlayer() {
  const x = lanes[playerLane];
  ctx.save();
  ctx.translate(x, playerY);
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(-20, -24, 40, 48);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(-14, -18, 28, 22);
  ctx.restore();
}

function drawObstacles() {
  obstacles.forEach((obstacle) => {
    const x = lanes[obstacle.lane];
    ctx.save();
    ctx.translate(x, obstacle.x);
    ctx.fillStyle = "#fb923c";
    ctx.fillRect(-obstacle.size / 2, -obstacle.size / 2, obstacle.size, obstacle.size);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(-obstacle.size / 2 + 6, -obstacle.size / 2 + 6, obstacle.size - 12, obstacle.size - 12);
    ctx.restore();
  });
}

function drawScore() {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "16px Segoe UI";
  ctx.fillText(`Score: ${Math.floor(score)} • Best: ${bestScore}`, 18, 28);
}

function gameLoop(timestamp) {
  if (!running) return;
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 16.6667;
  lastTime = timestamp;

  if (Math.random() < (0.018 + score / 6000) * delta) spawnObstacle();

  obstacles.forEach((obstacle) => {
    obstacle.x -= obstacle.speed * delta;
  });
  obstacles = obstacles.filter((obstacle) => obstacle.x > -60);

  for (const obstacle of obstacles) {
    if (Math.abs(obstacle.x - playerY) < 50 && obstacle.lane === playerLane) {
      running = false;
      bestScore = Math.max(bestScore, Math.floor(score));
      statusText.textContent = `Crash! Survived ${Math.floor(score)}. Restarting...`;
      startBtn.textContent = "Restart";
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      setTimeout(() => resetGame(true), 700);
      return;
    }
  }

  score += delta * 0.2;
  drawRoad();
  drawObstacles();
  drawPlayer();
  drawScore();

  animationFrameId = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener("click", () => {
  resetGame(false);
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => movePlayer(button.dataset.dir));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") movePlayer("left");
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") movePlayer("right");
});

resetGame(false);
