import mongoose from "mongoose";

/**
 * Editable hero banner content for the storefront homepage. A single active
 * document drives the hero — admins change image/text/buttons without code.
 */
const HeroBannerSchema = new mongoose.Schema(
  {
    key: { type: String, default: "home-hero", unique: true, index: true },

    imageUrl: { type: String, default: "" },
    eyebrow: { type: String, default: "" },       // small label above the title
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },

    primaryCtaText: { type: String, default: "Shop Now" },
    primaryCtaHref: { type: String, default: "/products" },
    secondaryCtaText: { type: String, default: "" },
    secondaryCtaHref: { type: String, default: "" },

    active: { type: Boolean, default: true },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("HeroBanner", HeroBannerSchema);