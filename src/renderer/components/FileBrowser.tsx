import React, { useRef, useCallback, useState } from 'react';

interface FileBrowserProps {
  isVisible: boolean;
  onClose: () => void;
  onFileSelect: (files: File[]) => void;
}

const ACCEPT = 'audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac';

function isAudioFile(file: File): boolean {
  if (file.type.startsWith('audio/')) return true;
  return /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name);
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  isVisible,
  onClose,
  onFileSelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const audioFiles = Array.from(files).filter(isAudioFile);
    if (audioFiles.length === 0) {
      setError('NO AUDIO FILES DETECTED');
      return;
    }
    setError(null);
    onFileSelect(audioFiles);
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [isVisible, onClose]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isVisible) return null;

  return (
    <div className="file-browser-overlay" onClick={onClose}>
      <div className="file-browser" onClick={(e) => e.stopPropagation()}>
        <div className="file-browser-header">
          <div className="file-browser-title">TEMPLE FILE BROWSER</div>
          <div className="file-browser-path">DROP AUDIO FILES OR BROWSE</div>
        </div>

        <div className="file-browser-content">
          <div
            className={`file-drop-zone ${isDragActive ? 'drag-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="file-drop-icon">🎵</div>
            <div className="file-drop-text">
              {isDragActive ? 'DROP TO LOAD' : 'CLICK TO BROWSE OR DROP FILES'}
            </div>
            <div className="file-drop-hint text-gray">
              MP3 · WAV · OGG · FLAC · M4A · AAC
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <div className="selection-info">
              <span className="text-yellow">{error}</span>
            </div>
          )}
        </div>

        <div className="file-browser-footer">
          <div className="text-gray">
            "SIMPLICITY IS DIVINE" - TERRY A. DAVIS
          </div>
        </div>
      </div>
    </div>
  );
};
