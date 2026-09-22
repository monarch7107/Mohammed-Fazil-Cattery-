"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cat, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { StatusBadge } from "@/components/kittens/KittenCard";
import { apiSend, ApiError } from "@/lib/admin/api";
import { KITTEN_STATUSES, type Kitten, type KittenStatus } from "@/models/types";

interface FormState {
  name: string;
  breed: string;
  gender: "male" | "female" | "unknown";
  dateOfBirth: string;
  status: KittenStatus;
  price: string;
  description: string;
  featured: boolean;
  images: string[];
}

const emptyForm: FormState = {
  name: "",
  breed: "Persian",
  gender: "unknown",
  dateOfBirth: "",
  status: "available",
  price: "",
  description: "",
  featured: false,
  images: [],
};

function toForm(kitten: Kitten): FormState {
  return {
    name: kitten.name,
    breed: kitten.breed,
    gender: kitten.gender,
    dateOfBirth: kitten.dateOfBirth ?? "",
    status: kitten.status,
    price: kitten.price === null ? "" : String(kitten.price),
    description: kitten.description,
    featured: kitten.featured,
    images: [...kitten.images],
  };
}

export function KittenManager({
  initialItems,
  autoOpen = false,
}: {
  initialItems: Kitten[];
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Kitten[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Kitten | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => setItems(initialItems), [initialItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  };

  // `?new=1` from the dashboard opens the create dialog directly.
  useEffect(() => {
    if (autoOpen) openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const openEdit = (kitten: Kitten) => {
    setEditing(kitten);
    setForm(toForm(kitten));
    setError(null);
    setOpen(true);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      breed: form.breed.trim() || "Persian",
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || null,
      description: form.description.trim(),
      status: form.status,
      price: form.price.trim() === "" ? null : Number(form.price),
      images: form.images,
      featured: form.featured,
    };

    try {
      if (editing) {
        const response = await apiSend<{ kitten: Kitten }>(
          `/api/kittens/${editing.id}`,
          "PUT",
          payload
        );
        setItems((current) => current.map((item) => (item.id === editing.id ? response.kitten : item)));
      } else {
        const response = await apiSend<{ kitten: Kitten }>("/api/kittens", "POST", payload);
        setItems((current) => [response.kitten, ...current]);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this kitten.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiSend(`/api/kittens/${id}`, "DELETE");
      setItems((current) => current.filter((item) => item.id !== id));
      setConfirmDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this kitten.");
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Manage</p>
          <h1 className="mt-3 font-serif text-display-md text-navy">Kittens</h1>
          <p className="mt-2 text-sm text-navy/65">
            {items.length} record{items.length === 1 ? "" : "s"} · availability shown publicly in
            real time.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Kitten
        </Button>
      </div>

      {error && !open ? (
        <p role="alert" className="rounded-md border border-brown/30 bg-brown/8 px-4 py-3 text-sm text-brown">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-navy/25 bg-white px-6 py-14 text-center">
          <Cat className="mx-auto h-8 w-8 text-navy/40" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-xl text-navy">No kittens yet</h2>
          <p className="mt-2 text-sm text-navy/60">Add your first kitten to publish it on the site.</p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Kitten
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((kitten) => (
            <li key={kitten.id} className="rounded-lg border border-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-lg text-navy">{kitten.name}</h2>
                  <p className="mt-1 text-[12.5px] text-navy/55">
                    {kitten.breed}
                    {kitten.gender !== "unknown"
                      ? ` · ${kitten.gender === "male" ? "Male" : "Female"}`
                      : ""}
                  </p>
                </div>
                <StatusBadge status={kitten.status} />
              </div>

              {kitten.placeholder ? (
                <p className="mt-3">
                  <Badge tone="placeholder">Placeholder</Badge>
                </p>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(kitten)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-navy/20 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>

                {confirmDelete === kitten.id ? (
                  <button
                    type="button"
                    onClick={() => remove(kitten.id)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brown px-4 text-[13px] font-semibold text-white transition hover:bg-brown-800"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(kitten.id)}
                    aria-label={`Delete ${kitten.name}`}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent wide>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit kitten" : "Add kitten"}</DialogTitle>
            <DialogDescription>
              Only fill in details you actually have — anything left empty stays hidden on the
              website.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="kitten-name">Name *</Label>
              <Input
                id="kitten-name"
                required
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="e.g. Whiskers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitten-breed">Breed</Label>
              <Input
                id="kitten-breed"
                value={form.breed}
                onChange={(event) => set("breed", event.target.value)}
                placeholder="Persian"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitten-gender">Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(value) => set("gender", value as FormState["gender"])}
              >
                <SelectTrigger id="kitten-gender">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Not specified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitten-dob">Date of birth (optional)</Label>
              <Input
                id="kitten-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => set("dateOfBirth", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitten-status">Status *</Label>
              <Select
                value={form.status}
                onValueChange={(value) => set("status", value as KittenStatus)}
              >
                <SelectTrigger id="kitten-status">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {KITTEN_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kitten-price">Price in ₹ (optional)</Label>
              <Input
                id="kitten-price"
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
                placeholder="Leave empty if not configured"
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="kitten-featured"
                type="checkbox"
                checked={form.featured}
                onChange={(event) => set("featured", event.target.checked)}
                className="h-5 w-5 rounded border-navy/30 text-navy accent-navy"
              />
              <Label htmlFor="kitten-featured" className="font-medium">
                Feature on the homepage
              </Label>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="kitten-description">Description</Label>
              <Textarea
                id="kitten-description"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Temperament, health, what the kitten is used to…"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Photos</Label>
              <div className="mt-2">
                <ImageUploader
                  multiple
                  value={form.images}
                  onChange={(urls) => set("images", urls)}
                  hint="JPG, PNG, WEBP or AVIF · up to 8 MB each"
                  folder="kittens"
                />
              </div>
            </div>

            {error ? (
              <p role="alert" className="rounded-md border border-brown/30 bg-brown/8 px-4 py-3 text-sm text-brown sm:col-span-2">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Add kitten"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
