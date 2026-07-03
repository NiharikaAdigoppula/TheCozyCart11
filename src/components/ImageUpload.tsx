import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, X, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';

interface ImageUploadProps {
  id?: string;
  label: string;
  value: string | string[]; // Can be a single string (URL/Base64) or an array of strings
  onChange: (value: any) => void;
  multiple?: boolean;
}

export function ImageUpload({ id, label, value, onChange, multiple = false }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize current values to an array for easier rendering
  const images: string[] = multiple 
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (typeof value === 'string' && value ? [value] : []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (multiple) {
        // Append to existing array of images
        const currentList = Array.isArray(value) ? value : (value ? [value] : []);
        onChange([...currentList, base64Data]);
      } else {
        // Set single image
        onChange(base64Data);
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (files: FileList) => {
    if (multiple) {
      // Process multiple files
      setIsLoading(true);
      let loadedCount = 0;
      const newImages: string[] = [];
      const currentList = Array.isArray(value) ? value : (value ? [value] : []);

      const processNext = (index: number) => {
        if (index >= files.length) {
          onChange([...currentList, ...newImages]);
          setIsLoading(false);
          return;
        }

        const file = files[index];
        if (!file.type.startsWith('image/')) {
          processNext(index + 1);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target?.result as string);
          processNext(index + 1);
        };
        reader.onerror = () => {
          processNext(index + 1);
        };
        reader.readAsDataURL(file);
      };

      processNext(0);
    } else {
      // Single file mode
      if (files.length > 0) {
        handleFile(files[0]);
      }
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (indexToRemove: number) => {
    if (multiple) {
      const currentList = Array.isArray(value) ? value : [];
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-2 w-full" id={id}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#4A443F]">{label}</label>
        {multiple && images.length > 0 && (
          <span className="text-[9px] font-semibold text-[#D5BDAF] uppercase bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E3D5CA]/30">
            {images.length} Image{images.length > 1 ? 's' : ''} Uploaded
          </span>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerSelect}
        className={`relative overflow-hidden cursor-pointer border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
          isDragging 
            ? 'border-[#D5BDAF] bg-[#FAF7F2] scale-[0.99]' 
            : 'border-[#E3D5CA]/60 bg-white hover:border-[#D5BDAF]/80 hover:bg-[#FAF7F2]/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          accept="image/*"
          multiple={multiple}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="w-8 h-8 text-[#D5BDAF] animate-spin" />
            <p className="text-xs text-[#7A736E] font-medium">Encoding local file contents...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] flex items-center justify-center text-[#7A736E] border border-[#E3D5CA]/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#2D2926]">
                Drag and drop image here, or <span className="text-[#D5BDAF] hover:underline">browse</span>
              </p>
              <p className="text-[10px] text-[#7A736E]">Supports JPG, PNG, WEBP, and GIF up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="group relative aspect-video rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E3D5CA]/30 shadow-sm"
            >
              <img 
                src={img} 
                alt={`${label} Preview ${idx + 1}`} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
                  title="Remove Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="absolute bottom-1 left-1.5 text-[8px] font-mono bg-white/90 text-[#4A443F] px-1.5 py-0.5 rounded border border-[#E3D5CA]/30">
                {img.startsWith('data:image/') ? 'Local File' : 'External'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Direct URL Text Input Backup */}
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-[#7A736E] uppercase block">Or edit / paste direct URL manually:</span>
        <input 
          type="text"
          placeholder="Paste external image URL (optional)"
          value={multiple ? (Array.isArray(value) ? value.join(', ') : '') : (typeof value === 'string' ? value : '')}
          onChange={(e) => {
            const val = e.target.value;
            if (multiple) {
              const list = val.split(',').map(s => s.trim()).filter(Boolean);
              onChange(list);
            } else {
              onChange(val);
            }
          }}
          className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-[10px] font-mono text-[#4A443F] focus:outline-none focus:border-[#D5BDAF]"
        />
      </div>
    </div>
  );
}
