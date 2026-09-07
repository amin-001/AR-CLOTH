import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    gender: {
      type: [String],
      enum: ["male", "female", "unisex"],
      required: true
    },

    sizes: {
      type: [String],
      enum: ["S", "M", "L", "XL"],
      required: true
    },

    occasions: {
      type: [String],
      enum: ["wedding", "eid", "party", "traditional"],
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    images: {
      type: [String],
      default: []
    },
    link: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);