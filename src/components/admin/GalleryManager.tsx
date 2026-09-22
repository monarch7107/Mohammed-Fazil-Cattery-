"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Images, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { BusinessImage } from "@/components/images/BusinessImage";
import { apiSend, ApiError } from "@/lib/admin/api";
import { GALLERY_CATEGORIES, type GalleryCategory, type GalleryItem } from "@/models/types";

const labels: Record<GalleryCategory, string> = {
  kittens: "Kittens",
  cats: "Cats",
  "pet-food": "Pet Food",
  cattery: "Cattery",
};

const variantFor = (category: GalleryCategory) =>
  category === "kittens"
    ? ("kitten" as const)
    : category === "cats"
      ? ("cat" as const)
      : category === "pet-food"
        ? ("product" as const)
        : ("cattery" as const);

export function GalleryManager({ initialItems }: { initialItems: GalleryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [image, setImage] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("kittens");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => setItems(initialItems), [initialItems]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!image) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await apiSend<{ item: GalleryItem }>("/api/gallery", "POST", {
        image,
        caption: caption.trim(),
        category,
        sortOrder: items.length,
      });
      setItems((current) => [...current, response.item]);
      setImage("");
      setCaption("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add this image.");
    } finally {
      setBusy(false);
    }
  };

  const updateCategory = async (id: string, nextCategory: GalleryCategory) => {
    const previous = items;
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, category: nextCategory } : item))
    );
    try {
      await apiSend(`/api/gallery/${id}`, "PATCH", { category: nextCategory });
      router.refresh();
    } catch (err) {
      setItems(previous);
      setError(err instanceof ApiError ? err.message : "Could not update this entry.");
    }
  };

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = items;
    setItems(next);
    try {
      await apiSend("/api/gallery/reorder", "POST", { orderedIds: next.map((item) => item.id) });
      router.refresh();
    } catch (err) {
      setItems(previous);
      setError(err instanceof ApiError ? err.message : "Could not reorder the gallery.");
    }
  };

  const remove = async (id: string) => {
    try {
      await apiSend(`/api/gallery/${id}`, "DELETE");
      setItems((current) => current.filter((item) => item.id !== id));
      setConfirmDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this entry.");
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Manage</p>
        <h1 className="mt-3 font-serif text-display-md text-navy">Gallery</h1>
        <p className="mt-2 text-sm text-navy/65">
          Upload, caption, categorise and reorder the photographs shown on the gallery page.
        </p>
      </div>

      {/* Upload form */}
      <form
        onSubmit={add}
        className="grid gap-5 rounded-lg border border-line bg-white p-5 shadow-card sm:grid-cols-2 sm:p-6"
      >
        <div className="sm:col-span-2">
          <Label>Image *</Label>
          <div className="mt-2">
            <ImageUploader
              value={image ? [image] : []}
              onChange={(urls) => setImage(urls[0] ?? "")}
              hint="JPG, PNG, WEBP or AVIF · up to 8 MB"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gallery-caption">Caption</Label>
          <Input
            id="gallery-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="e.g. New arrivals — March litter"
            maxLength={160}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gallery-category">Category *</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as GalleryCategory)}
          >
            <SelectTrigger id="gallery-category">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GALLERY_CATEGORIES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {labels[entry]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && !items.some((item) => item.id === confirmDelete) ? (
          <p role="alert" className="rounded-md border border-brown/30 bg-brown/8 px-4 py-3 text-sm text-brown sm:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy || !image}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Adding…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add to gallery
              </>
            )}
          </Button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-navy/25 bg-white px-6 py-14 text-center">
          <Images className="mx-auto h-8 w-8 text-navy/40" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-xl text-navy">No gallery images yet</h2>
          <p className="mt-2 text-sm text-navy/60">Upload your first photograph above.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-white p-4 shadow-card"
            >
              <div className="w-20 shrink-0 overflow-hidden rounded-md border border-navy/10">
                <BusinessImage
                  src={item.image}
                  alt=""
                  label="Photo"
                  variant={variantFor(item.category)}
                  ratio="aspect-square"
                  sizes="80px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-navy">
                  {item.caption || <span className="text-navy/45">No caption</span>}
                </p>
                <p className="mt-0.5 text-[12px] uppercase tracking-wider2 text-navy/50">
                  Position {index + 1} of {items.length}
                  {item.placeholder ? " · placeholder" : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={item.category}
                  onValueChange={(value) => updateCategory(item.id, value as GalleryCategory)}
                >
                  <SelectTrigger className="h-10 w-36 text-[13px]" aria-label="Category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GALLERY_CATEGORIES.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {labels[entry]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {item.placeholder ? <Badge tone="placeholder">Placeholder</Badge> : null}

                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move image earlier"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-navy/20 text-navy/60 transition hover:border-navy hover:text-navy disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Move image later"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-navy/20 text-navy/60 transition hover:border-navy hover:text-navy disabled:opacity-40"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>

                {confirmDelete === item.id ? (
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-brown px-4 text-[13px] font-semibold text-white transition hover:bg-brown-800"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(item.id)}
                    aria-label="Delete image"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-navy/20 text-navy/60 transition hover:border-brown hover:text-brown"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
