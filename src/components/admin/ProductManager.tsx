"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
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
import { apiSend, ApiError } from "@/lib/admin/api";
import type { Product } from "@/models/types";

interface FormState {
  name: string;
  animal: "cat" | "dog";
  category: "dry" | "wet";
  foodType: string;
  brand: string;
  packSize: string;
  price: string;
  description: string;
  available: boolean;
  image: string;
}

const emptyForm: FormState = {
  name: "",
  animal: "cat",
  category: "dry",
  foodType: "",
  brand: "",
  packSize: "",
  price: "",
  description: "",
  available: true,
  image: "",
};

function toForm(product: Product): FormState {
  return {
    name: product.name,
    animal: product.animal,
    category: product.category,
    foodType: product.foodType ?? "",
    brand: product.brand ?? "",
    packSize: product.packSize ?? "",
    price: product.price === null ? "" : String(product.price),
    description: product.description ?? "",
    available: product.available,
    image: product.image ?? "",
  };
}

export function ProductManager({
  initialItems,
  autoOpen = false,
}: {
  initialItems: Product[];
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
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

  useEffect(() => {
    if (autoOpen) openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm(toForm(product));
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
      animal: form.animal,
      category: form.category,
      foodType: form.foodType.trim() || null,
      brand: form.brand.trim() || null,
      packSize: form.packSize.trim() || null,
      price: form.price.trim() === "" ? null : Number(form.price),
      description: form.description.trim() || null,
      image: form.image || null,
      available: form.available,
    };

    try {
      if (editing) {
        const response = await apiSend<{ product: Product }>(
          `/api/products/${editing.id}`,
          "PUT",
          payload
        );
        setItems((current) =>
          current.map((item) => (item.id === editing.id ? response.product : item))
        );
      } else {
        const response = await apiSend<{ product: Product }>("/api/products", "POST", payload);
        setItems((current) => [response.product, ...current]);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this product.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiSend(`/api/products/${id}`, "DELETE");
      setItems((current) => current.filter((item) => item.id !== id));
      setConfirmDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this product.");
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Manage</p>
          <h1 className="mt-3 font-serif text-display-md text-navy">Products</h1>
          <p className="mt-2 text-sm text-navy/65">
            Cat and dog food listings. Leave brand, pack size and price empty when unknown.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </Button>
      </div>

      {error && !open ? (
        <p role="alert" className="rounded-md border border-brown/30 bg-brown/8 px-4 py-3 text-sm text-brown">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-navy/25 bg-white px-6 py-14 text-center">
          <Package className="mx-auto h-8 w-8 text-navy/40" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-xl text-navy">No products yet</h2>
          <p className="mt-2 text-sm text-navy/60">Add the pet food you currently stock.</p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Product
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <li key={product.id} className="rounded-lg border border-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-lg text-navy">{product.name}</h2>
                  <p className="mt-1 text-[12.5px] capitalize text-navy/55">
                    {product.animal} · {product.category}
                    {product.brand ? ` · ${product.brand}` : ""}
                  </p>
                </div>
                <Badge tone={product.available ? "available" : "sold"}>
                  {product.available ? "Available" : "Unavailable"}
                </Badge>
              </div>

              {product.placeholder ? (
                <p className="mt-3">
                  <Badge tone="placeholder">Placeholder</Badge>
                </p>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-navy/20 text-[13px] font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-cream"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>

                {confirmDelete === product.id ? (
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brown px-4 text-[13px] font-semibold text-white transition hover:bg-brown-800"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(product.id)}
                    aria-label={`Delete ${product.name}`}
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
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              Fields you leave empty are simply not shown — nothing on the site is invented.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product-name">Product name *</Label>
              <Input
                id="product-name"
                required
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="e.g. Cat Food — Dry"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-animal">Animal *</Label>
              <Select
                value={form.animal}
                onValueChange={(value) => set("animal", value as FormState["animal"])}
              >
                <SelectTrigger id="product-animal">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="dog">Dog</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">Category *</Label>
              <Select
                value={form.category}
                onValueChange={(value) => set("category", value as FormState["category"])}
              >
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry">Dry food</SelectItem>
                  <SelectItem value="wet">Wet food</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-foodtype">Food type label (optional)</Label>
              <Input
                id="product-foodtype"
                value={form.foodType}
                onChange={(event) => set("foodType", event.target.value)}
                placeholder="Defaults from category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-brand">Brand (optional)</Label>
              <Input
                id="product-brand"
                value={form.brand}
                onChange={(event) => set("brand", event.target.value)}
                placeholder="Only if you stock it"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-pack">Pack size (optional)</Label>
              <Input
                id="product-pack"
                value={form.packSize}
                onChange={(event) => set("packSize", event.target.value)}
                placeholder="e.g. 1 kg, 400 g"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">Price in ₹ (optional)</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="product-available"
                type="checkbox"
                checked={form.available}
                onChange={(event) => set("available", event.target.checked)}
                className="h-5 w-5 rounded border-navy/30 accent-navy"
              />
              <Label htmlFor="product-available" className="font-medium">
                Currently available
              </Label>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="What it is, who it suits, anything worth knowing"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Product image</Label>
              <div className="mt-2">
                <ImageUploader
                  value={form.image ? [form.image] : []}
                  onChange={(urls) => set("image", urls[0] ?? "")}
                  hint="JPG, PNG, WEBP or AVIF · up to 8 MB"
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
                  "Add product"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
