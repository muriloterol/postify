'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, FileImage, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FileUploaderProps {
  projectId: string;
  onUploadComplete: (url: string, name: string, size: number) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

export function FileUploader({
  projectId,
  onUploadComplete,
  allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  maxSizeMB = 5,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleUpload = async (file: File) => {
    setError(null);

    // Validate type
    if (allowedTypes.length && !allowedTypes.includes(file.type)) {
      setError('Formato de arquivo não suportado. Use JPG, PNG ou WebP.');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo excede o limite de ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      // 1. Try uploading to Supabase Storage
      const cleanFileName = file.name.replace(/[^\x00-\x7F]/g, ''); // Remove non-ascii
      const path = `${projectId}/${Date.now()}_${cleanFileName}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('postify-assets')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Supabase storage upload failed, falling back to base64...', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('postify-assets')
        .getPublicUrl(path);

      onUploadComplete(publicUrl, file.name, file.size);
    } catch (err: any) {
      // Fallback: Convert to Base64 data URL for local storage persistence if storage is not set up
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            onUploadComplete(reader.result as string, file.name, file.size);
          } else {
            setError('Erro ao processar o arquivo.');
          }
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        setError(err.message || 'Erro ao realizar upload.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-white/[0.01]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          accept={allowedTypes.join(',')}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-[var(--primary-light)] animate-spin" />
              <p className="text-sm font-medium text-white">Carregando arquivo...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Arraste arquivos ou clique para selecionar
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Suporta PNG, JPG ou WebP (Máx. {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-[var(--danger)] bg-[var(--danger)]/10 p-3 rounded-lg border border-[var(--danger)]/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
