import {
  MusicProvider,
  ProviderCapabilities,
  AuthState,
  Track,
  PlaybackSource,
  ProviderError
} from './types';

// A track as it appears in library/manifest.json (adds audioUrl to the base Track)
export interface LibraryTrack extends Track {
  audioUrl: string;
}

export interface LibraryManifest {
  generatedAt: string;
  trackCount: number;
  tracks: LibraryTrack[];
}

// Path (relative to the site root) where the generated manifest is served.
const MANIFEST_URL = 'library/manifest.json';

export class LibraryProvider implements MusicProvider {
  id = 'library';
  name = 'Library';

  private capabilities: ProviderCapabilities = {
    canLocalFiles: false,
    canSearch: false,
    canGetArtwork: true,
    canAuth: false,
    canStreamHttp: true,
    supportsHls: false,
    supportsHeaders: false,
    supportsDrm: false
  };

  private tracks: LibraryTrack[] = [];

  async initialize(): Promise<ProviderCapabilities> {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) {
        console.warn(`[LibraryProvider] no manifest at ${MANIFEST_URL} (${res.status})`);
        return this.capabilities;
      }
      const manifest: LibraryManifest = await res.json();
      this.tracks = (manifest.tracks || []).map(t => ({
        ...t,
        providerId: this.id
      }));
      console.log(`[LibraryProvider] loaded ${this.tracks.length} track(s)`);
    } catch (err) {
      console.warn('[LibraryProvider] failed to load manifest:', err);
    }
    return this.capabilities;
  }

  async shutdown(): Promise<void> {
    this.tracks = [];
  }

  getCapabilities(): ProviderCapabilities {
    return this.capabilities;
  }

  getAuthState(): AuthState {
    return { status: 'unauthenticated' };
  }

  getLibraryTracks(): Track[] {
    return this.tracks.map(t => ({ ...t }));
  }

  async getPlaybackSource(trackOrId: Track | string): Promise<PlaybackSource> {
    const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;

    if (!trackId.startsWith('library:')) {
      throw new ProviderError('not_supported', 'Track is not a library track');
    }

    const track = this.tracks.find(t => t.id === trackId);
    if (!track || !track.audioUrl) {
      throw new ProviderError('content_unavailable', 'Library track not found');
    }

    return {
      url: track.audioUrl,
      streamType: 'http'
    };
  }

  async getArtworkUrl(trackOrId: Track | string): Promise<string> {
    const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
    const track = this.tracks.find(t => t.id === trackId);
    if (!track || !track.artworkUrl) {
      throw new ProviderError('content_unavailable', 'No artwork for this track');
    }
    return track.artworkUrl;
  }
}
