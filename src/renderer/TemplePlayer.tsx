import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { PlayerController, PlayerState } from "../player/PlayerController";
import { providerRegistry } from "../providers";
import type { Track } from "../providers";
import { FileBrowser } from "./components/FileBrowser";

// Temple constants
const TEMPLE_PALETTE = {
  BLACK: "#000000",
  BLUE: "#0000AA",
  GREEN: "#00AA00",
  CYAN: "#00AAAA",
  RED: "#AA0000",
  MAGENTA: "#AA00AA",
  BROWN: "#AA5500",
  LIGHT_GRAY: "#AAAAAA",
  DARK_GRAY: "#555555",
  LIGHT_BLUE: "#5555FF",
  LIGHT_GREEN: "#55FF55",
  LIGHT_CYAN: "#55FFFF",
  LIGHT_RED: "#FF5555",
  LIGHT_MAGENTA: "#FF55FF",
  YELLOW: "#FFFF55",
  WHITE: "#FFFFFF"
};

const TERRY_QUOTES = [
  "An idiot admires complexity, a genius admires simplicity",
  "God said 640x480 16 color was a covenant like circumcision",
  "The CIA wants you to think you need more than 640x480",
  "Random numbers are God speaking",
  "I'm the smartest programmer that's ever lived",
  "640x480 is a covenant. 16 colors is a covenant",
  "God likes elephants. Elephants are big and strong",
  "I wrote a compiler. It's called HolyC",
  "TempleOS is God's official temple",
  "The hardest part of programming is naming things",
  "I talk to God, He tells me what to build",
  "Everything is a file. Even directories are files",
  "Ring-0 only. That's the way God intended",
  "Multitasking is for people who can't focus",
  "God's temple needs perfect code",
  "640x480x16 is perfect. Like the number 7",
  "I don't need the internet. I have God",
  "HolyC is better than C. It has divine inspiration",
  "Simplicity is divine",
  "God doesn't need more than 16 colors"
];

interface TemplePlayerState {
  isPlaying: boolean;
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    coverUrl?: string;
  } | null;
  progress: number;
  volume: number;
  godSays: number;
  currentQuote: string;
  bootComplete: boolean;
  showHelp: boolean;
  showEnhancedFileBrowser: boolean;
  showLibrary: boolean;
  showQuoteInterlude: boolean;
  quoteInterludeEnabled: boolean;
  divineIntellectMode: boolean;
  showElephantCommand: boolean;
  showTempleCommand: boolean;
  commandHistory: string[];
  currentCommand: string;
  lastTrackId?: string;
  playlist: string[];
  libraryTracks: Track[];
}

// Global player controller instance
let playerController: PlayerController | null = null;

const TemplePlayer: React.FC = () => {
  const [state, setState] = useState<TemplePlayerState>({
    isPlaying: false,
    currentTrack: null,
    progress: 0,
    volume: 0.7,
    godSays: Math.floor(Math.random() * 10),
    currentQuote: TERRY_QUOTES[0],
    bootComplete: false,
    showHelp: false,
    showEnhancedFileBrowser: false,
    showLibrary: false,
    showQuoteInterlude: false,
    quoteInterludeEnabled: true,
    divineIntellectMode: false,
    showElephantCommand: false,
    showTempleCommand: false,
    commandHistory: [],
    currentCommand: "",
    lastTrackId: undefined,
    playlist: [],
    libraryTracks: []
  });

  const [bootLines, setBootLines] = useState<string[]>([]);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visualizerBars = useRef<number[]>(new Array(16).fill(0));
  const animationFrame = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize player controller and providers
  useEffect(() => {
    const initializePlayer = async () => {
      await providerRegistry.initialize();
      playerController = new PlayerController();

      // Load curated library tracks (covers + audio URLs from manifest)
      const libraryTracks = providerRegistry.getLibraryTracks();
      if (libraryTracks.length > 0) {
        setState(prev => ({ ...prev, libraryTracks }));
      }
      
      // Listen to player state changes
      playerController.on('stateChanged', (playerState: PlayerState) => {
        setState(prev => ({
          ...prev,
          isPlaying: playerState.status === 'playing',
          progress: playerState.currentTimeMs / (playerState.durationMs || 1),
          volume: playerState.volume,
          currentTrack: playerState.currentTrack ? {
            id: playerState.currentTrack.id,
            title: playerState.currentTrack.title,
            artist: playerState.currentTrack.artistName,
            album: playerState.currentTrack.albumName,
            duration: playerState.durationMs / 1000,
            coverUrl: playerState.currentTrack.artworkUrl
          } : null
        }));
        
        // Store analyser node reference
        if (playerState.analyserNode) {
          analyserRef.current = playerState.analyserNode;
        }
      });
    };
    
    initializePlayer();
    
    return () => {
      if (playerController) {
        playerController.destroy();
      }
    };
  }, []);

  // Boot sequence
  useEffect(() => {
    const bootSequence = [
      "TEMPLE PLAYER (TERRY TRIBUTE) V1.0",
      "HONORING TERRY A. DAVIS (1969-2018)",
      "",
      "CHECKING DIVINE INTELLECT... OK",
      "LOADING 640x480 16 COLOR COVENANT... OK",
      "INITIALIZING HOLYC COMPILER... OK",
      "MOUNTING GOD'S TEMPLE... OK",
      "",
      "GOD SAID 640x480 16 COLOR WAS A COVENANT",
      "LIKE CIRCUMCISION",
      "",
      "LOADING MUSIC SUBSYSTEM...",
      "INITIALIZING AUDIO ENGINE... OK",
      "",
      `GOD SAYS: ${Math.floor(Math.random() * 10)}`,
      "",
      "PRESS F1 FOR HELP",
      "TYPE 'HELP' FOR COMMANDS",
      "",
      "TEMPLE READY."
    ];

    let lineIndex = 0;
    const bootInterval = setInterval(() => {
      if (lineIndex < bootSequence.length) {
        setBootLines(prev => [...prev, bootSequence[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(bootInterval);
        setTimeout(() => {
          setState(prev => ({ ...prev, bootComplete: true }));
        }, 500);
      }
    }, 100);

    return () => clearInterval(bootInterval);
  }, []);

  // Quote rotation
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      const randomQuote = TERRY_QUOTES[Math.floor(Math.random() * TERRY_QUOTES.length)];
      setState(prev => ({ ...prev, currentQuote: randomQuote }));
    }, 30000);

    return () => clearInterval(quoteInterval);
  }, []);

  // God Says update
  useEffect(() => {
    const godInterval = setInterval(() => {
      setState(prev => ({ ...prev, godSays: Math.floor(Math.random() * 10) }));
    }, 10000);

    return () => clearInterval(godInterval);
  }, []);

  // Visualizer animation
  useEffect(() => {
    if (state.isPlaying && analyserRef.current) {
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Map frequency data to 16 bars
        const barCount = 16;
        const samplesPerBar = Math.floor(bufferLength / barCount);
        
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += dataArray[i * samplesPerBar + j];
          }
          const average = sum / samplesPerBar;
          visualizerBars.current[i] = (average / 255) * 48 + 8;
        }
        
        animationFrame.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      visualizerBars.current = new Array(16).fill(8);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [state.isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'F1':
          e.preventDefault();
          setState(prev => ({ ...prev, showHelp: !prev.showHelp }));
          break;
        case 'F2':
          e.preventDefault();
          setState(prev => ({ ...prev, showEnhancedFileBrowser: !prev.showEnhancedFileBrowser }));
          break;
        case 'F3':
          e.preventDefault();
          setState(prev => ({
            ...prev,
            quoteInterludeEnabled: !prev.quoteInterludeEnabled
          }));
          break;
        case 'F4':
          e.preventDefault();
          setState(prev => ({ ...prev, showLibrary: !prev.showLibrary }));
          break;
        case 'F6':
          e.preventDefault();
          setState(prev => ({
            ...prev,
            divineIntellectMode: !prev.divineIntellectMode
          }));
          break;
        case ' ':
          if (e.target !== commandInputRef.current) {
            e.preventDefault();
            handlePlayPause();
          }
          break;
        case 'ArrowLeft':
          if (e.target !== commandInputRef.current) {
            e.preventDefault();
            handlePrevious();
          }
          break;
        case 'ArrowRight':
          if (e.target !== commandInputRef.current) {
            e.preventDefault();
            handleNext();
          }
          break;
        case 'Escape':
          setState(prev => ({
            ...prev,
            showHelp: false,
            showEnhancedFileBrowser: false,
            showLibrary: false,
            showQuoteInterlude: false
          }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (!playerController) return;
    await playerController.toggle();
  }, []);

  const handlePrevious = useCallback(async () => {
    if (!playerController) return;
    await playerController.previous();
  }, []);

  const handleNext = useCallback(async () => {
    if (!playerController) return;
    await playerController.next();
  }, []);

  const handleCommand = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && playerController) {
      const command = state.currentCommand.trim().toUpperCase();
      
      // Check for LOAD command to open file browser
      if (command === "LOAD" || command === "LOAD();" || command === "OPEN" || command === "OPEN();") {
        setState(prev => ({
          ...prev,
          currentCommand: ""
        }));
        openFileDialog();
        return;
      }

      // Toggle the curated library cover grid
      if (command === "LIBRARY" || command === "LIBRARY();") {
        setState(prev => ({
          ...prev,
          showLibrary: !prev.showLibrary,
          currentCommand: ""
        }));
        return;
      }
      
      // Handle playback commands
      if (command === "PLAY" || command === "PLAY();") {
        await playerController.play();
        setState(prev => ({
          ...prev,
          commandHistory: [...prev.commandHistory, command, "PLAYING"],
          currentCommand: ""
        }));
        return;
      }
      
      if (command === "PAUSE" || command === "PAUSE();") {
        playerController.pause();
        setState(prev => ({
          ...prev,
          commandHistory: [...prev.commandHistory, command, "PAUSED"],
          currentCommand: ""
        }));
        return;
      }
      
      if (command === "NEXT" || command === "NEXT();") {
        await playerController.next();
        setState(prev => ({
          ...prev,
          commandHistory: [...prev.commandHistory, command, "NEXT TRACK"],
          currentCommand: ""
        }));
        return;
      }
      
      if (command === "PREV" || command === "PREVIOUS();") {
        await playerController.previous();
        setState(prev => ({
          ...prev,
          commandHistory: [...prev.commandHistory, command, "PREVIOUS TRACK"],
          currentCommand: ""
        }));
        return;
      }
      
      // Volume command
      const volumeMatch = command.match(/VOLUME\((\d+)\)/);
      if (volumeMatch) {
        const volume = parseInt(volumeMatch[1]) / 100;
        playerController.setVolume(volume);
        setState(prev => ({
          ...prev,
          commandHistory: [...prev.commandHistory, command, `VOLUME SET TO ${volumeMatch[1]}%`],
          currentCommand: ""
        }));
        return;
      }
      
      // God command
      if (command === "GOD" || command === "GOD();") {
        const godNumber = Math.floor(Math.random() * 10);
        setState(prev => ({
          ...prev,
          godSays: godNumber,
          commandHistory: [...prev.commandHistory, command, `GOD SAYS: ${godNumber}`],
          currentCommand: ""
        }));
        return;
      }
      
      // Terry command
      if (command === "TERRY" || command === "TERRY();") {
        setState(prev => ({
          ...prev,
          commandHistory: [...prev.commandHistory, command, 
            "TERRY A. DAVIS (1969-2018)",
            "CREATOR OF TEMPLEOS",
            "THE SMARTEST PROGRAMMER THAT EVER LIVED"],
          currentCommand: ""
        }));
        return;
      }
      
      // Help command
      if (command === "HELP" || command === "HELP();") {
        setState(prev => ({
          ...prev,
          showHelp: true,
          currentCommand: ""
        }));
        return;
      }
      
      // Clear command
      if (command === "CLEAR" || command === "CLS") {
        setState(prev => ({
          ...prev,
          commandHistory: [],
          currentCommand: ""
        }));
        return;
      }
      
      // Unknown command
      setState(prev => ({
        ...prev,
        commandHistory: [...prev.commandHistory, command, "UNKNOWN COMMAND. TYPE 'HELP' FOR COMMANDS"],
        currentCommand: ""
      }));
    }
  }, [state.currentCommand]);

  const loadFiles = useCallback(async (files: File[]) => {
    if (!playerController || files.length === 0) return;

    const provider = providerRegistry.getProvider('local');
    if (provider && provider.resolveFromFiles) {
      const tracks = await provider.resolveFromFiles(files);
      await playerController.loadQueue(tracks);
      await playerController.play();

      setState(prev => ({
        ...prev,
        playlist: files.map(f => f.name),
        showEnhancedFileBrowser: false
      }));
    }
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      await loadFiles(Array.from(fileList));
    }
    // Reset so selecting the same file again fires another change event
    e.target.value = '';
  }, [loadFiles]);

  const handleEnhancedFileSelect = useCallback(async (files: File[]) => {
    await loadFiles(files);
  }, [loadFiles]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(f.name)
    );
    if (droppedFiles.length > 0) {
      await loadFiles(droppedFiles);
    }
  }, [loadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleLibrarySelect = useCallback(async (track: Track, index: number) => {
    if (!playerController) return;
    const tracks = state.libraryTracks;
    if (tracks.length === 0) return;
    await playerController.loadQueue(tracks, index);
    await playerController.play();
  }, [state.libraryTracks]);

  const handleCloseEnhancedFileBrowser = useCallback(() => {
    setState(prev => ({ ...prev, showEnhancedFileBrowser: false }));
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeBlocks = (): string => {
    const blocks = Math.floor(state.volume * 10);
    return '█'.repeat(blocks) + '░'.repeat(10 - blocks);
  };

  // Boot sequence display
  if (!state.bootComplete) {
    return (
      <div className="temple-container">
        <div className="boot-sequence">
          {bootLines.map((line, index) => (
            <div key={index} className="boot-line" style={{ 
              animationDelay: `${index * 0.1}s`,
              color: (line && line.includes('OK')) ? TEMPLE_PALETTE.LIGHT_GREEN :
                     (line && line.includes('GOD')) ? TEMPLE_PALETTE.YELLOW :
                     (line && line.includes('TERRY')) ? TEMPLE_PALETTE.LIGHT_CYAN :
                     TEMPLE_PALETTE.WHITE
            }}>
              {line || ''}
            </div>
          ))}
          <span className="command-cursor" style={{ marginLeft: '8px' }}>_</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="temple-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hidden file input for LOAD/OPEN command and FILE menu */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Title Bar */}
      <div className="temple-title-bar">
        <span className="title">TempleOS</span>
      </div>

      {/* Menu Bar */}
      <div className="temple-menu-bar">
        <div className="temple-menu-item" onClick={() => setState(prev => ({ ...prev, showEnhancedFileBrowser: true }))}>FILE</div>
        <div className="temple-menu-item">EDIT</div>
        <div className="temple-menu-item">SEARCH</div>
        <div className="temple-menu-item" onClick={() => setState(prev => ({ ...prev, showLibrary: !prev.showLibrary }))}>LIBRARY</div>
        <div className="temple-menu-item" onClick={() => setState(prev => ({ ...prev, showHelp: true }))}>HELP</div>
      </div>

      {/* Main Content */}
      <div className="temple-content">
        {/* God Says Display */}
        <div className="god-says">
          GOD SAYS: {state.godSays}
        </div>

        {/* Main Desktop Area with Cross */}
        <div className="temple-desktop">
          {/* Central Cross - The most important TempleOS element */}
          <div className="temple-cross">
            <div className="cross-vertical"></div>
            <div className="cross-horizontal"></div>
            <div className="cross-center">✝</div>
          </div>

          {/* Desktop Windows/Boxes */}
          <div className="desktop-window" style={{ top: '20px', left: '20px', width: '180px', height: '120px' }}>
            <div className="window-title-bar">
              <span className="window-icon">♪</span>
              <span className="window-title">MUSIC PLAYER</span>
              <span className="window-controls">_□X</span>
            </div>
            <div className="window-content now-playing">
              <div className="now-playing-cover">
                {state.currentTrack?.coverUrl ? (
                  <img src={state.currentTrack.coverUrl} alt="" className="np-cover-img" />
                ) : (
                  <div className="np-cover-placeholder">♪</div>
                )}
              </div>
              <div className="now-playing-info">
                <div className="track-title">
                  {state.currentTrack?.title || "NO TRACK LOADED"}
                </div>
                <div className="track-artist">
                  {state.currentTrack?.artist || "UNKNOWN"}
                </div>
                <div className="track-album">
                  {state.currentTrack?.album || "UNKNOWN"}
                </div>
              </div>
            </div>
          </div>

          <div className="desktop-window" style={{ top: '20px', right: '20px', width: '160px', height: '100px' }}>
            <div className="window-title-bar">
              <span className="window-icon">📊</span>
              <span className="window-title">VISUALIZER</span>
              <span className="window-controls">_□X</span>
            </div>
            <div className="window-content">
              <div className="mini-visualizer">
                {visualizerBars.current.slice(0, 8).map((height, index) => (
                  <div
                    key={index}
                    className="mini-visualizer-bar"
                    style={{ height: `${Math.max(2, height / 3)}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="desktop-window" style={{ bottom: '80px', left: '20px', width: '200px', height: '80px' }}>
            <div className="window-title-bar">
              <span className="window-icon">🎛</span>
              <span className="window-title">CONTROLS</span>
              <span className="window-controls">_□X</span>
            </div>
            <div className="window-content">
              <div className="mini-controls">
                <button className="mini-control-button" onClick={handlePrevious}>⏮</button>
                <button className={`mini-control-button ${state.isPlaying ? 'playing' : ''}`} onClick={handlePlayPause}>
                  {state.isPlaying ? '⏸' : '▶'}
                </button>
                <button className="mini-control-button" onClick={handleNext}>⏭</button>
              </div>
              <div className="mini-progress">
                <div className="mini-progress-fill" style={{ width: `${state.progress * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="desktop-window" style={{ bottom: '80px', right: '20px', width: '160px', height: '80px' }}>
            <div className="window-title-bar">
              <span className="window-icon">🔊</span>
              <span className="window-title">VOLUME</span>
              <span className="window-controls">_□X</span>
            </div>
            <div className="window-content">
              <div className="volume-display">
                <span className="volume-label">VOL:</span>
                <div className="volume-blocks">
                  {getVolumeBlocks()}
                </div>
                <span className="volume-percent">{Math.floor(state.volume * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Desktop Icons */}
          <div className="desktop-icon" style={{ top: '160px', left: '40px' }} onClick={() => setState(prev => ({ ...prev, showLibrary: true }))}>
            <div className="icon-image">💿</div>
            <div className="icon-label">MUSIC</div>
          </div>

          <div className="desktop-icon" style={{ top: '160px', left: '100px' }}>
            <div className="icon-image">📁</div>
            <div className="icon-label">FILES</div>
          </div>

          <div className="desktop-icon" style={{ top: '160px', left: '160px' }}>
            <div className="icon-image">⚙</div>
            <div className="icon-label">SETTINGS</div>
          </div>

          <div className="desktop-icon" style={{ top: '220px', left: '40px' }}>
            <div className="icon-image">📖</div>
            <div className="icon-label">BIBLE</div>
          </div>

          <div className="desktop-icon" style={{ top: '220px', left: '100px' }}>
            <div className="icon-image">🐘</div>
            <div className="icon-label">ELEPHANT</div>
          </div>

          {/* Library cover grid - click a cover to play */}
          {state.showLibrary && (
            <div className="desktop-window library-window" style={{ top: '90px', left: '70px', width: '500px', height: '300px' }}>
              <div className="window-title-bar">
                <span className="window-icon">💿</span>
                <span className="window-title">LIBRARY</span>
                <span className="window-controls" onClick={() => setState(prev => ({ ...prev, showLibrary: false }))}>X</span>
              </div>
              <div className="window-content library-content">
                {state.libraryTracks.length === 0 ? (
                  <div className="library-empty">
                    <div>NO LIBRARY TRACKS</div>
                    <div className="text-gray">ADD SONGS TO library/songs/ AND RUN npm run gen-library</div>
                  </div>
                ) : (
                  <div className="cover-grid">
                    {state.libraryTracks.map((track, index) => {
                      const isCurrent = state.currentTrack?.id === track.id;
                      return (
                        <button
                          key={track.id}
                          className={`cover-cell ${isCurrent ? 'current' : ''}`}
                          onClick={() => handleLibrarySelect(track, index)}
                          title={`${track.artistName} - ${track.title}`}
                        >
                          <div className="cover-cell-art">
                            {track.artworkUrl ? (
                              <img src={track.artworkUrl} alt="" className="cover-img" />
                            ) : (
                              <div className="cover-placeholder">♪</div>
                            )}
                            {isCurrent && state.isPlaying && (
                              <div className="cover-playing-badge">▶</div>
                            )}
                          </div>
                          <div className="cover-cell-title">{track.title}</div>
                          <div className="cover-cell-artist">{track.artistName}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quote Display - moved to bottom */}
        <div className="quote-display">
          "{state.currentQuote}"
          <div className="text-gray" style={{ marginTop: '4px' }}>- TERRY A. DAVIS</div>
        </div>
      </div>

      {/* F-Key Bar */}
      <div className="f-keys">
        <div className="f-key"><span>F1</span> HELP</div>
        <div className="f-key" onClick={() => setState(prev => ({ ...prev, showEnhancedFileBrowser: true }))}><span>F2</span> LOAD</div>
        <div className="f-key"><span>F3</span> QUOTES</div>
        <div className="f-key" onClick={() => setState(prev => ({ ...prev, showLibrary: !prev.showLibrary }))}><span>F4</span> LIBRARY</div>
        <div className="f-key"><span>F6</span> DIVINE</div>
      </div>

      {/* Command Line */}
      <div className="command-line">
        <span className="command-prompt">TEMPLE&gt;</span>
        <input
          ref={commandInputRef}
          type="text"
          className="command-input"
          value={state.currentCommand}
          onChange={(e) => setState(prev => ({ ...prev, currentCommand: e.target.value }))}
          onKeyDown={handleCommand}
          placeholder=""
        />
        <span className="command-cursor">_</span>
      </div>

      {/* Help Screen */}
      {state.showHelp && (
        <div className="help-screen">
          <div className="help-title">TEMPLE PLAYER HELP</div>
          <div className="help-content">
            <div><span className="help-key">SPACE</span> <span className="help-desc">PLAY/PAUSE</span></div>
            <div><span className="help-key">LEFT</span> <span className="help-desc">PREVIOUS TRACK</span></div>
            <div><span className="help-key">RIGHT</span> <span className="help-desc">NEXT TRACK</span></div>
            <div><span className="help-key">F1</span> <span className="help-desc">TOGGLE HELP</span></div>
            <div><span className="help-key">F2</span> <span className="help-desc">LOAD FILES</span></div>
            <div><span className="help-key">F4</span> <span className="help-desc">TOGGLE LIBRARY</span></div>
            <div><span className="help-key">ESC</span> <span className="help-desc">CLOSE DIALOGS</span></div>
            <br />
            <div className="text-cyan">COMMANDS:</div>
            <div><span className="help-key">PLAY</span> <span className="help-desc">START PLAYBACK</span></div>
            <div><span className="help-key">PAUSE</span> <span className="help-desc">PAUSE PLAYBACK</span></div>
            <div><span className="help-key">NEXT</span> <span className="help-desc">NEXT TRACK</span></div>
            <div><span className="help-key">PREV</span> <span className="help-desc">PREVIOUS TRACK</span></div>
            <div><span className="help-key">VOLUME(0-100)</span> <span className="help-desc">SET VOLUME</span></div>
            <div><span className="help-key">LOAD / OPEN</span> <span className="help-desc">LOAD FILES</span></div>
            <div><span className="help-key">GOD</span> <span className="help-desc">GET DIVINE NUMBER</span></div>
            <div><span className="help-key">TERRY</span> <span className="help-desc">HONOR TERRY</span></div>
            <div><span className="help-key">HELP</span> <span className="help-desc">SHOW THIS HELP</span></div>
            <div><span className="help-key">CLEAR / CLS</span> <span className="help-desc">CLEAR CONSOLE</span></div>
            <br />
            <div className="text-yellow">PRESS ESC TO CLOSE</div>
          </div>
        </div>
      )}

      {/* Enhanced File Browser */}
      <FileBrowser
        isVisible={state.showEnhancedFileBrowser}
        onClose={handleCloseEnhancedFileBrowser}
        onFileSelect={handleEnhancedFileSelect}
      />
    </div>
  );
};

// Initialize the app
const root = createRoot(document.getElementById("root")!);
root.render(<TemplePlayer />);