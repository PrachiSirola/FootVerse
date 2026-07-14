/** Hero banner CMS — the storefront hero is editable from the admin panel. */
import HeroBanner from "../models/HeroBanner.js";

const DEFAULTS = {
  key: "home-hero",
  eyebrow: "Wholesale Footwear",
  title: "Your Universe of Footwear",
  subtitle: "Premium footwear at wholesale prices. Minimum order $600.",
  primaryCtaText: "Shop Now",
  primaryCtaHref: "/products",
  secondaryCtaText: "",
  secondaryCtaHref: "",
  imageUrl: "",
  active: true,
};

/** Public: the hero the storefront renders. Creates defaults on first run. */
export async function getHero() {
  let hero = await HeroBanner.findOne({ key: "home-hero" }).lean();
  if (!hero) {
    hero = (await HeroBanner.create(DEFAULTS)).toObject();
  }
  return hero;
}

/** Admin: update any hero field without touching code. */
export async function updateHero(patch, by = "") {
  let hero = await HeroBanner.findOne({ key: "home-hero" });
  if (!hero) hero = await HeroBanner.create(DEFAULTS);

  const fields = [
    "imageUrl",
    "eyebrow",
    "title",
    "subtitle",
    "primaryCtaText",
    "primaryCtaHref",
    "secondaryCtaText",
    "secondaryCtaHref",
    "active",
  ];
  for (const f of fields) {
    if (patch[f] !== undefined) hero[f] = patch[f];
  }
  hero.updatedBy = by;
  await hero.save();
  console.log(`[cms] hero banner updated by ${by || "admin"}`);
  return hero;
}