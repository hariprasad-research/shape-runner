const SHAPES = ["triangle", "square", "circle"];
const SHAPE_COLORS = {
  triangle: "#fb923c",
  square: "#34d399",
  circle: "#60a5fa",
};
const BEST_SCORE_KEY = "shape-runner-best-score";
const GAME_WIDTH = 900;
const GAME_HEIGHT = 500;
const GROUND_Y = 400;
const PLAYER_X = 160;
const PLAYER_WIDTH = 46;
const PLAYER_HEIGHT = 46;
const JUMP_FORCE = 700;
const GRAVITY = 1800;
const BASE_SPEED = 320;
const SPEED_INCREMENT = 18;
const SPEED_INTERVAL = 20;
const GATE_WIDTH = 76;
const GATE_HEIGHT = 128;
const OBSTACLE_WIDTH = 56;
const OBSTACLE_HEIGHT = 58;

class InputManager {
  constructor(game) {
    this.game = game;
    this.keys = new Set();
    this.justPressed = new Set();
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (["1", "2", "3", "p", "r", " ", "enter"].includes(key)) {
      event.preventDefault();
    }
    if (!this.keys.has(key)) {
      this.justPressed.add(key);
    }
    this.keys.add(key);
  }

  handleKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  isDown(key) {
    return this.keys.has(key);
  }

  consumePressed(key) {
    if (this.justPressed.has(key)) {
      this.justPressed.delete(key);
      return true;
    }
    return false;
  }

  destroy() {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.reset();
  }

  reset() {
    this.x = PLAYER_X;
    this.y = this.game.groundY - this.height;
    this.velocityY = 0;
    this.grounded = true;
    this.currentShape = "square";
    this.morphTimer = 1;
    this.hitFlash = 0;
  }

  switchShape(shape) {
    if (this.currentShape !== shape) {
      this.currentShape = shape;
      this.morphTimer = 0;
      this.game.soundManager.playSwitch();
    }
  }

  jump() {
    if (!this.grounded) return;
    this.grounded = false;
    this.velocityY = -JUMP_FORCE;
    this.game.soundManager.playJump();
  }

  update(deltaTime) {
    if (!this.grounded) {
      this.velocityY += GRAVITY * deltaTime;
      this.y += this.velocityY * deltaTime;
      if (this.y >= this.game.groundY - this.height) {
        this.y = this.game.groundY - this.height;
        this.velocityY = 0;
        this.grounded = true;
      }
    }
    this.morphTimer = Math.min(1, this.morphTimer + deltaTime * 6);
    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - deltaTime * 2.5);
    }
  }

  draw(context) {
    const pulse = 1 + Math.sin(this.morphTimer * Math.PI) * 0.08;
    const baseX = this.x + this.width / 2;
    const baseY = this.y + this.height / 2;

    context.save();
    context.translate(baseX, baseY);
    context.scale(pulse, pulse);

    if (this.hitFlash > 0) {
      context.globalAlpha = 0.5 + this.hitFlash * 0.5;
    }

    context.fillStyle = SHAPE_COLORS[this.currentShape];
    context.strokeStyle = "#0f172a";
    context.lineWidth = 3;

    switch (this.currentShape) {
      case "triangle":
        context.beginPath();
        context.moveTo(0, -this.height / 2);
        context.lineTo(this.width / 2, this.height / 2);
        context.lineTo(-this.width / 2, this.height / 2);
        context.closePath();
        context.fill();
        context.stroke();
        break;
      case "square":
        context.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        context.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        break;
      case "circle":
        context.beginPath();
        context.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        break;
    }

    context.restore();
  }
}

class Gate {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.type = "gate";
    this.requiredShape = "triangle";
    this.x = 0;
    this.y = 0;
    this.width = GATE_WIDTH;
    this.height = GATE_HEIGHT;
  }

  spawn(type, requiredShape, x) {
    this.active = true;
    this.type = type;
    this.requiredShape = requiredShape;
    this.x = x;
    this.width = type === "gate" ? GATE_WIDTH : OBSTACLE_WIDTH;
    this.height = type === "gate" ? GATE_HEIGHT : OBSTACLE_HEIGHT;
    this.y = this.game.groundY - this.height;
  }

  update(deltaTime) {
    if (!this.active) return;
    this.x -= this.game.speed * deltaTime;
    if (this.x + this.width < -80) {
      this.active = false;
      this.game.gateSpawner.releaseGate(this);
    }
  }

  draw(context) {
    if (!this.active) return;

    context.save();
    context.translate(this.x, this.y);

    if (this.type === "gate") {
      context.fillStyle = "rgba(255,255,255,0.14)";
      context.strokeStyle = "#f8fafc";
      context.lineWidth = 3;
      context.fillRect(-this.width / 2, 0, this.width, this.height);
      context.strokeRect(-this.width / 2, 0, this.width, this.height);

      context.fillStyle = SHAPE_COLORS[this.requiredShape];
      context.beginPath();
      switch (this.requiredShape) {
        case "triangle":
          context.moveTo(0, 24);
          context.lineTo(24, 56);
          context.lineTo(-24, 56);
          context.closePath();
          break;
        case "square":
          context.fillRect(-18, 20, 36, 36);
          break;
        case "circle":
          context.arc(0, 38, 20, 0, Math.PI * 2);
          break;
      }
      if (this.requiredShape !== "square") {
        context.fill();
      }
      context.restore();
      return;
    }

    context.fillStyle = "#475569";
    context.fillRect(-this.width / 2, 0, this.width, this.height);
    context.fillStyle = "#64748b";
    context.fillRect(-this.width / 2 + 6, 6, this.width - 12, this.height - 12);
    context.restore();
  }

  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

class GateSpawner {
  constructor(game) {
    this.game = game;
    this.pool = [];
    this.activeGates = [];
    this.spawnTimer = 0.9;
  }

  reset() {
    this.activeGates.forEach((gate) => {
      gate.active = false;
      this.pool.push(gate);
    });
    this.activeGates = [];
    this.spawnTimer = 0.9;
  }

  getGate() {
    let gate = this.pool.pop();
    if (!gate) {
      gate = new Gate(this.game);
    }
    this.activeGates.push(gate);
    return gate;
  }

  releaseGate(gate) {
    this.activeGates = this.activeGates.filter((item) => item !== gate);
    gate.active = false;
    this.pool.push(gate);
  }

  spawnRandomGate() {
    const type = Math.random() < 0.78 ? "gate" : "obstacle";
    const requiredShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const gate = this.getGate();
    const startX = this.game.width + 140;
    gate.spawn(type, requiredShape, startX);
    if (type === "obstacle") {
      gate.requiredShape = "";
    }
  }

  update(deltaTime) {
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer <= 0) {
      this.spawnRandomGate();
      const interval = Math.max(0.5, 1.1 - this.game.speedLevel * 0.04);
      this.spawnTimer = interval;
    }
    this.activeGates.forEach((gate) => gate.update(deltaTime));
  }
}

class ScoreManager {
  constructor(game) {
    this.game = game;
    this.score = 0;
    this.best = Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
  }

  reset() {
    this.score = 0;
  }

  add(points) {
    this.score += points;
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem(BEST_SCORE_KEY, String(this.best));
    }
  }

  updateHud() {
    this.game.uiManager.updateHud(this.score, this.best);
  }
}

class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
  }

  emit(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        color,
      });
    }
  }

  update(deltaTime) {
    this.particles = this.particles.filter((particle) => {
      particle.life -= deltaTime;
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vy += 120 * deltaTime;
      return particle.life > 0;
    });
  }

  draw(context) {
    this.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, 3 + alpha * 2, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }
}

class SoundManager {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = AudioContextClass ? new AudioContextClass() : null;
    }
    if (this.context && this.context.state === "suspended") {
      this.context.resume();
    }
  }

  playTone(frequency, duration, type = "sine", volume = 0.04) {
    if (!this.enabled || !this.context) {
      this.init();
      if (!this.context) return;
    }
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    oscillator.stop(this.context.currentTime + duration);
  }

  playSwitch() {
    this.init();
    this.playTone(640, 0.07, "triangle", 0.03);
  }

  playJump() {
    this.init();
    this.playTone(420, 0.08, "square", 0.025);
  }

  playPass() {
    this.init();
    this.playTone(760, 0.12, "sine", 0.04);
  }

  playFail() {
    this.init();
    this.playTone(180, 0.25, "sawtooth", 0.04);
  }

  playPause() {
    this.init();
    this.playTone(560, 0.06, "square", 0.02);
  }
}

class UIManager {
  constructor(game) {
    this.game = game;
    this.overlay = document.getElementById("overlay");
    this.orientationOverlay = document.getElementById("rotateOverlay");
    this.title = document.getElementById("overlayTitle");
    this.message = document.getElementById("overlayMessage");
    this.primaryButton = document.getElementById("primaryActionButton");
    this.secondaryButton = document.getElementById("secondaryActionButton");
    this.tertiaryButton = document.getElementById("tertiaryActionButton");
    this.installButton = document.getElementById("installButton");
    this.settingsButton = document.getElementById("settingsButton");
    this.leaderboardButton = document.getElementById("leaderboardButton");
    this.pauseButton = document.getElementById("pauseButton");
    this.exitButton = document.getElementById("exitButton");
    this.exitOverlayButton = document.getElementById("exitOverlayButton");
    this.shapeButton = document.getElementById("shapeButton");
    this.jumpButton = document.getElementById("jumpButton");
    this.touchControls = document.querySelector(".touch-controls");
    this.shapeIcon = document.getElementById("shapeIcon");
    this.scoreValue = document.getElementById("scoreValue");
    this.bestValue = document.getElementById("bestValue");

    this.primaryButton.addEventListener("click", () => this.handlePrimaryAction());
    this.secondaryButton.addEventListener("click", () => this.handleSecondaryAction());
    this.tertiaryButton.addEventListener("click", () => this.handleTertiaryAction());
    this.installButton.addEventListener("click", () => this.handleInstallPrompt());
    this.settingsButton.addEventListener("click", () => this.showSettings());
    this.leaderboardButton.addEventListener("click", () => this.showLeaderboard());
    this.pauseButton.addEventListener("click", () => this.game.togglePause());
    this.exitButton.addEventListener("click", () => this.handleExit());
    this.exitOverlayButton.addEventListener("click", () => this.handleExit());
    this.shapeButton.addEventListener("pointerdown", (event) => this.handleButtonPress(event, this.cycleShape));
    this.jumpButton.addEventListener("pointerdown", (event) => this.handleButtonPress(event, this.jump));
    this.shapeButton.addEventListener("pointerup", () => this.removePressedState(this.shapeButton));
    this.shapeButton.addEventListener("pointerleave", () => this.removePressedState(this.shapeButton));
    this.jumpButton.addEventListener("pointerup", () => this.removePressedState(this.jumpButton));
    this.jumpButton.addEventListener("pointerleave", () => this.removePressedState(this.jumpButton));
    this.shapeButton.addEventListener("touchend", () => this.removePressedState(this.shapeButton));
    this.jumpButton.addEventListener("touchend", () => this.removePressedState(this.jumpButton));
  }

  handlePrimaryAction() {
    if (this.game.state === "paused") {
      this.game.togglePause();
    } else {
      this.game.startGame();
    }
  }

  handleInstallPrompt() {
    if (this.game.installPrompt) {
      this.game.installPrompt.prompt();
    }
  }

  handleExit() {
    window.location.href = "../../games/shape-runner/index.html";
  }

  showSettings() {
    this.title.textContent = "Settings";
    this.message.textContent = "Customize your run.";
    this.primaryButton.textContent = "Music: On";
    this.secondaryButton.textContent = "Sound: On";
    this.tertiaryButton.textContent = "Back";
    this.secondaryButton.style.display = "inline-flex";
    this.tertiaryButton.style.display = "inline-flex";
    this.installButton.style.display = "none";
    this.settingsButton.style.display = "none";
    this.leaderboardButton.style.display = "none";
  }

  showLeaderboard() {
    this.title.textContent = "Leaderboard";
    this.message.textContent = "Coming soon with weekly challenges.";
    this.primaryButton.textContent = "Close";
    this.secondaryButton.style.display = "none";
    this.tertiaryButton.style.display = "none";
    this.installButton.style.display = "none";
    this.settingsButton.style.display = "none";
    this.leaderboardButton.style.display = "none";
  }

  handleSecondaryAction() {
    this.game.restartGame();
  }

  handleTertiaryAction() {
    this.game.returnToMenu();
  }

  cycleShape() {
    const nextIndex = (SHAPES.indexOf(this.game.player.currentShape) + 1) % SHAPES.length;
    this.game.player.switchShape(SHAPES[nextIndex]);
    this.updateShapeIcon();
  }

  jump() {
    if (this.game.state === "playing") {
      this.game.player.jump();
    }
  }

  handleButtonPress(event, action) {
    event.preventDefault();
    event.currentTarget.classList.add("pressed");
    action.call(this);
  }

  removePressedState(button) {
    button.classList.remove("pressed");
  }

  updateShapeIcon() {
    const iconMap = { triangle: "▲", square: "■", circle: "●" };
    this.shapeIcon.textContent = iconMap[this.game.player.currentShape];
  }

  showOrientationOverlay() {
    document.body.classList.add("orientation-lock");
    this.orientationOverlay.classList.add("active");
    this.orientationOverlay.setAttribute("aria-hidden", "false");
    this.overlay.classList.remove("active");
    this.touchControls.style.display = "none";
    this.pauseButton.style.display = "none";
  }

  hideOrientationOverlay() {
    document.body.classList.remove("orientation-lock");
    this.orientationOverlay.classList.remove("active");
    this.orientationOverlay.setAttribute("aria-hidden", "true");
  }

  showMenu() {
    this.overlay.classList.add("active");
    this.title.textContent = "Shape Runner";
    this.message.textContent = "Match the gate, switch shapes, and keep running.";
    this.primaryButton.textContent = "▶ Start Game";
    this.secondaryButton.textContent = "Restart";
    this.tertiaryButton.textContent = "Main Menu";
    this.secondaryButton.style.display = "none";
    this.tertiaryButton.style.display = "none";
    this.pauseButton.style.display = "none";
    this.exitButton.style.display = "none";
    this.touchControls.style.display = "none";
    this.installButton.style.display = "inline-flex";
    this.settingsButton.style.display = "inline-flex";
    this.leaderboardButton.style.display = "inline-flex";
  }

  showPause() {
    this.overlay.classList.add("active");
    this.title.textContent = "GAME PAUSED";
    this.message.textContent = "Take a breath and continue when ready.";
    this.primaryButton.textContent = "Resume";
    this.secondaryButton.textContent = "Restart";
    this.tertiaryButton.textContent = "Main Menu";
    this.secondaryButton.style.display = "inline-flex";
    this.tertiaryButton.style.display = "inline-flex";
    this.pauseButton.style.display = "none";
    this.exitButton.style.display = "none";
    this.touchControls.style.display = "none";
    this.installButton.style.display = "none";
    this.settingsButton.style.display = "none";
    this.leaderboardButton.style.display = "none";
  }

  showGameOver() {
    this.overlay.classList.add("active");
    this.title.textContent = "Game Over";
    this.message.textContent = `Score: ${this.game.scoreManager.score}. Press R to replay.`;
    this.primaryButton.textContent = "Play Again";
    this.secondaryButton.textContent = "Restart";
    this.tertiaryButton.textContent = "Main Menu";
    this.secondaryButton.style.display = "none";
    this.tertiaryButton.style.display = "inline-flex";
    this.pauseButton.style.display = "none";
    this.exitButton.style.display = "none";
    this.touchControls.style.display = "none";
    this.installButton.style.display = "none";
    this.settingsButton.style.display = "none";
    this.leaderboardButton.style.display = "none";
  }

  hideOverlay() {
    this.overlay.classList.remove("active");
    this.pauseButton.style.display = this.game.state === "playing" ? "inline-flex" : "none";
    this.exitButton.style.display = this.game.state === "playing" ? "inline-flex" : "none";
    this.touchControls.style.display = this.game.state === "playing" ? "flex" : "none";
  }

  updateHud(score, best) {
    this.scoreValue.textContent = score;
    this.bestValue.textContent = best;
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.context = this.canvas.getContext("2d");
    this.width = GAME_WIDTH;
    this.height = GAME_HEIGHT;
    this.groundY = GROUND_Y;
    this.speed = BASE_SPEED;
    this.speedLevel = 1;
    this.state = "menu";
    this.lastTime = 0;
    this.timeElapsed = 0;
    this.orientationPaused = false;
    this.previousStateBeforeOrientation = "menu";
    this.installPrompt = null;

    this.soundManager = new SoundManager();
    this.inputManager = new InputManager(this);
    this.uiManager = new UIManager(this);
    this.player = new Player(this);
    this.gateSpawner = new GateSpawner(this);
    this.scoreManager = new ScoreManager(this);
    this.particleSystem = new ParticleSystem(this);
    this.clouds = Array.from({ length: 6 }, () => ({
      x: Math.random() * this.width,
      y: 60 + Math.random() * 140,
      size: 30 + Math.random() * 50,
      speed: 12 + Math.random() * 9,
    }));
    this.bgOffset = 0;
    this.groundOffset = 0;

    window.addEventListener("resize", () => this.handleViewportChange());
    window.addEventListener("orientationchange", () => this.handleViewportChange());
    if (screen.orientation) {
      screen.orientation.addEventListener("change", () => this.handleViewportChange());
    }
    document.addEventListener("fullscreenchange", () => this.handleViewportChange());
    this.resize();
    this.setupInstallPrompt();
    this.uiManager.showMenu();
    this.scoreManager.updateHud();
    this.uiManager.updateShapeIcon();
    this.loop = this.loop.bind(this);
    this.loop(0);
  }

  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.installPrompt = event;
      this.uiManager.installButton.style.display = "inline-flex";
    });

    window.addEventListener("appinstalled", () => {
      this.installPrompt = null;
      this.uiManager.installButton.style.display = "none";
    });
  }

  resize() {
    const rectangle = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const baseWidth = rectangle.width || GAME_WIDTH;
    const baseHeight = rectangle.height || GAME_HEIGHT;
    this.width = baseWidth;
    this.height = baseHeight;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.groundY = this.height * 0.8;
    this.player.x = Math.min(this.width * 0.18, 180);
    this.player.y = this.groundY - this.player.height;
    this.player.groundY = this.groundY;
  }

  handleViewportChange() {
    this.resize();
    this.updateOrientationMode();
  }

  isMobileDevice() {
    const mobilePattern = /Android|iPhone|iPad|iPod|Mobile|Opera Mini/i;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const smallScreen = window.innerWidth <= 1366;
    return mobilePattern.test(navigator.userAgent) || (coarsePointer && smallScreen);
  }

  isPortraitMode() {
    return window.matchMedia("(orientation: portrait)").matches;
  }

  updateOrientationMode() {
    if (!this.isMobileDevice()) {
      this.orientationPaused = false;
      this.uiManager.hideOrientationOverlay();
      return;
    }
    if (this.isPortraitMode()) {
      this.pauseForOrientation();
    } else {
      this.resumeFromOrientation();
    }
  }

  pauseForOrientation() {
    if (this.orientationPaused) return;
    this.previousStateBeforeOrientation = this.state === "playing" ? "playing" : this.state;
    this.orientationPaused = true;
    this.state = "paused";
    this.uiManager.showOrientationOverlay();
  }

  resumeFromOrientation() {
    if (!this.orientationPaused) return;
    this.orientationPaused = false;
    const resumeState = this.previousStateBeforeOrientation || "playing";
    this.state = resumeState;
    this.uiManager.hideOrientationOverlay();
    if (resumeState === "playing") {
      this.uiManager.hideOverlay();
    } else if (resumeState === "paused") {
      this.uiManager.showPause();
    } else if (resumeState === "menu") {
      this.uiManager.showMenu();
    } else if (resumeState === "gameover") {
      this.uiManager.showGameOver();
    }
  }

  startGame() {
    this.state = "playing";
    this.timeElapsed = 0;
    this.speed = BASE_SPEED;
    this.speedLevel = 1;
    this.player.reset();
    this.gateSpawner.reset();
    this.particleSystem.particles = [];
    this.scoreManager.reset();
    this.scoreManager.updateHud();
    this.uiManager.hideOverlay();
    this.uiManager.updateShapeIcon();
    this.soundManager.init();
  }

  restartGame() {
    this.startGame();
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.uiManager.showPause();
      this.soundManager.playPause();
    } else if (this.state === "paused") {
      this.state = "playing";
      this.uiManager.hideOverlay();
    }
  }

  returnToMenu() {
    this.state = "menu";
    this.uiManager.showMenu();
    this.gateSpawner.reset();
    this.particleSystem.particles = [];
  }

  handleInput() {
    if (this.inputManager.consumePressed("1")) {
      this.player.switchShape("triangle");
    }
    if (this.inputManager.consumePressed("2")) {
      this.player.switchShape("square");
    }
    if (this.inputManager.consumePressed("3")) {
      this.player.switchShape("circle");
    }
    if (this.inputManager.consumePressed(" ")) {
      if (this.state === "menu") {
        this.startGame();
      } else if (this.state === "playing") {
        this.player.jump();
      } else if (this.state === "gameover") {
        this.restartGame();
      }
    }
    if (this.inputManager.consumePressed("p")) {
      if (this.state === "playing" || this.state === "paused") {
        this.togglePause();
      }
    }
    if (this.inputManager.consumePressed("r")) {
      if (this.state === "gameover") {
        this.restartGame();
      }
    }
    if (this.inputManager.consumePressed("enter")) {
      if (this.state === "menu" || this.state === "gameover") {
        this.startGame();
      }
    }
  }

  update(deltaTime) {
    if (this.state !== "playing") return;
    this.handleInput();
    this.timeElapsed += deltaTime;
    this.speed = BASE_SPEED + Math.floor(this.timeElapsed / SPEED_INTERVAL) * SPEED_INCREMENT;
    this.speedLevel = 1 + Math.floor(this.timeElapsed / SPEED_INTERVAL);
    this.player.update(deltaTime);
    this.gateSpawner.update(deltaTime);
    this.particleSystem.update(deltaTime);
    this.bgOffset += this.speed * deltaTime * 0.02;
    this.groundOffset += this.speed * deltaTime * 0.55;

    this.clouds.forEach((cloud) => {
      cloud.x -= cloud.speed * deltaTime * 0.35;
      if (cloud.x + cloud.size < -20) {
        cloud.x = this.width + 20;
        cloud.y = 50 + Math.random() * 120;
        cloud.size = 24 + Math.random() * 40;
      }
    });

    for (const gate of this.gateSpawner.activeGates) {
      if (!gate.active) continue;
      if (gate.type === "obstacle") {
        const playerBounds = { x: this.player.x + 4, y: this.player.y + 4, width: this.player.width - 8, height: this.player.height - 8 };
        const gateBounds = gate.getBounds();
        const collision = playerBounds.x < gateBounds.x + gateBounds.width && playerBounds.x + playerBounds.width > gateBounds.x && playerBounds.y < gateBounds.y + gateBounds.height && playerBounds.y + playerBounds.height > gateBounds.y;
        if (collision) {
          this.endGame();
          return;
        }
      } else {
        const playerBounds = { x: this.player.x + 4, y: this.player.y + 4, width: this.player.width - 8, height: this.player.height - 8 };
        const gateBounds = gate.getBounds();
        const collision = playerBounds.x < gateBounds.x + gateBounds.width && playerBounds.x + playerBounds.width > gateBounds.x && playerBounds.y < gateBounds.y + gateBounds.height && playerBounds.y + playerBounds.height > gateBounds.y;
        if (collision) {
          if (this.player.currentShape === gate.requiredShape) {
            gate.active = false;
            this.scoreManager.add(10 + this.speedLevel * 2);
            this.scoreManager.updateHud();
            this.particleSystem.emit(this.player.x + this.player.width / 2, this.player.y + 10, SHAPE_COLORS[this.player.currentShape]);
            this.soundManager.playPass();
            this.gateSpawner.releaseGate(gate);
          } else {
            this.endGame();
            return;
          }
        }
      }
    }
  }

  endGame() {
    this.state = "gameover";
    this.player.hitFlash = 1;
    this.uiManager.showGameOver();
    this.soundManager.playFail();
  }

  drawBackground() {
    this.context.clearRect(0, 0, this.width, this.height);
    const sky = this.context.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#8bd3ff");
    sky.addColorStop(0.75, "#f8fafc");
    this.context.fillStyle = sky;
    this.context.fillRect(0, 0, this.width, this.height);

    this.context.fillStyle = "#fbbf24";
    this.context.beginPath();
    this.context.arc(this.width * 0.82, 90, 38, 0, Math.PI * 2);
    this.context.fill();

    this.context.save();
    this.context.translate(-this.bgOffset * 0.35, 0);
    this.clouds.forEach((cloud) => {
      this.context.fillStyle = "rgba(255,255,255,0.75)";
      this.context.beginPath();
      this.context.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      this.context.arc(cloud.x + cloud.size * 0.25, cloud.y - cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2);
      this.context.arc(cloud.x + cloud.size * 0.4, cloud.y + cloud.size * 0.15, cloud.size * 0.3, 0, Math.PI * 2);
      this.context.fill();
    });
    this.context.restore();

    this.context.fillStyle = "#a7f3d0";
    this.context.beginPath();
    this.context.moveTo(0, this.height * 0.7);
    this.context.quadraticCurveTo(this.width * 0.25, this.height * 0.58, this.width * 0.5, this.height * 0.66);
    this.context.quadraticCurveTo(this.width * 0.75, this.height * 0.74, this.width, this.height * 0.62);
    this.context.lineTo(this.width, this.height);
    this.context.lineTo(0, this.height);
    this.context.closePath();
    this.context.fill();
  }

  drawGround() {
    const groundHeight = this.height * 0.22;
    this.context.fillStyle = "#3f6212";
    this.context.fillRect(0, this.groundY, this.width, groundHeight);

    this.context.save();
    this.context.translate(-this.groundOffset, 0);
    this.context.fillStyle = "#4d7c0f";
    for (let i = 0; i < 20; i += 1) {
      const x = i * 90;
      this.context.fillRect(x, this.groundY + 4, 70, 14);
    }
    this.context.restore();

    this.context.fillStyle = "#f59e0b";
    this.context.fillRect(0, this.groundY - 8, this.width, 8);
  }

  draw() {
    this.drawBackground();
    this.drawGround();
    this.gateSpawner.activeGates.forEach((gate) => gate.draw(this.context));
    this.particleSystem.draw(this.context);
    this.player.draw(this.context);
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaTime = Math.min(0.025, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.handleInput();
    this.update(deltaTime);
    this.draw();
    requestAnimationFrame(this.loop);
  }
}

window.addEventListener("load", () => {
  new Game();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../../service-worker.js").catch(() => {});
  }
});
