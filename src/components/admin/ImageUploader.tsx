"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { BusinessImage } from "@/components/images/BusinessImage";
import { precheckFile, uploadImage, ApiError } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

/**
 * Image field with preview, validation, upload progress, retry and removal.
 * Emits plain URL strings, so the storage driver behind /api/upload can change
 * without touching any form.
 */
export function ImageUploader({
  value = [],
  onChange,
  multiple = false,
  label = "Upload image",
  hint,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const lastFile = useRef<File | null>(null);

  const startUpload = async (file: File) => {
    lastFile.current = file;
    setError(null);

    const problem = precheckFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setProgress(0);

    try {
      const result = await uploadImage(file, setProgress);
      onChange(multiple ? [...value, result.url] : [result.url]);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setProgress(null);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void startUpload(file);
  };

  const retry = () => {
    if (lastFile.current) void startUpload(lastFile.current);
  };

  const remove = (url: string) => onChange(value.filter((entry) => entry !== url));

  const move = (index: number, delta: number) => {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const busy = progress !== null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || (!multiple && value.length >= 1)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-navy/25 px-5 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
          {busy ? `Uploading ${progress}%` : label}
        </button>

        {error ? (
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-brown/40 bg-brown/8 px-4 text-[13px] font-semibold text-brown transition hover:bg-brown/12"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        ) : null}
      </div>

      {busy && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy/10" aria-hidden="true">
          <div
            className="h-full rounded-full bg-green transition-all duration-200"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-[13px] text-brown">
          {error}
        </p>
      )}

      {hint && !error ? <p className="text-[12.5px] text-navy/55">{hint}</p> : null}

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <li key={url} className="relative w-24">
              <div className="overflow-hidden rounded-md border border-navy/15">
                <BusinessImage
                  src={url}
                  alt=""
                  label="Uploaded"
                  variant="gallery"
                  ratio="aspect-square"
                  sizes="96px"
                />
              </div>

              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-navy shadow-card transition hover:bg-brown hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              {multiple && value.length > 1 ? (
                <div className="mt-1 flex justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move image earlier"
                    className="h-7 w-7 rounded border border-navy/15 text-navy/60 transition hover:bg-navy/8 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label="Move image later"
                    className="h-7 w-7 rounded border border-navy/15 text-navy/60 transition hover:bg-navy/8 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {preview ? (
        <div className={cn("w-24 overflow-hidden rounded-md border border-dashed border-navy/30")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="aspect-square w-full object-cover opacity-70" />
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        onChange={onPick}
        className="sr-only"
        aria-label={label}
      />
    </div>
  );
}
