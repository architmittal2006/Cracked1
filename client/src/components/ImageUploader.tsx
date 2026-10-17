import React, { useState, useRef } from 'react';
import { X, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  maxSizeMB = 2,
  acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg'],
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG or JPG.');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    setError(null);
    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setUploading(false);
      onImageUpload(file);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group animate-scale-in">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-rose-500/90 hover:bg-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-emerald-500/90 px-3 py-1.5 rounded-full text-xs text-white font-medium shadow-lg">
            <Check className="w-3 h-3" />
            Uploaded
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-slate-900/50 transition-all duration-300 group"
        >
          {uploading ? (
            <div className="text-slate-400">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="relative inline-block mb-2">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300" />
              </div>
              <p className="text-sm text-slate-400 group-hover:text-white transition-colors duration-300">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG/JPG, max {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-rose-400 text-xs p-2 bg-rose-500/10 rounded border border-rose-500/20 flex items-center gap-2 animate-scale-in">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};
