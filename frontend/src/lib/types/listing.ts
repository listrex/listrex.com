export type Listing = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  city: string;
  region: string;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  imageSrc: string;
  imageAlt: string;
};
