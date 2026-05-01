import type { Listing } from "@/lib/types/listing";
import type { OsclassItem } from "./types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function slugify(input: string, id: string | number): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
  return base ? `${base}-${id}` : String(id);
}

function pickImage(item: OsclassItem): { src: string; alt: string } {
  const r = item.resources?.find((x) => x.url || x.url_thumbnail || x.s_path);
  const src = r?.url || r?.url_thumbnail || FALLBACK_IMAGE;
  return { src, alt: item.s_title ?? "Listing photo" };
}

function metaNumber(item: OsclassItem, key: string): number {
  const m = item.meta?.find((x) => (x.s_name ?? "").toLowerCase() === key.toLowerCase());
  return toNumber(m?.s_value, 0);
}

export function osclassToListing(item: OsclassItem): Listing {
  const id = String(item.pk_i_id);
  const title = item.s_title?.trim() || "Untitled listing";
  const image = pickImage(item);
  return {
    id,
    slug: slugify(title, id),
    title,
    price: toNumber(item.i_price, 0),
    currency: item.s_currency || "USD",
    city: item.s_city || "",
    region: item.s_region || item.s_country || "",
    beds: metaNumber(item, "bedrooms") || metaNumber(item, "beds"),
    baths: metaNumber(item, "bathrooms") || metaNumber(item, "baths"),
    sqft: metaNumber(item, "sqft") || metaNumber(item, "size"),
    description: item.s_description ?? "",
    imageSrc: image.src,
    imageAlt: image.alt,
  };
}
