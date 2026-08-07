# Tsumamigui
つまみ食いUI
Tsumamigui is a playful browser demo where you use hand tracking to pinch and move floating icons.

## Repository

- Repository: `tsumamigui`
- Domain: `tsumamigui.app`
- Version: `0.1.0`

## What it is

- 8 floating icons are rendered on canvas.
- **Camera mode**: move hands and gesture to pinch an icon, carry it to the mouth area, and consume it.
- **Pointer mode**: simulate pinch with mouse/touch pointer for easier testing.
- Smooth interaction with MediaPipe hand/face tasks, custom grab/release behavior, and visual feedback.

## Tech stack

- Vite
- TypeScript
- p5.js
- @mediapipe/tasks-vision
- ESLint / Prettier
- Vitest
- Playwright

## Scripts

```bash
npm install
npm run assets
npm run dev
```

### Validation

```bash
npm run test:run
npm run test:e2e
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run check
```

### Deploy

```bash
npm run build
```

GitHub Pages is configured with custom domain:
- `tsumamigui.app`

## Notes

- Supports both desktop and mobile browser usage.
- Includes reduced-motion support and basic error/visibility handling.
