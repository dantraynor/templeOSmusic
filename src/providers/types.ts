// Core data models
export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumName: string;
  durationMs: number;
  artworkUrl?: string;
  explicit?: boolean;
  providerId: string;
}

export interface PlaybackSource {
  url: string;
  mime?: string;
  streamType: 'file' | 'http' | 'hls';
  headers?: Record<string, string>;
  drm?: {
    type: string;
    config: any;
  };
}

export interface SearchResult {
  tracks: Track[];
  nextCursor?: string;
}

export interface AuthState {
  status: 'unauthenticated' | 'authenticated' | 'error';
  userLabel?: string;
}

// Provider capabilities
export interface ProviderCapabilities {
  canLocalFiles: boolean;
  canSearch: boolean;
  canGetArtwork: boolean;
  canAuth: boolean;
  canStreamHttp: boolean;
  supportsHls: boolean;
  supportsHeaders: boolean;
  supportsDrm: boolean;
}

// Provider errors
export type ProviderErrorCode = 
  | 'auth_required'
  | 'content_unavailable'
  | 'not_supported'
  | 'network_error';

export class ProviderError extends Error {
  constructor(
    public code: ProviderErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

// Provider interface
export interface MusicProvider {
  id: string;
  name: string;
  
  initialize(): Promise<ProviderCapabilities>;
  shutdown(): Promise<void>;
  
   getCapabilities(): ProviderCapabilities;
   getAuthState(): AuthState;
   
   // Optional auth methods
   beginAuth?(): Promise<void>;
   endAuth?(): Promise<void>;
   
   // Content methods
   resolveFromFiles?(files: File[]): Promise<Track[]>;
   getPlaybackSource(trackOrId: Track | string): Promise<PlaybackSource>;
   
   // Optional curated library listing
   getLibraryTracks?(): Track[];
   
   // Optional search
   searchTracks?(query: string, cursor?: string): Promise<SearchResult>;
   
   // Optional artwork
   getArtworkUrl?(trackOrId: Track | string, size?: number): Promise<string>;
}

// Provider events
export interface ProviderEvents {
  authStateChanged: AuthState;
  providerError: {
    code: ProviderErrorCode;
    message: string;
  };
}