import type {
  AdminUser,
  GalleryCategory,
  GalleryInput,
  GalleryItem,
  Kitten,
  KittenInput,
  Product,
  ProductInput,
  StoreStats,
} from "@/models/types";

export type ListKittenFilter = { status?: Kitten["status"]; featured?: boolean };
export type ListProductFilter = { animal?: Product["animal"]; category?: Product["category"] };
export type ListGalleryFilter = { category?: GalleryCategory };

/**
 * Storage contract. The public site and admin panel only talk to this
 * interface, so persistence can be switched without touching components.
 */
export interface DataStore {
  readonly mode: "firebase" | "memory";

  listKittens(filter?: ListKittenFilter): Promise<Kitten[]>;
  getKitten(id: string): Promise<Kitten | null>;
  createKitten(input: KittenInput): Promise<Kitten>;
  updateKitten(id: string, input: KittenInput): Promise<Kitten | null>;
  deleteKitten(id: string): Promise<boolean>;

  listProducts(filter?: ListProductFilter): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(input: ProductInput): Promise<Product>;
  updateProduct(id: string, input: ProductInput): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;

  listGallery(filter?: ListGalleryFilter): Promise<GalleryItem[]>;
  getGalleryItem(id: string): Promise<GalleryItem | null>;
  createGallery(input: GalleryInput): Promise<GalleryItem>;
  updateGallery(
    id: string,
    patch: Partial<Pick<GalleryItem, "caption" | "category" | "sortOrder" | "image">>
  ): Promise<GalleryItem | null>;
  deleteGallery(id: string): Promise<boolean>;
  reorderGallery(orderedIds: string[]): Promise<boolean>;

  findAdminByEmail(email: string): Promise<AdminUser | null>;
  ensureAdmin(user: Omit<AdminUser, "id">): Promise<AdminUser | null>;

  stats(): Promise<StoreStats>;
}
