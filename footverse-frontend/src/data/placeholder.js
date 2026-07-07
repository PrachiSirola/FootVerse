// ── Categories ──
export const categories = [
  { slug: "desks", name: "Desks", image: "/images/desk-1.jpg", count: 10 },
  { slug: "chairs", name: "Chairs", image: "/images/chair-1.jpg", count: 10 },
  { slug: "sofa", name: "Sofas", image: "/images/sofa-1.jpg", count: 10 },
  { slug: "storage", name: "Storage", image: "/images/storage-1.jpg", count: 10 }
];


// ── Products ──
export const products = [
  // ── DESKS ──
  {
    id: "1",
    name: "Executive Desk",
    category: "desks",
    price: 20000,
    mrp: 25000,
    image: "/images/desk-1.jpg",
    supplier: "WoodCraft",
    rating: 4.5,
    reviews: 120,
    badge: "Best Seller"
  },
  {
    id: "2",
    name: "Modern Desk",
    category: "desks",
    price: 18000,
    mrp: 22000,
    image: "/images/desk-2.jpg",
    supplier: "UrbanSpace",
    rating: 4.4,
    reviews: 95
  },
  {
    id: "3",
    name: "Compact Desk",
    category: "desks",
    price: 15000,
    mrp: 19000,
    image: "/images/desk-3.jpg",
    supplier: "WoodCraft",
    rating: 4.3,
    reviews: 80
  },
  {
    id: "4",
    name: "Premium Work Desk",
    category: "desks",
    price: 22000,
    mrp: 28000,
    image: "/images/desk-4.jpg",
    supplier: "PrimeFurniture",
    rating: 4.6,
    reviews: 70
  },

  // ── CHAIRS ──
  {
    id: "5",
    name: "Ergonomic Chair",
    category: "chairs",
    price: 8000,
    mrp: 10000,
    image: "/images/chair-1.jpg",
    supplier: "ComfortSeating",
    rating: 4.6,
    reviews: 90,
    badge: "Popular"
  },
  {
    id: "6",
    name: "Mesh Chair",
    category: "chairs",
    price: 7000,
    mrp: 9000,
    image: "/images/chair-2.jpg",
    supplier: "ComfortSeating",
    rating: 4.5,
    reviews: 110
  },
  {
    id: "7",
    name: "Executive Chair",
    category: "chairs",
    price: 12000,
    mrp: 15000,
    image: "/images/chair-3.jpg",
    supplier: "PrimeFurniture",
    rating: 4.7,
    reviews: 70
  },
  {
    id: "8",
    name: "Office Chair Pro",
    category: "chairs",
    price: 9500,
    mrp: 12000,
    image: "/images/chair-4.jpg",
    supplier: "UrbanSpace",
    rating: 4.4,
    reviews: 60
  },
  {
    id: "9",
    name: "Comfort Chair",
    category: "chairs",
    price: 8500,
    mrp: 11000,
    image: "/images/chair-5.jpg",
    supplier: "ComfortZone",
    rating: 4.3,
    reviews: 50
  },

  // ── SOFAS ──
  {
    id: "10",
    name: "Office Sofa",
    category: "sofa",
    price: 15000,
    mrp: 20000,
    image: "/images/sofa-1.jpg",
    supplier: "UrbanLiving",
    rating: 4.4,
    reviews: 60
  },
  {
    id: "11",
    name: "Modern Sofa",
    category: "sofa",
    price: 18000,
    mrp: 23000,
    image: "/images/sofa-2.jpg",
    supplier: "UrbanLiving",
    rating: 4.5,
    reviews: 45
  },
  {
    id: "12",
    name: "Single Sofa",
    category: "sofa",
    price: 9000,
    mrp: 12000,
    image: "/images/sofa-3.jpg",
    supplier: "ComfortZone",
    rating: 4.3,
    reviews: 30
  },
  {
    id: "13",
    name: "Luxury Sofa",
    category: "sofa",
    price: 22000,
    mrp: 28000,
    image: "/images/sofa-4.jpg",
    supplier: "PrimeFurniture",
    rating: 4.6,
    reviews: 25
  },
  {
    id: "14",
    name: "Compact Sofa",
    category: "sofa",
    price: 13000,
    mrp: 17000,
    image: "/images/sofa-5.jpg",
    supplier: "UrbanLiving",
    rating: 4.2,
    reviews: 20
  },

  // ── STORAGE ──
  {
    id: "15",
    name: "Storage Cabinet",
    category: "storage",
    price: 12000,
    mrp: 15000,
    image: "/images/storage-1.jpg",
    supplier: "SafeStore",
    rating: 4.3,
    reviews: 40
  },
  {
    id: "16",
    name: "Wardrobe Unit",
    category: "storage",
    price: 14000,
    mrp: 18000,
    image: "/images/storage-2.jpg",
    supplier: "SafeStore",
    rating: 4.2,
    reviews: 35
  },
  {
    id: "17",
    name: "Shelf Storage",
    category: "storage",
    price: 10000,
    mrp: 13000,
    image: "/images/storage-3.jpg",
    supplier: "WoodCraft",
    rating: 4.4,
    reviews: 50
  },
  {
    id: "18",
    name: "Office Locker",
    category: "storage",
    price: 16000,
    mrp: 20000,
    image: "/images/storage-4.jpg",
    supplier: "SecureSpace",
    rating: 4.5,
    reviews: 30
  },
  {
    id: "19",
    name: "Multi Storage Rack",
    category: "storage",
    price: 11000,
    mrp: 14000,
    image: "/images/storage-5.jpg",
    supplier: "WoodCraft",
    rating: 4.3,
    reviews: 25
  }
];

// ── Price Formatter (FIXES YOUR ERROR) ──
export function formatPrice(price) {
  const value = Number(price ?? 0);
  return "$" + (Number(value)||0).toFixed(2);
}