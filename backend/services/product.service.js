import Product from "../models/product.js";

export const bulkCreateProductsService = async (products) => {

    console.log("bulkCreateProductsService called with products:", products);
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("Products array is required");
  }

  const insertedProducts = await Product.insertMany(products, {
    ordered: false // continue inserting even if one fails
  });

  return insertedProducts;
};