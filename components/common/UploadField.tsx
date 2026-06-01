import {
  forwardRef,
  useCallback,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
} from 'react';

type UploadFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  hint?: string;
  /** Called with object URLs immediately after file selection, before base64 read completes. */
  onPreviewsChange?: (urls: string[]) => void;
};

/**
 * Real file upload field with image preview.
 *
 * Accepts image files via click or drag-and-drop. Shows preview thumbnails
 * immediately after selection. Reports the file name as a string value to
 * stay compatible with the existing form schema (mockApi expects imageName).
 *
 * When a real backend is connected, the stored File objects can be uploaded
 * via FormData alongside the rest of the post data.
 */
export const UploadField = forwardRef<HTMLInputElement, UploadFieldProps>(
  function UploadField(
    { hint = 'Kéo thả ảnh vào đây hoặc click để chọn', onChange, onPreviewsChange, ...props },
    ref,
  ) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Clean up object URLs on unmount
    const clearPreviews = useCallback(() => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      setPreviews([]);
    }, [previews]);

    const handleFiles = useCallback(
      (files: FileList) => {
        if (files.length === 0) return;

        const file = files[0];

        // Build preview URL immediately for instant visual feedback
        const previewUrl = URL.createObjectURL(file);
        clearPreviews();
        setPreviews([previewUrl]);

        // Report preview URLs upward so parent can sync preview panel
        onPreviewsChange?.([previewUrl]);

        // Immediately set a placeholder value so validation passes right away
        if (onChange) {
          const interimEvent = {
            target: { value: file.name, name: props.name },
          } as ChangeEvent<HTMLInputElement>;
          onChange(interimEvent);
        }

        // Read the actual image data as base64 for persistent storage
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          if (onChange) {
            const finalEvent = {
              target: { value: dataUrl, name: props.name },
            } as ChangeEvent<HTMLInputElement>;
            onChange(finalEvent);
          }
        };
        reader.onerror = () => {
          // If reading fails, keep the file-name fallback
        };
        reader.readAsDataURL(file);
      },
      [clearPreviews, onChange, onPreviewsChange, props.name],
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    };

    return (
      <div
        className={`upload${isDragging ? ' upload-dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Tải ảnh lên"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById(props.id ?? 'file-input')?.click();
          }
        }}
        onClick={() => {
          document.getElementById(props.id ?? 'file-input')?.click();
        }}
      >
        {previews.length > 0 ? (
          <div className="upload-previews">
            {previews.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`Ảnh ${i + 1}`}
                className="upload-preview-img"
              />
            ))}
            <p className="small muted">
              Click để chọn ảnh khác · {previews.length} ảnh đã chọn
            </p>
          </div>
        ) : (
          <>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ opacity: 0.45 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="small muted">{hint}</p>
            <p className="small muted" style={{ fontSize: 11 }}>
              Hỗ trợ JPG, PNG, WebP · Tối đa 5MB
            </p>
          </>
        )}

        <input
          ref={ref}
          id={props.id ?? 'file-input'}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="upload-input-hidden"
          tabIndex={-1}
        />
      </div>
    );
  },
);
