import {
  MusicProvider,
  ProviderCapabilities,
  AuthState,
  Track,
  PlaybackSource,
  ProviderError
} from './types';

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

function parseFileName(fileName: string): { name: string; ext: string } {
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
  return { name, ext };
}

export class LocalFilesProvider implements MusicProvider {
  id = 'local';
  name = 'Local Files';

  private capabilities: ProviderCapabilities = {
    canLocalFiles: true,
    canSearch: false,
    canGetArtwork: false,
    canAuth: false,
    canStreamHttp: false,
    supportsHls: false,
    supportsHeaders: false,
    supportsDrm: false
  };

  // Map of trackId -> File object so we can build blob URLs on demand
  private fileCache = new Map<string, File>();
  // Map of trackId -> blob URL so we can revoke when appropriate
  private urlCache = new Map<string, string>();

  async initialize(): Promise<ProviderCapabilities> {
    return this.capabilities;
  }

  async shutdown(): Promise<void> {
    this.revokeAll();
  }

  getCapabilities(): ProviderCapabilities {
    return this.capabilities;
  }

  getAuthState(): AuthState {
    return { status: 'unauthenticated' };
  }

  async resolveFromFiles(files: File[]): Promise<Track[]> {
    return files.map((file) => {
      const { name: nameWithoutExt, ext } = parseFileName(file.name);
      const isAudio = AUDIO_EXTENSIONS.includes(ext);

      const parts = nameWithoutExt.split(' - ');
      const artist = parts.length > 1 ? parts[0] : 'Unknown Artist';
      const title = parts.length > 1 ? parts.slice(1).join(' - ') : nameWithoutExt;

      const id = `local:${file.name}:${file.size}:${file.lastModified}`;

      this.fileCache.set(id, file);

      return {
        id,
        title: isAudio ? title : nameWithoutExt,
        artistName: artist,
        albumName: 'Local Files',
        durationMs: 0,
        providerId: this.id
      };
    });
  }

  async getPlaybackSource(trackOrId: Track | string): Promise<PlaybackSource> {
    const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;

    if (!trackId.startsWith('local:')) {
      throw new ProviderError('not_supported', 'Track is not a local file');
    }

    const file = this.fileCache.get(trackId);
    if (!file) {
      throw new ProviderError('not_supported', 'No File object bound to this track');
    }

    // Reuse an existing blob URL if we already created one
    let url = this.urlCache.get(trackId);
    if (!url) {
      url = URL.createObjectURL(file);
      this.urlCache.set(trackId, url);
    }

    return {
      url,
      streamType: 'file'
    };
  }

  revoke(trackId: string): void {
    const url = this.urlCache.get(trackId);
    if (url) {
      URL.revokeObjectURL(url);
      this.urlCache.delete(trackId);
    }
  }

  revokeAll(): void {
    for (const url of this.urlCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.urlCache.clear();
    this.fileCache.clear();
  }
}
