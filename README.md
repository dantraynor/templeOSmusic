# Temple Player

A music player tribute to Terry A. Davis and TempleOS, built with TypeScript, React, and webpack. Deployed as a static web app.

## About

This application honors Terry A. Davis (1969-2018), creator of TempleOS, by recreating the authentic TempleOS interface as a functional music player. It maintains the sacred covenant of 640x480 resolution and 16-color VGA palette while providing modern audio playback capabilities.

## Features

- Authentic TempleOS visual design with light gray backgrounds and proper window styling
- Central cross symbol as the focal point of the interface
- Windowed desktop environment with multiple functional panels
- Support for common audio formats (MP3, FLAC, WAV, OGG, M4A, AAC)
- Real-time audio visualization
- Keyboard shortcuts and command-line interface
- Drag-and-drop or file-picker loading of local audio
- Curated library with a clickable cover grid
- Terry Davis quotes and "God Says" random numbers

## Installation

```bash
npm install
```

## Usage

```bash
# Development server with hot reload
npm run dev

# Production build (outputs static files to dist/)
npm run build
```

After `npm run dev`, open http://localhost:8080.

## Loading Music

Files stay entirely in the browser — nothing is uploaded:

- Type `LOAD` or `OPEN` in the command line, or use the **FILE** menu / **F2** key, then pick audio files.
- Drag and drop audio files anywhere on the player.

## Curated Library (bundled covers + songs)

Ship your own curated library that users browse via a clickable cover grid
(open with the **LIBRARY** menu, **F4**, the `LIBRARY` command, or the MUSIC
desktop icon):

1. Drop an audio file into `library/songs/`, e.g. `Daft Punk - Aerodynamic.mp3`.
2. Drop a cover image into `library/covers/` with the **same base name**, e.g.
   `Daft Punk - Aerodynamic.jpg`.
3. Run `npm run gen-library` (or `npm run build`, which runs it automatically).

The filename is parsed as `Artist - Title`. For richer metadata, add a sidecar
`library/songs/Daft Punk - Aerodynamic.json`:
```json
{ "title": "Aerodynamic", "artist": "Daft Punk", "album": "Discovery" }
```
See `library/README.md` for full details.

## Controls

- **Space**: Play/Pause
- **Arrow Keys**: Previous/Next track
- **F1**: Help
- **F2**: Load files
- **F3**: Toggle quotes
- **F4**: Toggle library cover grid
- **F6**: Divine mode
- **Esc**: Close dialogs

## Commands

Type these commands in the command line at the bottom:

- `PLAY` / `PAUSE` - Control playback
- `NEXT` / `PREV` - Navigate tracks
- `VOLUME(0-100)` - Set volume level
- `LOAD` / `OPEN` - Open file picker
- `LIBRARY` - Toggle cover grid
- `GOD` - Get divine number
- `TERRY` - Honor Terry A. Davis
- `HELP` - Show help
- `CLEAR` - Clear console

## Deployment (Cloudflare Pages)

- **Build command:** `npm run build`
- **Build output directory:** `dist`

The `dist/` folder is fully static and can be hosted on any static host (Cloudflare Pages, Netlify, GitHub Pages, S3, etc.).

## Development

The project uses:
- TypeScript for type safety
- React for the user interface
- webpack for bundling
- Web Audio API for audio processing

### Project Structure

```
src/
├── renderer/          # React UI components
│   ├── components/    # File browser modal
│   └── styles/        # TempleOS-inspired styling
├── player/            # Audio playback controller
├── providers/         # Audio source providers
└── utils/             # Utility functions
```

## Tribute

> "An idiot admires complexity, a genius admires simplicity"
> - Terry A. Davis

This project maintains the sacred covenant of 640x480 16-color display as specified by Terry. The interface recreates the authentic TempleOS experience while serving as a functional music player.

## License

MIT License - Created in memory of Terry A. Davis and his divine vision of computing simplicity.
