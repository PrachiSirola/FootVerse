/**
 * FOOTWEAR CATEGORY SEED
 *
 * The category-ID crawler's primary source. These are CJ's stable footwear
 * category IDs (verified via getCategory). Each carries a category/subcategory
 * HINT used only as a fallback by the name-based classifier in transformCJLive —
 * the classifier resolves the real Men/Women/Kids/Sports bucket from the product
 * NAME, so these hints never misfile a product; they just seed a sensible guess.
 *
 * This seed is always included in the crawl. cjCategoryService.discoverFootwear()
 * unions it with categories auto-discovered from getCategory() at runtime, so new
 * footwear categories CJ adds are picked up automatically while these known-good
 * IDs are guaranteed present even if CJ renames something and discovery misses it.
 */
export const FOOTWEAR_CATEGORY_SEED = [
  // ---- Women's Shoes ----
  { categoryId: "1988B912-7A18-4ED2-B1E1-61ED290A0E82", name: "Woman Boots",     category: "Women", subcategory: "Boots" },
  { categoryId: "1B559D30-B370-4C8E-8CFD-1E1BC47E217F", name: "Vulcanize Shoes", category: "Women", subcategory: "Sneakers" },
  { categoryId: "638284D0-3651-4FC9-9F25-B0A0BA323D83", name: "Pumps",           category: "Women", subcategory: "Heels" },
  { categoryId: "8F756420-4840-474E-B2D6-6725ED219970", name: "Woman Slippers",  category: "Women", subcategory: "Slippers" },
  { categoryId: "AAB54987-4E92-40C7-B0F5-5E814C1E6980", name: "Woman Sandals",   category: "Women", subcategory: "Sandals" },
  { categoryId: "F35FC838-1CFE-49D1-A8CA-CF7401F9C444", name: "Flats",           category: "Women", subcategory: "Flats" },

  // ---- Men's Shoes ----
  { categoryId: "0F0296D6-F057-4FD4-9E06-95D5DBCCE6EB", name: "Man Boots",       category: "Men",   subcategory: "Boots" },
  { categoryId: "11C9DE73-0438-40E2-80B8-72697795C9F2", name: "Formal Shoes",    category: "Men",   subcategory: "Formal" },
  { categoryId: "312428E8-5075-4F74-A317-8EB051C0C068", name: "Man Slippers",    category: "Men",   subcategory: "Slippers" },
  { categoryId: "B8640E7B-F07D-4C0F-A5CF-8ACC533DA86F", name: "Vulcanize Shoe",  category: "Men",   subcategory: "Sneakers" },
  { categoryId: "D0E37ED0-65C8-43E3-8B84-C973040DCE9C", name: "Man Sandals",     category: "Men",   subcategory: "Sandals" },
  { categoryId: "F419006D-AE55-4691-93FC-52FEBB459DBA", name: "Casual Shoes",    category: "Men",   subcategory: "Casual" },
];

/**
 * NICHE KEYWORD FALLBACK
 *
 * A small supplement for athletic/sport styles that don't have their own CJ
 * footwear category (Sports is a top-level storefront category, but CJ files
 * these under generic shoe categories). Run AFTER the category crawl, with the
 * same dedup/points/QPS logic, so they only add the handful of extra unique
 * products categories miss. Deliberately tiny — the opposite of the old 369.
 */
export const NICHE_KEYWORDS = [
  { keyword: "football shoes",   category: "Sports", subcategory: "Football" },
  { keyword: "soccer cleats",    category: "Sports", subcategory: "Football" },
  { keyword: "basketball shoes", category: "Sports", subcategory: "Basketball" },
  { keyword: "hiking boots",     category: "Sports", subcategory: "Hiking" },
  { keyword: "trekking shoes",   category: "Sports", subcategory: "Hiking" },
  { keyword: "running shoes",    category: "Sports", subcategory: "Running" },
  { keyword: "trail running",    category: "Sports", subcategory: "Running" },
  { keyword: "kids shoes",       category: "Kids",   subcategory: "Sneakers" },
  { keyword: "children sandals", category: "Kids",   subcategory: "Sandals" },
  { keyword: "baby shoes",       category: "Kids",   subcategory: "Sneakers" },
  { keyword: "toddler boots",    category: "Kids",   subcategory: "Boots" },
  { keyword: "school shoes",     category: "Kids",   subcategory: "Casual" },
];

export default FOOTWEAR_CATEGORY_SEED;