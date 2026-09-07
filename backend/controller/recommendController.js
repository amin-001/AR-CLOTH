import Product from "../models/product.js";
import { extractAttributes } from "../services/aiextractor.js";

const OCCASION_KEYWORDS = [
  { value: "eid", keywords: ["eid", "eid al-fitr", "eid al-adha"] },
  { value: "wedding", keywords: ["wedding", "marriage", "bridal", "groom"] },
  { value: "party", keywords: ["party", "celebration", "celebrate", "event"] },
  { value: "traditional", keywords: ["traditional", "culture", "cultural", "heritage"] },
  { value: "casual", keywords: ["casual", "everyday", "informal"] },
  { value: "formal", keywords: ["formal", "business", "office", "professional"] },
  { value: "sports", keywords: ["sports", "athletic", "exercise", "workout"] },
  { value: "mehendi", keywords: ["mehendi", "Dolki", "dolki", "pithi"] }
];

function inferOccasionFromPrompt(prompt = "") {
  const normalized = String(prompt).toLowerCase();
  for (const mapping of OCCASION_KEYWORDS) {
    if (mapping.keywords.some((keyword) => normalized.includes(keyword))) {
      return mapping.value;
    }
  }
  return undefined;
}

export const recommendProducts = async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageBase64 = req.file.buffer.toString("base64");

    const aiData = await extractAttributes(imageBase64, prompt);
    console.log("recommend controller ---> Extracted AI Data:", aiData);

    const products = await Product.find({
      gender: { $in: [aiData.gender, "unisex"] },
      sizes: aiData.estimated_size,
      occasions: aiData.occasion
    });

    res.json({
      filters: aiData,
      products
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { size, gender, prompt } = req.body || {};

    const occasion = inferOccasionFromPrompt(prompt);

    const query = {};

    if (gender) {
      query.gender = { $in: [gender, "unisex"] };
    }

    if (size) {
      query.sizes = size;
    }

    if (occasion) {
      query.occasions = occasion;
    }

    const products = await Product.find(query);

    res.json({
      filters: { size, gender, occasion, prompt },
      products
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};