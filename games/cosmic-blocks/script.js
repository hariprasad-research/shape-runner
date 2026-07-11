const board = document.getElementById("board");
const scoreText = document.getElementById("scoreText");
const messageText = document.getElementById("messageText");
const resetBtn = document.getElementById("resetBtn");

const symbols = ["☄", "⚡", "⭐", "🌌", "☀", "☾", "☁", "✦"];
let cards = [];
let firstPick = null;
let secondPick = null;
let matches = 0;
let lockBoard = false;
let round = 1;
let pairCount = 3;

function createDeck() {
  const availableSymbols = symbols.slice(0, pairCount);
  const deck = [...availableSymbols, ...availableSymbols].sort(() => Math.random() - 0.5);
  return deck.map((symbol, index) => ({ id: index, symbol, matched: false, revealed: false }));
}

function buildBoard() {
  board.innerHTML = "";
  cards.forEach((card) => {
    const button = document.createElement("button");
    button.className = "memory-card";
    button.dataset.id = card.id;
    button.innerHTML = card.matched || card.revealed ? card.symbol : "?";
    button.addEventListener("click", () => handlePick(card.id));
    board.appendChild(button);
  });
}

function updateScore() {
  scoreText.textContent = `Round ${round} • Matches: ${matches}`;
}

function resetGame() {
  cards = createDeck();
  firstPick = null;
  secondPick = null;
  matches = 0;
  lockBoard = false;
  updateScore();
  messageText.textContent = `Round ${round}: find ${pairCount} matching pairs.`;
  buildBoard();
}

function handlePick(cardId) {
  const card = cards.find((entry) => entry.id === cardId);
  if (!card || card.matched || lockBoard) return;

  if (!firstPick) {
    firstPick = card;
    card.revealed = true;
    buildBoard();
    messageText.textContent = "Great start! Try another block.";
    return;
  }

  secondPick = card;
  card.revealed = true;
  buildBoard();
  lockBoard = true;

  if (firstPick.symbol === secondPick.symbol) {
    cards = cards.map((entry) => (entry.id === firstPick.id || entry.id === secondPick.id ? { ...entry, matched: true, revealed: true } : entry));
    matches += 1;
    updateScore();
    messageText.textContent = "Match found! Keep going.";
    firstPick = null;
    secondPick = null;
    lockBoard = false;
    buildBoard();

    if (matches === pairCount) {
      round += 1;
      pairCount = Math.min(symbols.length, pairCount + 1);
      messageText.textContent = "Round cleared! The next round gets tougher.";
      setTimeout(() => resetGame(), 800);
    }
  } else {
    messageText.textContent = "No match. Try again.";
    setTimeout(() => {
      firstPick = null;
      secondPick = null;
      lockBoard = false;
      cards = cards.map((entry) => ({ ...entry, revealed: false }));
      buildBoard();
    }, 700);
  }
}

resetBtn.addEventListener("click", () => {
  round = 1;
  pairCount = 3;
  resetGame();
});
resetGame();
