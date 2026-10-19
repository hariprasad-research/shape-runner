const FALLBACK_GAMES = [
  {
    id: "shape-runner",
    title: "Shape Runner",
    genre: "Arcade",
    category: "arcade",
    description: "Switch shapes, dodge hazards, and ride a neon rhythm to a sky-high score.",
    thumbnail: "assets/images/shape-runner-thumb.svg",
    embedPath: "games/shape-runner/play.html",
    tags: ["endless", "reflex", "arcade"],
    featured: true,
    trending: true,
    recentlyPlayed: true,
    continuePlaying: true,
    recommended: true,
    duration: "8 min"
  },
  {
    id: "neon-drift",
    title: "Neon Drift",
    genre: "Racing",
    category: "racing",
    description: "Glide through glowing lanes and stay ahead of the speeding traffic.",
    thumbnail: "assets/images/neon-drift-thumb.svg",
    embedPath: "games/neon-drift/index.html",
    tags: ["lane", "speed", "arcade"],
    trending: true,
    recentlyPlayed: true,
    recommended: true,
    duration: "5 min"
  },
  {
    id: "cosmic-blocks",
    title: "Cosmic Blocks",
    genre: "Puzzle",
    category: "puzzle",
    description: "Match dazzling cosmic symbols in a fast, relaxing memory sprint.",
    thumbnail: "assets/images/cosmic-blocks-thumb.svg",
    embedPath: "games/cosmic-blocks/index.html",
    tags: ["memory", "puzzle", "relax"],
    continuePlaying: true,
    recommended: true,
    duration: "4 min"
  },
  {
    id: "pixel-quest",
    title: "Pixel Quest",
    genre: "Adventure",
    category: "adventure",
    description: "Collect stars, dodge danger, and reach the portal in a retro quest loop.",
    thumbnail: "assets/images/featured-hero.svg",
    embedPath: "games/pixel-quest/index.html",
    tags: ["adventure", "retro", "collect"],
    featured: true,
    continuePlaying: true,
    recommended: true,
    duration: "7 min"
  },
  {
    id: "aurora-run",
    title: "Aurora Run",
    genre: "Arcade",
    category: "arcade",
    description: "Dash through luminous obstacles in a calming, high-energy runner.",
    thumbnail: "assets/images/featured-hero.svg",
    embedPath: "games/shape-runner/play.html",
    tags: ["speed", "arcade", "endless"],
    trending: true,
    recommended: true,
    duration: "6 min"
  },
  {
    id: "nova-match",
    title: "Nova Match",
    genre: "Puzzle",
    category: "puzzle",
    description: "A bright, fast-paced matching challenge with escalating rounds.",
    thumbnail: "assets/images/cosmic-blocks-thumb.svg",
    embedPath: "games/cosmic-blocks/index.html",
    tags: ["match", "puzzle", "timed"],
    duration: "4 min"
  }
];

const state = {
  games: FALLBACK_GAMES,
  activeGameId: "shape-runner",
  filter: "all",
  search: "",
  loading: true,
  visibleCount: 6,
};

const playerFrame = document.getElementById("gameFrame");
const playerPlaceholder = document.getElementById("playerPlaceholder");
const playerTitle = document.getElementById("playerTitle");
const playerDescription = document.getElementById("playerDescription");
const playerMetaTitle = document.getElementById("playerMetaTitle");
const playerMetaText = document.getElementById("playerMetaText");
const playerTags = document.getElementById("playerTags");
const playNowBtn = document.getElementById("playNowBtn");
const nextGameBtn = document.getElementById("nextGameBtn");
const chips = document.querySelectorAll(".chip");
const searchInput = document.getElementById("globalSearch");
const loader = document.querySelector(".page-loader");
const scrollTopBtn = document.getElementById("scrollTop");
const themeToggle = document.getElementById("themeToggle");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadGames() {
  try {
    const response = await fetch("games.json", { cache: "force-cache" });
    if (!response.ok) throw new Error("Fetch failed");
    const games = await response.json();
    state.games = games;
  } catch (error) {
    state.games = FALLBACK_GAMES;
  } finally {
    state.loading = false;
    renderAll();
    setTimeout(() => loader?.classList.add("hidden"), 250);
  }
}

function applyFilterAndSearch(list) {
  const query = state.search.toLowerCase();
  return list.filter((game) => {
    const matchesCategory = state.filter === "all" || game.category === state.filter;
    const haystack = [game.title, game.genre, game.description, ...(game.tags || [])].join(" ").toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesCategory && matchesSearch;
  });
}

function getVisibleGames(filterFn) {
  const filtered = applyFilterAndSearch(state.games.filter(filterFn));
  return filtered.slice(0, state.visibleCount);
}

function renderSection(containerId, filterFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (state.loading) {
    container.innerHTML = Array.from({ length: 3 }, () => '<div class="skeleton-card"></div>').join("");
    return;
  }

  const games = getVisibleGames(filterFn);
  container.innerHTML = games.length
    ? games.map((game) => `
        <article class="game-card" data-id="${game.id}">
          <img src="${game.thumbnail}" alt="${escapeHtml(game.title)} thumbnail" loading="lazy" />
          <div>
            <strong>${escapeHtml(game.title)}</strong>
            <p>${escapeHtml(game.description)}</p>
          </div>
        </article>
      `).join("")
    : '<p class="empty-state">No games match this view yet.</p>';

  container.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => switchGame(card.dataset.id));
  });
}

function renderPlayer(game) {
  playerTitle.textContent = game.title;
  playerDescription.textContent = game.description;
  playerMetaTitle.textContent = game.title;
  playerMetaText.textContent = `${game.genre} • ${game.duration}`;
  playerTags.innerHTML = (game.tags || []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("");

  playerPlaceholder.style.display = "grid";
  playerFrame.style.display = "block";
  playerFrame.style.opacity = "0";
  playerFrame.classList.remove("is-ready");
  setTimeout(() => {
    playerFrame.src = game.embedPath;
    playerFrame.onload = () => {
      playerFrame.style.opacity = "1";
      playerFrame.classList.add("is-ready");
      playerPlaceholder.style.display = "none";
    };
  }, 120);
}

function renderAll() {
  renderSection("recentlyPlayedList", (game) => game.recentlyPlayed);
  renderSection("continuePlayingList", (game) => game.continuePlaying);
  renderSection("trendingList", (game) => game.trending);
  renderSection("recommendedList", (game) => game.recommended);
  renderSection("relatedList", (game) => game.id !== state.activeGameId);

  const activeGame = state.games.find((game) => game.id === state.activeGameId) || state.games[0];
  if (activeGame) {
    renderPlayer(activeGame);
  }
}

function switchGame(gameId) {
  const nextGame = state.games.find((game) => game.id === gameId);
  if (!nextGame) return;
  state.activeGameId = gameId;
  playerPlaceholder.style.display = "grid";
  playerFrame.style.display = "block";
  playerFrame.style.opacity = "0";
  playerFrame.classList.remove("is-ready");
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("arasan-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const saved = localStorage.getItem("arasan-theme");
  setTheme(saved || "dark");
}

function initFilters() {
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      state.filter = chip.dataset.category || "all";
      state.visibleCount = 6;
      renderAll();
    });
  });

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    state.visibleCount = 6;
    renderAll();
  });
}

function initInfiniteScroll() {
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 420) {
      state.visibleCount += 3;
      renderAll();
    }
    scrollTopBtn.classList.toggle("visible", window.scrollY > 320);
  });
}

playNowBtn.addEventListener("click", () => {
  const game = state.games.find((item) => item.id === state.activeGameId) || state.games[0];
  if (game) {
    renderPlayer(game);
  }
});

nextGameBtn.addEventListener("click", () => {
  const index = state.games.findIndex((item) => item.id === state.activeGameId);
  const nextGame = state.games[(index + 1) % state.games.length];
  switchGame(nextGame.id);
});

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(current);
});

scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initFilters();
  initInfiniteScroll();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
  loadGames();
});
