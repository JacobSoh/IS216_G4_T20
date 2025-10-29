'use client';

import { useId, useState, useRef, useEffect } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export function CustomFileInput({
  type,
  label, 
  err,
  required = false,
  filterRule = /^image\//i,
  fullWidth = true,
  maxLength = 1,
  existingFiles = null,
  ...rest
}) {
  const autoId = useId();
  const id = `fi-${type}-${autoId}`;
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (existingFiles && existingFiles.length > 0) {
      const existingPreviews = existingFiles.map((url, idx) => ({
        file: null,
        url: url,
        name: `Existing image ${idx + 1}`,
        size: '0',
        isExisting: true
      }));
      setPreviews(existingPreviews);
    }
  }, [existingFiles]);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => filterRule.test(file.type));
    const limitedFiles = validFiles.slice(0, maxLength);

    previews.forEach(p => {
      if (!p.isExisting && p.url) {
        URL.revokeObjectURL(p.url);
      }
    });

    const newPreviews = limitedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      isExisting: false
    }));

    setPreviews(newPreviews);
  };

  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemove = (index) => {
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      if (!prev[index].isExisting && prev[index].url) {
        URL.revokeObjectURL(prev[index].url);
      }
      return newPreviews;
    });
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      previews.forEach(p => {
        if (!p.isExisting && p.url) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, []);

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
      </FieldLabel>
      <div 
        className={`w-full max-w-4xl relative mx-auto border-2 border-dashed rounded-md bg-[var(--theme-surface)] transition-all duration-200 cursor-pointer min-h-[200px] flex items-center justify-center ${
          isDragging 
            ? 'border-brand bg-brand/10 scale-[1.02]' 
            : 'border-[var(--theme-border)] hover:border-brand/50 hover:bg-[var(--theme-surface)]/80'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={previews.length === 0 ? handleClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          id={id}
          name={type}
          required={required && previews.length === 0}
          accept={filterRule.source?.includes('image') ? 'image/*' : '*'}
          multiple={maxLength > 1}
          onChange={handleChange}
          className="hidden"
          {...rest}
        />

        {previews.length === 0 ? (
          <div className="text-center p-8">
            <div className="mb-4 flex justify-center">
              <svg 
                className="h-16 w-16 text-muted-foreground transition-transform duration-200 hover:scale-110" 
                stroke="currentColor" 
                fill="none" 
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-foreground mb-2">
              {isDragging ? 'Drop your files here' : 'Drag or drop your files here or click to upload'}
            </p>
            <p className="text-sm text-muted-foreground">
              {filterRule.source?.includes('image') ? 'Images only' : 'All file types'} • Max {maxLength} file(s)
            </p>
          </div>
        ) : (
          <div className="w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className={`grid gap-4 ${maxLength > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {previews.map((preview, index) => (
                <div 
                  key={index} 
                  className="relative rounded-lg overflow-hidden border border-[var(--theme-border)] bg-muted/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={handleClick}
                >
                  <div className="relative w-full bg-muted/20" style={{ minHeight: '250px' }}>
                    <div className="flex items-center justify-center p-4 min-h-[250px]">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="max-w-full max-h-[300px] object-contain rounded"
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                  
                  {/* Delete button only - visible on hover */}
                  {mounted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 shadow-lg font-bold text-xl z-10"
                      style={{
                        opacity: hoveredIndex === index ? 1 : 0,
                        pointerEvents: hoveredIndex === index ? 'auto' : 'none'
                      }}
                      suppressHydrationWarning
                      aria-label="Remove image"
                      title="Remove this image"
                    >
                      ×
                    </button>
                  )}
                  
                  {/* Filename and size overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white p-4 pt-8">
                    <p className="text-sm font-medium truncate mb-1">{preview.name}</p>
                    {!preview.isExisting && <p className="text-xs text-gray-300">{preview.size} MB</p>}
                  </div>
                </div>
              ))}
            </div>
            
            {maxLength > 1 && previews.length < maxLength && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="mt-4 w-full py-3 px-4 border-2 border-dashed border-[var(--theme-border)] rounded-md text-sm font-medium text-muted-foreground hover:border-brand hover:text-brand transition-colors"
              >
                + Add more files ({previews.length}/{maxLength})
              </button>
            )}
          </div>
        )}
      </div>
      
      {err && <FieldError>{err}</FieldError>}
    </Field>
  );
}
