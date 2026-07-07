import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    cjCategoryId: {
      type: String,
      unique: true,
      index: true,
    },

    name: String,

    parentId: String,

    level: Number,

    sort: Number,

    image: String,

    rawData: Object,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Category", categorySchema);