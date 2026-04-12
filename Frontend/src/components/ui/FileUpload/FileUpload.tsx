import { type DragEvent, type ChangeEvent, useRef, useState, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export function FileUpload({
  accept = '.pdf,.doc,.docx',
  maxSizeMB = 50,
  multiple = false,
  onFilesSelected,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateAndSet = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const newFiles = Array.from(fileList);

      for (const file of newFiles) {
        if (file.size > maxSizeBytes) {
          setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
          return;
        }
      }

      const selected = multiple ? newFiles : [newFiles[0]];
      setFiles(selected);
      onFilesSelected(selected);
    },
    [maxSizeBytes, maxSizeMB, multiple, onFilesSelected],
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      validateAndSet(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      validateAndSet(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelected(updated);
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        className={cn(styles.dropzone, isDragging && styles.dragging)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload files"
      >
        <Upload size={24} className={styles.uploadIcon} />
        <p className={styles.dropText}>
          Drop files here or <span className={styles.browseLink}>browse</span>
        </p>
        <p className={styles.dropHint}>
          {accept.replace(/\./g, '').toUpperCase()} up to {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className={styles.hiddenInput}
          tabIndex={-1}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className={styles.fileItem}>
              <FileText size={16} />
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
              <button
                className={styles.removeButton}
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
