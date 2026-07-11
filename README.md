# Shape Runner

Shape Runner is a polished 2D endless runner built with the HTML5 Canvas API, CSS3, and modern ES6 JavaScript. The player automatically runs forward while the player switches between triangle, square, and circle forms to match incoming gates. The game also includes obstacle jumping, increasing speed, local score tracking, particle effects, and simple sound effects.

## Features

- Endless runner gameplay with automatic forward movement
- Three playable shapes: triangle, square, and circle
- Random gate spawns that require a matching shape
- Jumping over ground obstacles
- Gradually increasing speed every 20 seconds
- Score and best-score tracking with localStorage
- Main menu, pause overlay, game over overlay, and restart flow
- Responsive canvas rendering and animated background/ground
- Particle effects, shape-switch animation, and synthesized sound effects

## Controls

- 1: Triangle
- 2: Square
- 3: Circle
- Space: Jump
- P: Pause
- R: Restart after game over

## Installation

1. Open the project folder in a browser.
2. Launch the game by opening [index.html](index.html) directly, or serve the folder with any static file server.

Then open http://localhost:8000/ in your browser.

## How to Play

- Start the game from the main menu.
- Switch shapes to match each incoming gate before collision.
- Use the jump key to clear ground obstacles.
- Passing a matching gate adds points.
- A wrong shape or obstacle collision ends the run.

## Future Improvements

- Add more obstacle types and power-ups
- Introduce combo scoring and multipliers
- Add mobile touch controls
- Add richer animations and visual polish
- Replace placeholder audio with custom sound assets
