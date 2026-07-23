import { DragEvent, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { sanitizeImageUrl } from "../utils";
import { ImageLightbox } from "./common";

interface VisitImageFieldProps {
  image: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  uploading?: boolean;
}

export function VisitImageField({
  image,
  onFile,
  onRemove,
  uploading,
}: VisitImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const previewUrl = sanitizeImageUrl(image);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (uploading) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="form-group">
      <label>写真を追加</label>
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden-file-input"
        accept="image/*"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        disabled={uploading}
      />

      {previewUrl ? (
        <div className="image-dropzone image-dropzone--filled">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            className="sauna-img-preview"
            alt="アップロードした写真のプレビュー"
            onClick={() => setLightboxOpen(true)}
          />
          <div className="image-dropzone-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              変更
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm image-remove-btn"
              onClick={onRemove}
              disabled={uploading}
            >
              <X size={13} /> 削除
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-dropzone ${isDragOver ? "is-dragover" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!uploading) inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <ImagePlus size={22} />
          <span>クリックまたはドラッグ&ドロップで写真を追加</span>
        </div>
      )}

      {uploading && (
        <p className="form-hint form-hint--loading">
          <Loader2 size={13} className="spin-icon" /> 画像を圧縮しています…
        </p>
      )}

      <ImageLightbox
        src={lightboxOpen ? previewUrl ?? null : null}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
