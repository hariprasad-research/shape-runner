const gamesData = [
  {
    id: 1,
    title: "Shape Runner",
    description: "Switch forms, dodge hazards, and keep your rhythm alive in a fast arcade run.",
    genre: "Arcade",
    rating: "4.9",
    category: "arcade",
    path: "games/shape-runner/play.html",
    featured: true,
    latest: true,
    popular: true,
    thumbnail: "assets/images/shape-runner-thumb.svg"
  },
  {
    id: 2,
    title: "Neon Drift",
    description: "A responsive speed challenge with glowing lanes and split-second reactions.",
    genre: "Racing",
    rating: "4.7",
    category: "racing",
    path: "games/neon-drift/index.html",
    featured: false,
    latest: true,
    popular: true,
    thumbnail: "assets/images/neon-drift-thumb.svg"
  },
  {
    id: 3,
    title: "Cosmic Blocks",
    description: "Stack, rotate, and clear colorful blocks in a relaxing puzzle sprint.",
    genre: "Puzzle",
    rating: "4.6",
    category: "puzzle",
    path: "games/cosmic-blocks/index.html",
    featured: false,
    latest: true,
    popular: false,
    thumbnail: "assets/images/cosmic-blocks-thumb.svg"
  },
  {
    id: 4,
    title: "Pixel Quest",
    description: "A charming 2D adventure with collectible secrets and retro aesthetics.",
    genre: "Adventure",
    rating: "4.8",
    category: "adventure",
    path: "games/pixel-quest/index.html",
    featured: true,
    latest: false,
    popular: true,
    thumbnail: "assets/images/featured-hero.svg"
  }
];

const themeKey = "arasan-theme";

function initTheme() {
  const savedTheme = localStorage.getItem(themeKey);
  const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const theme = savedTheme || systemTheme;
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  localStorage.setItem(themeKey, currentTheme);
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  }
}

function closeMenu() {
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("menuToggle");
  if (nav) nav.classList.remove("open");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("menuToggle");
  if (!nav || !toggle) return;
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
}

function renderGameCards(target, filter = "all", limit = null) {
  const container = document.getElementById(target);
  if (!container) return;

  let list = gamesData.filter((game) => {
    if (filter === "featured") return game.featured;
    if (filter === "latest") return game.latest;
    if (filter === "popular") return game.popular;
    return game;
  });

  if (limit) {
    list = list.slice(0, limit);
  }

  container.innerHTML = list.map((game) => `
    <article class="game-card" role="listitem">
      <img src="${game.thumbnail}" alt="${game.title} thumbnail" loading="lazy" />
      <div class="game-card-body">
        <div class="game-card-meta">
          <span class="pill">${game.genre}</span>
          <span class="pill accent">★ ${game.rating}</span>
        </div>
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <a class="btn btn-secondary" href="${game.path}">Play now</a>
      </div>
    </article>
  `).join("");
}

function getSearchQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("query") || "";
}

function setupGamesPage() {
  const gamesGrid = document.getElementById("gamesGrid");
  const searchInput = document.getElementById("gameSearch");
  const categoryFilter = document.getElementById("categoryFilter");

  if (!gamesGrid) return;

  const initialQuery = getSearchQuery();
  const categories = ["all", ...new Set(gamesData.map((game) => game.category))];
  if (categoryFilter) {
    categoryFilter.innerHTML = categories.map((category) => `<option value="${category}">${category === "all" ? "All categories" : category.charAt(0).toUpperCase() + category.slice(1)}</option>`).join("");
  }

  function applyFilters() {
    const query = (searchInput ? searchInput.value : initialQuery).toLowerCase();
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";

    const filteredGames = gamesData.filter((game) => {
      const matchesSearch = game.title.toLowerCase().includes(query) || game.description.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    gamesGrid.innerHTML = filteredGames.map((game) => `
      <article class="game-card" role="listitem">
        <img src="${game.thumbnail}" alt="${game.title} thumbnail" loading="lazy" />
        <div class="game-card-body">
          <div class="game-card-meta">
            <span class="pill">${game.genre}</span>
            <span class="pill accent">★ ${game.rating}</span>
          </div>
          <h3>${game.title}</h3>
          <p>${game.description}</p>
          <a class="btn btn-secondary" href="${game.path}">Play now</a>
        </div>
      </article>
    `).join("");
  }

  if (searchInput) {
    searchInput.value = initialQuery;
    searchInput.addEventListener("input", applyFilters);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener("change", applyFilters);
  }

  applyFilters();
}

function setupHomeSearch() {
  const form = document.getElementById("homeSearchForm");
  const input = document.getElementById("homeSearch");

  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = encodeURIComponent(input.value.trim());
    window.location.href = `games.html?query=${query}`;
  });
}

function setupScrollTop() {
  const button = document.getElementById("scrollTop");
  if (!button) return;
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    button.classList.toggle("visible", window.scrollY > 360);
  });
}

function setFooterYear() {
  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

function initNavigation() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("siteNav");
  const themeToggle = document.getElementById("themeToggle");

  if (toggle) {
    toggle.addEventListener("click", toggleMenu);
  }
  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) {
      closeMenu();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) {
      closeMenu();
    }
  });
}

function initLoader() {
  const loader = document.querySelector(".page-loader");
  if (!loader) return;
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("hidden"), 380);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  initLoader();
  setFooterYear();
  setupScrollTop();
  setupHomeSearch();
  renderGameCards("featuredGames", "featured", 2);
  renderGameCards("latestGames", "latest", 3);
  renderGameCards("popularGames", "popular", 3);
  setupGamesPage();
});
