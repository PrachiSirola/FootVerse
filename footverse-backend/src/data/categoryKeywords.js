// Keyword searches used to build the CJ product pool. Broad, high-volume terms
// pull thousands of products; the transformer re-classifies each product into
// Men / Women / Kids by reading the product name, so categories are NOT mixed
// even though a broad "sneakers" search returns all audiences together.
//
// The `category`/`subcategory` here are only FALLBACKS used when the product
// name has no clear signal.
export default [
  // ---- BROAD high-volume footwear terms (the bulk of the catalog) ----
  { keyword: "shoes", category: "Men", subcategory: "Casual" },
  { keyword: "sneakers", category: "Men", subcategory: "Sneakers" },
  { keyword: "sandals", category: "Women", subcategory: "Sandals" },
  { keyword: "boots", category: "Men", subcategory: "Boots" },
  { keyword: "slippers", category: "Women", subcategory: "Slippers" },
  { keyword: "heels", category: "Women", subcategory: "Heels" },
  { keyword: "loafers", category: "Men", subcategory: "Loafers" },
  { keyword: "flats", category: "Women", subcategory: "Flats" },
  { keyword: "running shoes", category: "Men", subcategory: "Running" },
  { keyword: "sports shoes", category: "Men", subcategory: "Sports" },
  { keyword: "casual shoes", category: "Men", subcategory: "Casual" },
  { keyword: "formal shoes", category: "Men", subcategory: "Formal" },
  { keyword: "flip flops", category: "Men", subcategory: "Slippers" },
  { keyword: "canvas shoes", category: "Men", subcategory: "Casual" },
  { keyword: "leather shoes", category: "Men", subcategory: "Formal" },

  // ---- MEN ----
  { keyword: "men sneakers", category: "Men", subcategory: "Sneakers" },
  { keyword: "men casual shoes", category: "Men", subcategory: "Casual" },
  { keyword: "men formal shoes", category: "Men", subcategory: "Formal" },
  { keyword: "men running shoes", category: "Men", subcategory: "Running" },
  { keyword: "men sports shoes", category: "Men", subcategory: "Sports" },
  { keyword: "men boots", category: "Men", subcategory: "Boots" },
  { keyword: "men loafers", category: "Men", subcategory: "Loafers" },
  { keyword: "men sandals", category: "Men", subcategory: "Sandals" },
  { keyword: "men slippers", category: "Men", subcategory: "Slippers" },

  // ---- WOMEN ----
  { keyword: "women sneakers", category: "Women", subcategory: "Sneakers" },
  { keyword: "women casual shoes", category: "Women", subcategory: "Casual" },
  { keyword: "women heels", category: "Women", subcategory: "Heels" },
  { keyword: "women flats", category: "Women", subcategory: "Flats" },
  { keyword: "women boots", category: "Women", subcategory: "Boots" },
  { keyword: "women sandals", category: "Women", subcategory: "Sandals" },
  { keyword: "women slippers", category: "Women", subcategory: "Slippers" },

  // ---- KIDS ----
  { keyword: "kids sneakers", category: "Kids", subcategory: "Sneakers" },
  { keyword: "kids school shoes", category: "Kids", subcategory: "School Shoes" },
  { keyword: "kids sandals", category: "Kids", subcategory: "Sandals" },
  { keyword: "kids slippers", category: "Kids", subcategory: "Slippers" },
  { keyword: "kids shoes", category: "Kids", subcategory: "Casual" },
  { keyword: "boys shoes", category: "Kids", subcategory: "Casual" },
  { keyword: "girls shoes", category: "Kids", subcategory: "Casual" },
];
