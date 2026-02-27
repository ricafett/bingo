# 🎱 Bingo Flashcard

A simple, clean, single-page fullscreen Bingo caller web app. No installation required — just open `index.html` in any modern browser.

![Bingo Flashcard screenshot](https://via.placeholder.com/800x450?text=Bingo+Flashcard)

## Features

- **Manual draw** — click any number on the board to draw it; no auto-draw
- **B/I/N/G/O grid** — 75 numbers organised in 5 rows (1–15, 16–30, 31–45, 46–60, 61–75); drawn numbers stay permanently highlighted
- **History strip** — scrollable bar showing all drawn numbers in reverse order (most recent first, displayed larger); scroll with mouse wheel
- **Ball counter** — live count of drawn balls alongside the history
- **Editable game title** — click the heading in the top bar to rename your game; saved automatically
- **Resume or New Game** — on page load, if a game is in progress a prompt lets you resume or start fresh
- **LocalStorage persistence** — game state and title survive page refreshes
- **Light / Dark theme** — toggle with the ☀️/🌙 button; preference is remembered

## Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styles | [Pico CSS v2](https://picocss.com/) + custom CSS |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | `localStorage` |

No build step, no dependencies to install, no bundler.

## Getting Started

```bash
git clone https://github.com/ricafett/bingo.git
cd bingo
# open index.html in your browser
```

Or just download the three files (`index.html`, `style.css`, `app.js`) and open `index.html` directly.

## Project Structure

```
bingo/
├── index.html   # Page structure and markup (pt-PT)
├── style.css    # Layout, grid, history strip, theming
├── app.js       # All game logic and state management
├── README.md
└── LICENSE
```

## Localisation

All user-facing text is in **European Portuguese (pt-PT)**.

## Built with AI

This project was built with the assistance of **GitHub Copilot** (powered by **Claude Sonnet 4.6** by Anthropic), acting as an interactive coding assistant via the GitHub Copilot CLI. All code was generated through a conversation-driven workflow — feature requests, layout adjustments, and bug fixes were described in natural language and implemented autonomously.

## License

[MIT](LICENSE) © Ricardo Filipe
