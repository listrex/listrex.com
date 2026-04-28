import type { Listing } from "@/lib/types/listing";

/**
 * Placeholder data until the custom backend + Osclass integration is wired.
 */
export const mockListings: Listing[] = [
  {
    id: "1",
    slug: "marina-waterfront-2br",
    title: "Bright 2BR with Marina Views",
    price: 485000,
    currency: "USD",
    city: "Dubai",
    region: "Marina",
    beds: 2,
    baths: 2,
    sqft: 1180,
    description:
      "Corner unit with floor-to-ceiling windows, upgraded kitchen, and walking distance to the promenade. Ideal for professionals or as a rental investment.",
    imageSrc:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Modern apartment living room with large windows",
  },
  {
    id: "2",
    slug: "family-villa-garden",
    title: "Family Villa with Garden & Pool",
    price: 1290000,
    currency: "USD",
    city: "Abu Dhabi",
    region: "Saadiyat",
    beds: 4,
    baths: 4,
    sqft: 3400,
    description:
      "Single-row villa with private pool, maids room, and mature landscaping. Quiet community with schools and retail nearby.",
    imageSrc:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Luxury house exterior with pool at dusk",
  },
  {
    id: "3",
    slug: "downtown-penthouse",
    title: "Skyline Penthouse Duplex",
    price: 2100000,
    currency: "USD",
    city: "Dubai",
    region: "Downtown",
    beds: 3,
    baths: 3,
    sqft: 2650,
    description:
      "Duplex penthouse with double-height living, wraparound terrace, and unobstructed Burj Khalifa views. Includes two parking spaces.",
    imageSrc:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Penthouse interior with city view",
  },
  {
    id: "4",
    slug: "starter-apartment-jlt",
    title: "Starter Apartment Near Metro",
    price: 285000,
    currency: "USD",
    city: "Dubai",
    region: "JLT",
    beds: 1,
    baths: 1,
    sqft: 720,
    description:
      "Efficient layout, rented until next quarter—great for first-time buyers or capital preservation with steady yield.",
    imageSrc:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Compact modern apartment interior",
  },
  {
    id: "5",
    slug: "corner-townhouse-sports-city",
    title: "Corner Townhouse — Sports City",
    price: 675000,
    currency: "USD",
    city: "Dubai",
    region: "Dubai Sports City",
    beds: 3,
    baths: 3,
    sqft: 2100,
    description:
      "End unit with extra windows, built-in wardrobes, and easy access to stadium and academies.",
    imageSrc:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Townhouse street with green lawn",
  },
  {
    id: "6",
    slug: "luxury-apartment-sea-view",
    title: "Luxury Apartment — Full Sea View",
    price: 895000,
    currency: "USD",
    city: "Dubai",
    region: "Palm Jumeirah",
    beds: 2,
    baths: 2,
    sqft: 1420,
    description:
      "High floor, fully furnished option available. Resort amenities including beach access and concierge.",
    imageSrc:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Luxury apartment balcony overlooking water",
  },
];

export function getListingBySlug(slug: string): Listing | undefined {
  return mockListings.find((l) => l.slug === slug);
}

export function filterListings(query: string): Listing[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockListings;
  return mockListings.filter((l) => {
    const haystack = `${l.title} ${l.city} ${l.region} ${l.description}`.toLowerCase();
    return haystack.includes(q);
  });
}
