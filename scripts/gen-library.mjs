#!/usr/bin/env node
// Scans library/songs + library/covers and writes library/manifest.json.
// Pairing is by base filename: songs/foo.mp3 <-> covers/foo.{jpg,png,...}
// Optional sidecar songs/foo.json overrides {title,artist,album}.

import { readdir, readFile, writeFile, stat, access } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SONGS_DIR = join(ROOT, 'library', 'songs');
const COVERS_DIR = join(ROOT, 'library', 'covers');
const MANIFEST = join(ROOT, 'library', 'manifest.json');

const AUDIO_EXT = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readSidecar(baseName) {
  const sidecar = join(SONGS_DIR, baseName + '.json');
  if (!(await exists(sidecar))) return null;
  try {
    const data = await readFile(sidecar, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.warn(`  ! invalid sidecar ${baseName}.json: ${err.message}`);
    return null;
  }
}

function parseArtistTitle(fileName) {
  const name = basename(fileName, extname(fileName));
  const parts = name.split(' - ');
  if (parts.length > 1) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  }
  return { artist: 'Unknown Artist', title: name.trim() };
}

async function main() {
  if (!(await exists(SONGS_DIR))) {
    console.error('library/songs/ not found');
    process.exit(1);
  }

  let songFiles = [];
  try {
    songFiles = (await readdir(SONGS_DIR)).filter(f =>
      AUDIO_EXT.includes(extname(f).toLowerCase())
    );
  } catch (err) {
    console.error('Failed to read library/songs/:', err.message);
    process.exit(1);
  }

  let coverFiles = [];
  try {
    coverFiles = (await readdir(COVERS_DIR)).filter(f =>
      IMAGE_EXT.includes(extname(f).toLowerCase())
    );
  } catch {
    // covers dir optional
  }

  // index covers by base name
  const coverIndex = new Map();
  for (const c of coverFiles) {
    coverIndex.set(basename(c, extname(c)).toLowerCase(), c);
  }

  const tracks = [];
  for (const song of songFiles) {
    const baseName = basename(song, extname(song));
    const sidecar = await readSidecar(baseName);
    const parsed = parseArtistTitle(song);

    const matchedCover = coverIndex.get(baseName.toLowerCase());
    const coverPath = matchedCover ? `library/covers/${matchedCover}` : null;
    const audioPath = `library/songs/${song}`;

    tracks.push({
      id: `library:${baseName}`,
      title: (sidecar && sidecar.title) || parsed.title,
      artistName: (sidecar && sidecar.artist) || parsed.artist,
      albumName: (sidecar && sidecar.album) || 'Library',
      durationMs: 0,
      artworkUrl: coverPath,
      audioUrl: audioPath,
      providerId: 'library'
    });
  }

  tracks.sort((a, b) =>
    a.artistName.localeCompare(b.artistName) || a.title.localeCompare(b.title)
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    trackCount: tracks.length,
    tracks
  };

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote library/manifest.json: ${tracks.length} track(s)`);
  for (const t of tracks) {
    console.log(`  ${t.artistName} - ${t.title}${t.artworkUrl ? ' [cover]' : ' [no cover]'}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
