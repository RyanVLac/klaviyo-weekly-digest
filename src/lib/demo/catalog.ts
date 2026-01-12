
export type DemoCategory = {
  slug: string;
  name: string;
  blurb: string;
  topic: string;
  sampleProductSlug: string;
  sampleContentSlug: string;
};

export type DemoContent = {
  slug: string;
  title: string;
  excerpt: string;
  topic: string;
};

export type DemoProduct = {
  slug: string;
  productId: string;
  productName: string;
  price: number;
  topic: string;
  description: string;
};

export const demoCategories: DemoCategory[] = [
  {
    slug: "boots",
    name: "Boots",
    blurb: "Winter boots, leather boots, hiking boots",
    topic: "boots",
    sampleProductSlug: "boots-001",
    sampleContentSlug: "winter-boot-guide",
  },
  {
    slug: "jackets",
    name: "Jackets",
    blurb: "Puffer, rain, and work jackets",
    topic: "jackets",
    sampleProductSlug: "jackets-001",
    sampleContentSlug: "jacket-layering-101",
  },
  {
    slug: "snow",
    name: "Snow Gear",
    blurb: "Gloves, thermals, base layers",
    topic: "snow",
    sampleProductSlug: "snow-001",
    sampleContentSlug: "snow-day-checklist",
  },
  {
    slug: "running",
    name: "Running",
    blurb: "Shoes + accessories for cold runs",
    topic: "running",
    sampleProductSlug: "running-001",
    sampleContentSlug: "winter-running-tips",
  },
];

export const demoContent: DemoContent[] = [
  {
    slug: "winter-boot-guide",
    title: "Winter Boot Guide: Warmth vs. Grip vs. Style",
    excerpt:
      "A quick guide to choosing boots for icy sidewalks, slushy commutes, and weekend hikes.",
    topic: "boots",
  },
  {
    slug: "jacket-layering-101",
    title: "Layering 101: Jackets That Actually Work",
    excerpt:
      "How to combine base layers + mid layers + shells without turning into a marshmallow.",
    topic: "jackets",
  },
  {
    slug: "snow-day-checklist",
    title: "Snow Day Checklist: The 6 Essentials",
    excerpt:
      "Thermals, gloves, socks, traction, and a few underrated items that make a huge difference.",
    topic: "snow",
  },
  {
    slug: "winter-running-tips",
    title: "Winter Running Tips: Stay Warm Without Overheating",
    excerpt:
      "Simple clothing rules and route ideas so your lungs don’t feel like they’re inhaling knives.",
    topic: "running",
  },
];

export const demoProducts: DemoProduct[] = [
  {
    slug: "boots-001",
    productId: "boot-001",
    productName: "Classic Leather Boot",
    price: 129.99,
    topic: "boots",
    description: "A versatile boot for daily wear with solid traction and comfort.",
  },
  {
    slug: "jackets-001",
    productId: "jacket-001",
    productName: "Insulated Winter Jacket",
    price: 189.0,
    topic: "jackets",
    description: "Warm insulation with a weather-resistant outer shell.",
  },
  {
    slug: "snow-001",
    productId: "snow-001",
    productName: "Thermal Base Layer Set",
    price: 59.0,
    topic: "snow",
    description: "Breathable thermals designed for cold weather activities.",
  },
  {
    slug: "running-001",
    productId: "run-001",
    productName: "Weatherproof Running Shoes",
    price: 119.0,
    topic: "running",
    description: "Water-resistant runners with extra grip for wet/icy pavement.",
  },
];

export function findDemoContent(slug: string) {
  return demoContent.find((c) => c.slug === slug) ?? null;
}

export function findDemoProduct(slug: string) {
  return demoProducts.find((p) => p.slug === slug) ?? null;
}
