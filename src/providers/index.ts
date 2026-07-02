import { EventEmitter } from '../utils/EventEmitter';
import { MusicProvider, ProviderEvents, ProviderError, Track } from './types';
import { LocalFilesProvider } from './LocalFilesProvider';
import { TidalProvider } from './TidalProvider';
import { LibraryProvider } from './LibraryProvider';

export * from './types';

export class ProviderRegistry extends EventEmitter {
  private providers = new Map<string, MusicProvider>();
  private activeProvider: MusicProvider | null = null;
   
  constructor() {
    super();
    
    // Register built-in providers
    this.registerProvider(new LocalFilesProvider());
    this.registerProvider(new LibraryProvider());
    this.registerProvider(new TidalProvider());
  }
  
  registerProvider(provider: MusicProvider): void {
    this.providers.set(provider.id, provider);
  }
  
  async initialize(): Promise<void> {
    // Initialize all providers
    for (const provider of this.providers.values()) {
      await provider.initialize();
    }
    
    // Set default provider to local files
    this.activeProvider = this.providers.get('local') || null;
  }
  
  async shutdown(): Promise<void> {
    // Shutdown all providers
    for (const provider of this.providers.values()) {
      await provider.shutdown();
    }
  }
  
  getProvider(id: string): MusicProvider | undefined {
    return this.providers.get(id);
  }

  // Convenience: return the curated library track list (empty if unavailable)
  getLibraryTracks(): Track[] {
    const provider = this.providers.get('library');
    if (provider && provider.getLibraryTracks) {
      return provider.getLibraryTracks();
    }
    return [];
  }
  
  getActiveProvider(): MusicProvider {
    if (!this.activeProvider) {
      throw new Error('No active provider');
    }
    return this.activeProvider;
  }
  
  setActiveProvider(id: string): void {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} not found`);
    }
    this.activeProvider = provider;
  }
  
  getProviderForDescriptor(descriptor: string): MusicProvider {
    // Parse descriptor scheme (e.g., "local:/path/to/file" or "tidal:trackId")
    const colonIndex = descriptor.indexOf(':');
    if (colonIndex === -1) {
      // No scheme, assume local file path
      return this.providers.get('local')!;
    }
    
    const scheme = descriptor.substring(0, colonIndex);
    const provider = this.providers.get(scheme);
    
    if (!provider) {
      throw new Error(`No provider for scheme: ${scheme}`);
    }
    
    return provider;
  }
  
  // Event forwarding from providers
  emitAuthStateChanged(providerId: string, state: ProviderEvents['authStateChanged']): void {
    this.emit('authStateChanged', { providerId, state });
  }
  
  emitProviderError(providerId: string, error: ProviderEvents['providerError']): void {
    this.emit('providerError', { providerId, error });
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();