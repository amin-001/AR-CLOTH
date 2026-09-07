import { bulkCreateProductsService } from "../services/product.service.js";

export const bulkCreateProducts = async (req, res) => {
  try {
    const { products } = req.body;
    console.log("Received products for bulk creation:", req.body);
    const result = await bulkCreateProductsService(products);

    res.status(201).json({
      message: "Products inserted successfully",
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      message: "Bulk insert failed",
      error: error.message
    });
  }
};