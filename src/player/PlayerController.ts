import { EventEmitter } from '../utils/EventEmitter';
import { Track, PlaybackSource } from '../providers/types';
import { providerRegistry } from '../providers';

export interface PlayerState {
  status: 'playing' | 'paused' | 'stopped';
  currentTimeMs: number;
  durationMs: number;
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  volume: number;
  muted: boolean;
  analyserNode: AnalyserNode | null;
}

export class PlayerController extends EventEmitter {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentBlobUrl: string | null = null;
  
  private state: PlayerState = {
    status: 'stopped',
    currentTimeMs: 0,
    durationMs: 0,
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    volume: 0.7,
    muted: false,
    analyserNode: null
  };
  
  constructor() {
    super();
    
    // Create audio element
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    
    // Set up audio event listeners
    this.audio.addEventListener('play', () => this.updateState({ status: 'playing' }));
    this.audio.addEventListener('pause', () => this.updateState({ status: 'paused' }));
    this.audio.addEventListener('ended', () => this.handleTrackEnded());
    this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audio.addEventListener('loadedmetadata', () => this.handleMetadataLoaded());
    this.audio.addEventListener('error', (e) => this.handleError(e));
    
    // Set initial volume
    this.audio.volume = this.state.volume;
  }
  
  private initializeAudioContext(): void {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
    this.analyserNode = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    
    // Configure analyser for visualizer
    this.analyserNode.fftSize = 32; // 16 bars for ASCII visualizer
    this.analyserNode.smoothingTimeConstant = 0.8;
    
    // Connect nodes
    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    // Update state with analyser
    this.updateState({ analyserNode: this.analyserNode });
  }
  
  private updateState(partial: Partial<PlayerState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('stateChanged', this.state);
  }
  
  private handleTimeUpdate(): void {
    this.updateState({
      currentTimeMs: this.audio.currentTime * 1000
    });
  }
  
  private handleMetadataLoaded(): void {
    this.updateState({
      durationMs: this.audio.duration * 1000
    });
  }
  
  private handleTrackEnded(): void {
    this.next();
  }
  
  private handleError(error: Event): void {
    console.error('Audio playback error:', error);
    this.updateState({ status: 'stopped' });
    this.emit('error', { type: 'playback', error });
  }
  
  async loadQueue(tracks: Track[], startIndex: number = 0): Promise<void> {
    const safeIndex = tracks.length === 0
      ? -1
      : Math.max(0, Math.min(startIndex, tracks.length - 1));

    this.updateState({
      queue: tracks,
      queueIndex: safeIndex
    });

    if (tracks.length > 0) {
      await this.loadTrack(safeIndex);
    }
  }
  
  private async loadTrack(index: number): Promise<void> {
    if (index < 0 || index >= this.state.queue.length) {
      return;
    }
    
    const track = this.state.queue[index];
    this.updateState({
      currentTrack: track,
      queueIndex: index,
      currentTimeMs: 0
    });
    
    try {
      // Get playback source from provider
      const provider = providerRegistry.getProviderForDescriptor(track.id);
      const source = await provider.getPlaybackSource(track);

      // Revoke the previous blob URL (if any) before loading a new track
      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
        this.currentBlobUrl = null;
      }

      // Load audio
      this.audio.src = source.url;
      this.audio.load();

      // Track blob URLs so we can revoke them later (memory hygiene)
      if (source.url.startsWith('blob:')) {
        this.currentBlobUrl = source.url;
      }

      // Initialize audio context on first play
      if (!this.audioContext) {
        this.initializeAudioContext();
      }
    } catch (error) {
      console.error('Failed to load track:', error);
      this.emit('error', { type: 'load', error });
    }
  }
  
  async play(): Promise<void> {
    if (this.state.status === 'playing') return;

    try {
      // Browsers suspend AudioContext until a user gesture occurs; resume it
      // here so playback + the visualizer analyser work under autoplay policy.
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      await this.audio.play();
    } catch (error) {
      console.error('Failed to play:', error);
      this.emit('error', { type: 'play', error });
    }
  }
  
  pause(): void {
    this.audio.pause();
  }
  
  async toggle(): Promise<void> {
    if (this.state.status === 'playing') {
      this.pause();
    } else {
      await this.play();
    }
  }
  
  async next(): Promise<void> {
    const nextIndex = this.state.queueIndex + 1;
    if (nextIndex < this.state.queue.length) {
      await this.loadTrack(nextIndex);
      await this.play();
    } else {
      // End of queue
      this.updateState({ status: 'stopped' });
    }
  }
  
  async previous(): Promise<void> {
    // If more than 3 seconds into track, restart it
    if (this.state.currentTimeMs > 3000) {
      this.seek(0);
      return;
    }
    
    // Otherwise go to previous track
    const prevIndex = this.state.queueIndex - 1;
    if (prevIndex >= 0) {
      await this.loadTrack(prevIndex);
      await this.play();
    }
  }
  
  seek(timeMs: number): void {
    this.audio.currentTime = timeMs / 1000;
  }
  
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.audio.volume = clampedVolume;
    this.updateState({ volume: clampedVolume });
  }
  
  setMuted(muted: boolean): void {
    this.audio.muted = muted;
    this.updateState({ muted });
  }
  
  getState(): PlayerState {
    return { ...this.state };
  }
  
  destroy(): void {
    this.audio.pause();
    this.audio.src = '';

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.removeAllListeners();
  }
}