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

  // ---------------- MEN ----------------

  // Sneakers
  { keyword: "men sneakers", category: "Men", subcategory: "Sneakers" },
  { keyword: "running sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "casual sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "high top sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "low top sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "white sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "black sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "walking sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "mesh sneakers men", category: "Men", subcategory: "Sneakers" },
  { keyword: "fashion sneakers men", category: "Men", subcategory: "Sneakers" },

  // Casual
  { keyword: "men casual shoes", category: "Men", subcategory: "Casual" },
  { keyword: "canvas shoes men", category: "Men", subcategory: "Casual" },
  { keyword: "walking shoes men", category: "Men", subcategory: "Casual" },
  { keyword: "slip on shoes men", category: "Men", subcategory: "Casual" },
  { keyword: "daily wear shoes men", category: "Men", subcategory: "Casual" },
  { keyword: "comfortable shoes men", category: "Men", subcategory: "Casual" },
  { keyword: "boat shoes men", category: "Men", subcategory: "Casual" },
  { keyword: "mesh walking shoes men", category: "Men", subcategory: "Casual" },

  // Formal
  { keyword: "men formal shoes", category: "Men", subcategory: "Formal" },
  { keyword: "oxford shoes men", category: "Men", subcategory: "Formal" },
  { keyword: "derby shoes men", category: "Men", subcategory: "Formal" },
  { keyword: "brogue shoes men", category: "Men", subcategory: "Formal" },
  { keyword: "monk strap shoes", category: "Men", subcategory: "Formal" },
  { keyword: "business shoes men", category: "Men", subcategory: "Formal" },
  { keyword: "office shoes men", category: "Men", subcategory: "Formal" },
  { keyword: "dress shoes men", category: "Men", subcategory: "Formal" },
  { keyword: "wedding shoes men", category: "Men", subcategory: "Formal" },

  // Sports
  { keyword: "men sports shoes", category: "Men", subcategory: "Sports" },
  { keyword: "gym shoes men", category: "Men", subcategory: "Sports" },
  { keyword: "training shoes men", category: "Men", subcategory: "Sports" },
  { keyword: "fitness shoes men", category: "Men", subcategory: "Sports" },
  { keyword: "cross training shoes", category: "Men", subcategory: "Sports" },

  // Running
  { keyword: "men running shoes", category: "Men", subcategory: "Running" },
  { keyword: "marathon running shoes", category: "Men", subcategory: "Running" },
  { keyword: "trail running shoes", category: "Men", subcategory: "Running" },
  { keyword: "road running shoes", category: "Men", subcategory: "Running" },
  { keyword: "jogging shoes men", category: "Men", subcategory: "Running" },

  // Boots
  { keyword: "men boots", category: "Men", subcategory: "Boots" },
  { keyword: "chelsea boots men", category: "Men", subcategory: "Boots" },
  { keyword: "combat boots men", category: "Men", subcategory: "Boots" },
  { keyword: "work boots men", category: "Men", subcategory: "Boots" },
  { keyword: "ankle boots men", category: "Men", subcategory: "Boots" },
  { keyword: "desert boots men", category: "Men", subcategory: "Boots" },

  // Loafers
  { keyword: "men loafers", category: "Men", subcategory: "Loafers" },
  { keyword: "leather loafers men", category: "Men", subcategory: "Loafers" },
  { keyword: "driving loafers", category: "Men", subcategory: "Loafers" },
  { keyword: "moccasins men", category: "Men", subcategory: "Loafers" },
  { keyword: "penny loafers", category: "Men", subcategory: "Loafers" },

  // Sandals
  { keyword: "men sandals", category: "Men", subcategory: "Sandals" },
  { keyword: "leather sandals men", category: "Men", subcategory: "Sandals" },
  { keyword: "summer sandals men", category: "Men", subcategory: "Sandals" },
  { keyword: "beach sandals men", category: "Men", subcategory: "Sandals" },

  // Slippers
  { keyword: "men slippers", category: "Men", subcategory: "Slippers" },
  { keyword: "slide slippers men", category: "Men", subcategory: "Slippers" },
  { keyword: "house slippers men", category: "Men", subcategory: "Slippers" },
  { keyword: "bath slippers men", category: "Men", subcategory: "Slippers" },



  // ---------------- WOMEN ----------------

  // Sneakers
  { keyword: "women sneakers", category: "Women", subcategory: "Sneakers" },
  { keyword: "platform sneakers women", category: "Women", subcategory: "Sneakers" },
  { keyword: "running sneakers women", category: "Women", subcategory: "Sneakers" },
  { keyword: "walking sneakers women", category: "Women", subcategory: "Sneakers" },
  { keyword: "fashion sneakers women", category: "Women", subcategory: "Sneakers" },
  { keyword: "white sneakers women", category: "Women", subcategory: "Sneakers" },

  // Flats
  { keyword: "women flats", category: "Women", subcategory: "Flats" },
  { keyword: "ballet flats women", category: "Women", subcategory: "Flats" },
  { keyword: "office flats women", category: "Women", subcategory: "Flats" },
  { keyword: "comfortable flats women", category: "Women", subcategory: "Flats" },

  // Heels
  { keyword: "women heels", category: "Women", subcategory: "Heels" },
  { keyword: "high heels women", category: "Women", subcategory: "Heels" },
  { keyword: "stiletto heels women", category: "Women", subcategory: "Heels" },
  { keyword: "block heels women", category: "Women", subcategory: "Heels" },
  { keyword: "platform heels women", category: "Women", subcategory: "Heels" },
  { keyword: "pump heels women", category: "Women", subcategory: "Heels" },
  { keyword: "party heels women", category: "Women", subcategory: "Heels" },
  { keyword: "wedding heels women", category: "Women", subcategory: "Heels" },

  // Casual
  { keyword: "women casual shoes", category: "Women", subcategory: "Casual" },
  { keyword: "canvas shoes women", category: "Women", subcategory: "Casual" },
  { keyword: "walking shoes women", category: "Women", subcategory: "Casual" },
  { keyword: "comfortable shoes women", category: "Women", subcategory: "Casual" },

  // Formal
  { keyword: "women formal shoes", category: "Women", subcategory: "Formal" },
  { keyword: "office shoes women", category: "Women", subcategory: "Formal" },
  { keyword: "dress shoes women", category: "Women", subcategory: "Formal" },

  // Boots
  { keyword: "women boots", category: "Women", subcategory: "Boots" },
  { keyword: "ankle boots women", category: "Women", subcategory: "Boots" },
  { keyword: "knee high boots women", category: "Women", subcategory: "Boots" },
  { keyword: "combat boots women", category: "Women", subcategory: "Boots" },

  // Sandals
  { keyword: "women sandals", category: "Women", subcategory: "Sandals" },
  { keyword: "summer sandals women", category: "Women", subcategory: "Sandals" },
  { keyword: "flat sandals women", category: "Women", subcategory: "Sandals" },

  // Loafers
  { keyword: "women loafers", category: "Women", subcategory: "Loafers" },
  { keyword: "office loafers women", category: "Women", subcategory: "Loafers" },
  { keyword: "leather loafers women", category: "Women", subcategory: "Loafers" },

  // Slippers
  { keyword: "women slippers", category: "Women", subcategory: "Slippers" },
  { keyword: "slide slippers women", category: "Women", subcategory: "Slippers" },
  { keyword: "house slippers women", category: "Women", subcategory: "Slippers" },



  // ---------------- KIDS ----------------

  // School Shoes
  { keyword: "kids school shoes", category: "Kids", subcategory: "School Shoes" },
  { keyword: "boys school shoes", category: "Kids", subcategory: "School Shoes" },
  { keyword: "girls school shoes", category: "Kids", subcategory: "School Shoes" },
  { keyword: "black school shoes kids", category: "Kids", subcategory: "School Shoes" },

  // Sneakers
  { keyword: "kids sneakers", category: "Kids", subcategory: "Sneakers" },
  { keyword: "boys sneakers", category: "Kids", subcategory: "Sneakers" },
  { keyword: "girls sneakers", category: "Kids", subcategory: "Sneakers" },
  { keyword: "light up sneakers kids", category: "Kids", subcategory: "Sneakers" },

  // Sports
  { keyword: "kids sports shoes", category: "Kids", subcategory: "Sports" },
  { keyword: "kids running shoes", category: "Kids", subcategory: "Sports" },
  { keyword: "kids football shoes", category: "Kids", subcategory: "Sports" },

  // Sandals
  { keyword: "kids sandals", category: "Kids", subcategory: "Sandals" },
  { keyword: "boys sandals", category: "Kids", subcategory: "Sandals" },
  { keyword: "girls sandals", category: "Kids", subcategory: "Sandals" },

  // Boots
  { keyword: "kids boots", category: "Kids", subcategory: "Boots" },
  { keyword: "kids rain boots", category: "Kids", subcategory: "Boots" },
  { keyword: "kids winter boots", category: "Kids", subcategory: "Boots" },



  // ---------------- SPORTS & OUTDOOR ----------------

  // Football
  { keyword: "football shoes", category: "Sports", subcategory: "Football" },
  { keyword: "football boots", category: "Sports", subcategory: "Football" },
  { keyword: "soccer cleats", category: "Sports", subcategory: "Football" },
  { keyword: "soccer boots", category: "Sports", subcategory: "Football" },

  // Cricket
  { keyword: "cricket shoes", category: "Sports", subcategory: "Cricket" },
  { keyword: "cricket spikes", category: "Sports", subcategory: "Cricket" },

  // Basketball
  { keyword: "basketball shoes", category: "Sports", subcategory: "Basketball" },
  { keyword: "basketball sneakers", category: "Sports", subcategory: "Basketball" },
  { keyword: "high top basketball shoes", category: "Sports", subcategory: "Basketball" },

  // Hiking
  { keyword: "hiking shoes", category: "Sports", subcategory: "Hiking" },
  { keyword: "hiking boots", category: "Sports", subcategory: "Hiking" },
  { keyword: "climbing shoes", category: "Sports", subcategory: "Hiking" },
  { keyword: "mountaineering boots", category: "Sports", subcategory: "Hiking" },

  // Trekking
  { keyword: "trekking shoes", category: "Sports", subcategory: "Trekking" },
  { keyword: "trekking boots", category: "Sports", subcategory: "Trekking" },
  { keyword: "trail trekking shoes", category: "Sports", subcategory: "Trekking" },
  { keyword: "outdoor trekking boots", category: "Sports", subcategory: "Trekking" },
];