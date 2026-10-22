@import "tailwindcss";

/* PEER PLATFORM — CRACKED? DESIGN SYSTEM */

@theme {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  --font-serif: 'Georgia', 'Times New Roman', serif;

  --color-accent: #FF4C25;
  --color-accent-hover: #FF6B4A;
  --color-track-arena: #10B981;
  --color-track-questions: #8B5CF6;
  --color-track-cases: #F59E0B;

  --color-success: #10B981;
  --color-error: #EF4444;

  --color-bg: #0B0B0F;
  --color-bg-surface: #121217;
  --color-text-primary: #F5F5F0;
  --color-text-secondary: #D4D4D0;
  --color-text-muted: #8A8A85;
  --color-border: rgba(255, 255, 255, 0.08);

  --radius-card: 16px;
  --radius-button: 12px;
  --radius-sm: 6px;
}

:root {
  --bg: #0B0B0F;
  --bg-surface: #121217;
  --accent: #FF4C25;
  --accent-hover: #FF6B4A;
  --track-arena: #10B981;
  --track-questions: #8B5CF6;
  --track-cases: #F59E0B;
  --text-primary: #F5F5F0;
  --text-secondary: #D4D4D0;
  --text-muted: #8A8A85;
  --border: rgba(255, 255, 255, 0.08);
  --radius-card: 16px;
  --radius-button: 12px;

  --text-h1: clamp(40px, 6vw, 72px);
  --text-h2: clamp(28px, 4vw, 44px);
  --text-body: 17px;
  --text-body-lg: 18px;
  --text-small: 14px;
  --line-body: 1.6;
  --line-tight: 1.15;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family: var(--font-sans);
  background:
    radial-gradient(circle at top, rgba(255, 76, 37, 0.08), transparent 30%),
    #0B0B0F;
  color: var(--text-primary);
  font-size: var(--text-body);
  line-height: var(--line-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

h1 {
  font-size: var(--text-h1);
  line-height: var(--line-tight);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

h2 {
  font-size: var(--text-h2);
  line-height: var(--line-tight);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

h3 {
  font-size: clamp(20px, 3vw, 28px);
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

p {
  margin: 0;
  color: var(--text-secondary);
}

img {
  max-width: 100%;
  display: block;
}

button, input { font: inherit; }

a {
  color: var(--text-primary);
  text-decoration: none;
  transition: color 150ms ease;
}

a:hover {
  color: var(--accent);
}

.section-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  font-weight: 600;
}

.accent-underline {
  position: relative;
  display: inline-block;
}

.accent-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background-color: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 200ms ease;
}

.accent-underline:hover::after {
  transform: scaleX(1);
}

.serif-italic {
  font-family: var(--font-serif);
  font-style: italic;
}

::selection {
  background: rgba(255, 76, 37, 0.28);
}

@media (max-width: 640px) {
  body {
    background: #0B0B0F;
  }
}

#root {
  min-height: 100vh;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}























































































































































































































































































































































































































































.








