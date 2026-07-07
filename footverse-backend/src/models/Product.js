import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
  {
    sku: String,
    color: String,
    size: String,
    price: Number,
    stock: Number,
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    sourceProductId: {
      type: String,
      default: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    brand: {
      type: String,
      default: "",
    },
    
    sku:{
      type:String
    },
    
    category: {
      type: String,
      required: true,
    },

    subcategory: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      enum: [
        "men",
        "women",
        "kids",
        "sports",
        "comfort",
        "accessories",
      ],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    specifications: {
      type: Map,
      of: String,
      default: {},
    },

    images: {
      type: [
        {
          url: String,
          isPrimary: Boolean,
        },
      ],
      default: [],
    },

    variants: {
      type: [VariantSchema],
      default: [],
    },

    price: Number,

    comparePrice: Number,

    stock: {
      type: Number,
      default: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    bestseller: {
      type: Boolean,
      default: false,
    },

    newArrival: {
      type: Boolean,
      default: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    source: {
      type: String,
      default: "cj",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", ProductSchema);