(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);

  const ui = {
    start: $("startOverlay"),
    pause: $("pauseOverlay"),
    over: $("overOverlay"),
    startBtn: $("startBtn"),
    resumeBtn: $("resumeBtn"),
    restartPauseBtn: $("restartPauseBtn"),
    menuPauseBtn: $("menuPauseBtn"),
    againBtn: $("againBtn"),
    menuOverBtn: $("menuOverBtn"),
    pauseBtn: $("pauseBtn"),
    jumpBtn: $("jumpBtn"),
    shapeBtn: $("shapeBtn"),
    shapeIcon: $("shapeIcon"),
    shapeName: $("shapeName"),
    score: $("score"),
    best: $("best"),
    finalScore: $("finalScore"),
    resultMessage: $("resultMessage"),
    soundBtn: $("soundBtn")
  };

  const WIDTH = 960;
  const HEIGHT = 540;
  const GROUND_Y = 430;

  const SHAPES = ["triangle", "square", "circle"];
  const SHAPE_NAMES = ["TRIANGLE", "SQUARE", "CIRCLE"];
  const SHAPE_SYMBOLS = ["▲", "■", "●"];
  const COLORS = ["#ff6fcf", "#9b8cff", "#50e3ff"];

  let state = "menu";
  let currentShape = 2;
  let score = 0;
  let bestScore = 0;
  let gameSpeed = 330;
  let spawnTimer = 1.1;
  let lastFrameTime = 0;
  let elapsedTime = 0;
  let animationId = 0;
  let soundEnabled = false;
  let audioContext = null;

  const player = {
    x: 145,
    y: GROUND_Y - 42,
    size: 42,
    velocityY: 0,
    onGround: true
  };

  let hazards = [];
  let gates = [];
  let particles = [];
  let stars = [];
  let clouds = [];

  try {
    bestScore =
      Number(localStorage.getItem("shapeRunnerBest")) || 0;
  } catch (_) {
    bestScore = 0;
  }

  ui.best.textContent = bestScore;

  function saveBestScore() {
    try {
      localStorage.setItem("shapeRunnerBest", String(bestScore));
    } catch (_) {}
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
    const pixelHeight = Math.max(1, Math.round(rect.height * dpr));

    if (
      canvas.width !== pixelWidth ||
      canvas.height !== pixelHeight
    ) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(
      canvas.width / WIDTH, 0,
      0, canvas.height / HEIGHT,
      0, 0
    );

    if (state !== "playing") draw();
  }

  function resetGame() {
    score = 0;
    gameSpeed = 330;
    spawnTimer = 1.1;
    elapsedTime = 0;

    hazards = [];
    gates = [];
    particles = [];

    currentShape = 2;
    player.y = GROUND_Y - player.size;
    player.velocityY = 0;
    player.onGround = true;

    ui.score.textContent = "0";
    updateShapeDisplay();

    stars = Array.from({ length: 75 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * (GROUND_Y - 25),
      radius: Math.random() * 1.5 + 0.3,
      phase: Math.random() * Math.PI * 2
    }));

    clouds = Array.from({ length: 6 }, (_, index) => ({
      x: index * 190 + Math.random() * 80,
      y: 45 + Math.random() * 160,
      scale: 0.5 + Math.random() * 0.7
    }));
  }

  function updateShapeDisplay() {
    ui.shapeName.textContent = SHAPE_NAMES[currentShape];
    ui.shapeIcon.textContent = SHAPE_SYMBOLS[currentShape];
    ui.shapeIcon.style.color = COLORS[currentShape];
  }

  function hideAllOverlays() {
    ui.start.classList.add("hidden");
    ui.pause.classList.add("hidden");
    ui.over.classList.add("hidden");
  }

  function startGame() {
    cancelAnimationFrame(animationId);
    resetGame();

    state = "playing";
    hideAllOverlays();
    ui.pauseBtn.textContent = "Ⅱ";

    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (state !== "playing") return;

    state = "paused";
    ui.pause.classList.remove("hidden");
    ui.pauseBtn.textContent = "▶";

    cancelAnimationFrame(animationId);
  }

  function resumeGame() {
    if (state !== "paused") return;

    state = "playing";
    ui.pause.classList.add("hidden");
    ui.pauseBtn.textContent = "Ⅱ";

    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
  }

  function returnToMenu() {
    cancelAnimationFrame(animationId);

    state = "menu";
    hideAllOverlays();
    ui.start.classList.remove("hidden");
    ui.pauseBtn.textContent = "Ⅱ";

    resetGame();
    draw();
  }

  function jump() {
    if (state !== "playing" || !player.onGround) return;

    player.velocityY = -690;
    player.onGround = false;

    createParticles(
      player.x + player.size / 2,
      GROUND_Y,
      "#50e3ff",
      6
    );

    playTone(260, 0.07);
  }

  function changeShape() {
    if (state !== "playing") return;

    currentShape = (currentShape + 1) % SHAPES.length;
    updateShapeDisplay();

    createParticles(
      player.x + player.size / 2,
      player.y + player.size / 2,
      COLORS[currentShape],
      7
    );

    playTone(440 + currentShape * 100, 0.05);
  }

  function spawnChallenge() {
    if (Math.random() < 0.62) {
      gates.push({
        x: WIDTH + 20,
        y: GROUND_Y - 95,
        width: 42,
        height: 95,
        shape: Math.floor(Math.random() * SHAPES.length),
        passed: false
      });
    } else {
      const height = 30 + Math.random() * 30;

      hazards.push({
        x: WIDTH + 20,
        y: GROUND_Y - height,
        width: 25 + Math.random() * 17,
        height
      });
    }
  }

  function finishGame() {
    if (state !== "playing") return;

    state = "over";
    cancelAnimationFrame(animationId);

    const finalValue = Math.floor(score);

    if (finalValue > bestScore) {
      bestScore = finalValue;
      saveBestScore();

      ui.best.textContent = bestScore;
      ui.resultMessage.textContent =
        "New best! You beat your record.";
    } else {
      ui.resultMessage.textContent =
        "Every run makes you better. Try again!";
    }

    ui.finalScore.textContent = finalValue;
    ui.over.classList.remove("hidden");

    playTone(110, 0.2);
    draw();
  }

  function update(dt) {
    elapsedTime += dt;
    gameSpeed = Math.min(650, 330 + elapsedTime * 8);

    score += dt * 10;
    ui.score.textContent = Math.floor(score);

    // Player physics
    player.velocityY += 1750 * dt;
    player.y += player.velocityY * dt;

    if (player.y >= GROUND_Y - player.size) {
      player.y = GROUND_Y - player.size;
      player.velocityY = 0;
      player.onGround = true;
    }

    // Spawn challenges
    spawnTimer -= dt;

    if (spawnTimer <= 0) {
      spawnChallenge();

      spawnTimer = Math.max(
        0.72,
        1.35 + Math.random() * 0.6 - elapsedTime * 0.003
      );
    }

    // Move clouds
    for (const cloud of clouds) {
      cloud.x -= gameSpeed * 0.08 * dt;

      if (cloud.x < -110) {
        cloud.x = WIDTH + 70;
        cloud.y = 45 + Math.random() * 160;
      }
    }

    for (const star of stars) {
      star.phase += dt * 2;
    }

    // Move hazards
    for (const hazard of hazards) {
      hazard.x -= gameSpeed * dt;
    }

    hazards = hazards.filter(
      hazard => hazard.x + hazard.width > 0
    );

    // Check shape gates
    for (const gate of gates) {
      gate.x -= gameSpeed * dt;

      if (!gate.passed && gate.x + gate.width < player.x) {
        gate.passed = true;

        if (gate.shape !== currentShape) {
          finishGame();
          return;
        }

        score += 25;
        ui.score.textContent = Math.floor(score);

        createParticles(
          gate.x + gate.width,
          gate.y + gate.height / 2,
          COLORS[gate.shape],
          12
        );

        playTone(650, 0.06);
      }
    }

    gates = gates.filter(
      gate => gate.x + gate.width > 0
    );

    // Collision detection: Game Over immediately on contact.
const playerBox = {
  left: player.x,
  right: player.x + player.size,
  top: player.y,
  bottom: player.y + player.size
};

for (const hazard of hazards) {
  const touching =
    playerBox.right >= hazard.x &&
    playerBox.left <= hazard.x + hazard.width &&
    playerBox.bottom >= hazard.y &&
    playerBox.top < GROUND_Y;

  if (touching) {
    finishGame();
    return;
  }
}

    // Update particles
    for (const particle of particles) {
      particle.x += particle.velocityX * dt;
      particle.y += particle.velocityY * dt;
      particle.velocityY += 240 * dt;
      particle.life -= dt;
    }

    particles = particles.filter(
      particle => particle.life > 0
    );
  }

  function createParticles(x, y, color, count) {
    for (let index = 0; index < count; index++) {
      const angle = Math.random() * Math.PI * 2;
      const force = 40 + Math.random() * 180;

      particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * force,
        velocityY: Math.sin(angle) * force,
        life: 0.6,
        maxLife: 0.6,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  // Draw shapes with minimal glow.
 function drawShape(x, y, size, color, shapeIndex) {
  const isPhone = window.matchMedia("(max-width: 600px)").matches;
  const scale = isPhone ? 1.12 : 1;
  const actualSize = size * scale;

  x -= (actualSize - size) / 2;
  y -= (actualSize - size) / 2;
  size = actualSize;

  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowBlur = 2;
  ctx.shadowColor = color;
  ctx.beginPath();

  if (shapeIndex === 0) {
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
  } else if (shapeIndex === 1) {
    ctx.roundRect(x, y, size, size, 4);
  } else {
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  }

  ctx.fill();
  ctx.restore();
}

  function drawBackground() {
    const gradient = ctx.createLinearGradient(
      0, 0, 0, HEIGHT
    );

    gradient.addColorStop(0, "#111c3c");
    gradient.addColorStop(1, "#17254a");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of stars) {
      ctx.globalAlpha =
        0.4 + (Math.sin(star.phase) + 1) * 0.25;

      ctx.fillStyle = "#d9f6ff";
      ctx.fillRect(
        star.x,
        star.y,
        star.radius,
        star.radius
      );
    }

    ctx.globalAlpha = 1;

    for (const cloud of clouds) {
      ctx.fillStyle = "#a4c7ff12";
      ctx.beginPath();

      ctx.ellipse(
        cloud.x,
        cloud.y,
        42 * cloud.scale,
        12 * cloud.scale,
        0,
        0,
        Math.PI * 2
      );

      ctx.ellipse(
        cloud.x + 22 * cloud.scale,
        cloud.y - 5 * cloud.scale,
        24 * cloud.scale,
        16 * cloud.scale,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  function drawGround() {
    ctx.fillStyle = "#0b1225";
    ctx.fillRect(
      0,
      GROUND_Y,
      WIDTH,
      HEIGHT - GROUND_Y
    );

    ctx.fillStyle = "#50e3ff";
    ctx.fillRect(0, GROUND_Y, WIDTH, 3);

    const offset =
      (elapsedTime * gameSpeed * 0.7) % 55;

    ctx.strokeStyle = "#ffffff16";
    ctx.lineWidth = 1;

    for (let x = -offset; x < WIDTH; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 3);
      ctx.lineTo(x - 30, HEIGHT);
      ctx.stroke();
    }
  }

  // Solid red spikes.
  function drawHazards() {
    for (const hazard of hazards) {
      ctx.save();

      ctx.fillStyle = "#ff617d";
      ctx.shadowColor = "#ff617d";
      ctx.shadowBlur = 2;

      ctx.beginPath();
      ctx.moveTo(hazard.x, GROUND_Y);

      ctx.lineTo(
        hazard.x + hazard.width / 2,
        hazard.y
      );

      ctx.lineTo(
        hazard.x + hazard.width,
        GROUND_Y
      );

      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // Outlined gates with dark interiors.
  function drawGates() {
    for (const gate of gates) {
      const color = COLORS[gate.shape];

      ctx.save();

      ctx.shadowBlur = 0;
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.fillStyle = "#111c3c";

      ctx.fillRect(
        gate.x + 3,
        gate.y + 3,
        gate.width - 6,
        gate.height - 3
      );

      ctx.strokeRect(
        gate.x,
        gate.y,
        gate.width,
        gate.height
      );

      drawShape(
        gate.x + 9,
        gate.y + 10,
        24,
        color,
        gate.shape
      );

      ctx.restore();
    }
  }

  function drawPlayer() {
    drawShape(
      player.x,
      player.y,
      player.size,
      COLORS[currentShape],
      currentShape
    );
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(
        0,
        particle.life / particle.maxLife
      );

      ctx.fillStyle = particle.color;

      ctx.fillRect(
        particle.x,
        particle.y,
        particle.size,
        particle.size
      );
    }

    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground();
    drawGround();
    drawHazards();
    drawGates();
    drawPlayer();
    drawParticles();

    if (state === "menu") {
      drawShape(360, 340, 36, COLORS[0], 0);
      drawShape(460, 340, 36, COLORS[1], 1);
      drawShape(560, 340, 36, COLORS[2], 2);
    }
  }

  function gameLoop(now) {
    if (state !== "playing") return;

    const dt = Math.min(
      (now - lastFrameTime) / 1000 || 0,
      0.035
    );

    lastFrameTime = now;

    update(dt);
    draw();

    if (state === "playing") {
      animationId = requestAnimationFrame(gameLoop);
    }
  }

  function playTone(frequency, duration) {
    if (!soundEnabled) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      audioContext ||= new AudioContextClass();

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(
        0.05,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(
        audioContext.currentTime + duration
      );
    } catch (_) {}
  }

  // Buttons
  ui.startBtn.addEventListener("click", startGame);
  ui.againBtn.addEventListener("click", startGame);
  ui.restartPauseBtn.addEventListener("click", startGame);

  ui.resumeBtn.addEventListener("click", resumeGame);
  ui.menuPauseBtn.addEventListener("click", returnToMenu);
  ui.menuOverBtn.addEventListener("click", returnToMenu);

  ui.pauseBtn.addEventListener("click", () => {
    if (state === "playing") pauseGame();
    else if (state === "paused") resumeGame();
  });

  ui.jumpBtn.addEventListener("pointerdown", event => {
    event.preventDefault();
    jump();
  });

  ui.shapeBtn.addEventListener("pointerdown", event => {
    event.preventDefault();
    changeShape();
  });

  ui.soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    ui.soundBtn.textContent = soundEnabled ? "🔊" : "🔇";

    if (soundEnabled) playTone(520, 0.06);
  });

  // Keyboard controls
  window.addEventListener("keydown", event => {
    if (
      event.code === "Space" ||
      event.code === "ArrowUp"
    ) {
      event.preventDefault();
    }

    if (event.repeat) return;

    if (
      event.code === "Space" ||
      event.code === "ArrowUp"
    ) {
      jump();
    }

    if (state === "playing" && event.code === "Digit1") {
      currentShape = 0;
      updateShapeDisplay();
    }

    if (state === "playing" && event.code === "Digit2") {
      currentShape = 1;
      updateShapeDisplay();
    }

    if (state === "playing" && event.code === "Digit3") {
      currentShape = 2;
      updateShapeDisplay();
    }

    if (event.code === "KeyC") changeShape();

    if (
      event.code === "Escape" ||
      event.code === "KeyP"
    ) {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    }

    if (
      event.code === "Enter" &&
      (state === "menu" || state === "over")
    ) {
      startGame();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") {
      pauseGame();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  resetGame();
  resizeCanvas();
  draw();

})();

