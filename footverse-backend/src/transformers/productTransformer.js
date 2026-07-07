export function transformCJProduct(product, category, subcategory) {
  return {
    source: "cj",

    sourceProductId: product.id,

    name: product.nameEn,

    slug: product.sku.toLowerCase(),

    sku: product.sku,

    brand: "",

    gender: category.toLowerCase(),

    category,

    subcategory,

    description: "",

    price: Number(
      String(product.sellPrice)
        .split("--")[0]
        .trim()
    ),

    comparePrice: null,

    stock: product.warehouseInventoryNum || 0,

    featured: false,
    bestseller: false,
    newArrival: true,
    active: true,

    images: [
      {
        url: product.bigImage,
        isPrimary: true,
      },
    ],

    variants: [],
  };
}