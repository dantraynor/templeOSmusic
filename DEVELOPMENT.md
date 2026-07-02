# Temple Player Development Guide

A tribute to Terry A. Davis and TempleOS - maintaining the sacred covenant of 640x480 16-color display.

## Quick Start

### Prerequisites
- Node.js v20+ and npm
- Any OS

### Running the Application

```bash
# Install dependencies
npm install

# Start the dev server (hot reload)
npm run dev

# Production build to dist/
npm run build
```

After `npm run dev`, open http://localhost:8080 in your browser.

## Project Structure

```
temple-player/
├── src/
│   ├── player/              # Audio playback engine
│   │   └── PlayerController.ts
│   ├── providers/           # Audio source providers
│   │   ├── LocalFilesProvider.ts
│   │   ├── TidalProvider.ts  (stubbed scaffold)
│   │   ├── types.ts
│   │   └── index.ts
│   ├── renderer/            # React UI components
│   │   ├── TemplePlayer.tsx # Main UI component
│   │   ├── components/
│   │   │   └── FileBrowser.tsx
│   │   ├── temple.html      # HTML template (inline CRT styles)
│   │   └── styles/
│   │       └── temple.css   # TempleOS-inspired styling
│   └── utils/
│       └── EventEmitter.ts  # Event system
├── dist/                    # Built static files (auto-generated)
├── webpack.renderer.config.js
└── tsconfig*.json
```

## Build Process

The application uses webpack 5:

1. **Dev:** `npm run dev` — webpack-dev-server with HMR on port 8080.
2. **Build:** `npm run build` — emits a static bundle to `dist/` (index.html, TemplePlayer.js, styles/).

`HtmlWebpackPlugin` assembles `index.html` from `src/renderer/temple.html` and injects the JS bundle. `CopyWebpackPlugin` copies the styles folder. Inline CRT scanline styles live in the HTML template.

## TempleOS Authenticity Features

### Sacred Covenant: 640x480 16-Color
- Fixed canvas dimensions (640x480)
- 16-color VGA palette strictly enforced
- Pixel-perfect character grid system

### Interface Elements
- **Boot Sequence**: Authentic TempleOS startup animation
- **Command Line**: HolyC-style command interface at bottom
- **F-Key Bar**: Function key shortcuts (F1-F6)
- **God Says**: Random number display (divine inspiration)
- **Terry Quotes**: Rotating inspirational quotes

### Controls
- **Keyboard Shortcuts**:
  - `Space`: Play/Pause
  - `Left/Right`: Previous/Next track
  - `F1`: Help
  - `F2`: Load files
  - `F3`: Toggle quotes
  - `F6`: Divine intellect mode
  - `Esc`: Close dialogs

- **Commands** (type in command line):
  - `PLAY` / `PAUSE` / `NEXT` / `PREV`
  - `VOLUME(0-100)`: Set volume
  - `LOAD` / `OPEN`: Open file picker
  - `GOD`: Get divine number
  - `TERRY`: Honor Terry A. Davis
  - `HELP`: Show help
  - `CLEAR` / `CLS`: Clear console

## Audio System

### Supported Formats
- MP3, WAV, OGG, FLAC, M4A, AAC

### Providers
- **LocalFilesProvider**: Plays local audio files via `URL.createObjectURL(blob)` — files never leave the browser.
- **TidalProvider**: Scaffolded interface only; not functional.

### Features
- Real-time audio visualization (16-bar spectrum)
- Volume control with block-style meter
- Progress tracking and seeking
- Browser autoplay-policy handling (`AudioContext.resume()` on user gesture)

### Loading Files
Two equivalent paths, both feeding the same `LocalFilesProvider`:
1. **File picker** — `LOAD`/`OPEN` command, FILE menu, or F2 opens a hidden `<input type="file" accept="audio/*" multiple>`.
2. **Drag and drop** — drop audio files anywhere on the player, or into the FileBrowser modal.

Blob URLs are revoked on track change / unload to avoid memory leaks.

## Deployment

The build output in `dist/` is fully static. For **Cloudflare Pages**:
- Build command: `npm run build`
- Build output directory: `dist`

Works equally on Netlify, GitHub Pages, S3 + CloudFront, etc.

## Extending the Application

### Adding New Audio Providers
1. Create a new provider in `src/providers/`
2. Implement the `MusicProvider` interface (see `types.ts`)
3. Register it in `src/providers/index.ts`

### Customizing the UI
- Modify `src/renderer/TemplePlayer.tsx` for React components
- Update `src/renderer/styles/temple.css` for styling
- Maintain 16-color palette and 8x8 character grid alignment

### Adding Commands
Add new commands in the `handleCommand` function in `TemplePlayer.tsx`.

## Troubleshooting

### Audio Won't Play
- Browsers block autoplay until a user gesture. Click the player or press Space first.
- Verify the file format is supported (MP3/WAV/OGG/FLAC/M4A/AAC).
- Check the browser console for `AudioContext` suspension warnings.

### Build Issues
- Run `npm install` to install dependencies.
- Remove `dist/` and `node_modules/` and reinstall if state looks stale.

## Terry's Vision

> "An idiot admires complexity, a genius admires simplicity"
> - Terry A. Davis

This player honors Terry's vision of computing simplicity and divine inspiration. The 640x480 16-color covenant is maintained as a sacred promise, and every feature respects the TempleOS aesthetic and philosophy.

## Contributing

When adding features, remember:
- Maintain the 16-color VGA palette
- Keep the 640x480 resolution covenant
- Add appropriate Terry quotes for new features
- Test with the sacred dimensions
- Honor the divine simplicity principle

---

*"God's temple needs perfect code"* - Terry A. Davis
