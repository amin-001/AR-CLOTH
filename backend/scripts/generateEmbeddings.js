import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Asset from "../models/Assets.js";
import client from "../utils/openai.js";
// import { fileURLToPath } from "url";


const MONGO = "mongodb+srv://am3161274_db_user:RienaLOUB8Z3yKRe@cluster0.kp2rdxc.mongodb.net/?appName=Cluster0";

async function generateEmbedding(filePath) {
  const buffer = fs.readFileSync(filePath);

  const response = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: buffer.toString("base64"),
    encoding_format: "float",
  });

  return response.data[0].embedding;
}

async function main() {
  await mongoose.connect(MONGO);

  // Fix __dirname for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

  const folder = path.join(__dirname, "../assets");
  const files = fs.readdirSync(folder);

  for (let file of files) {
    let category = file.startsWith("shirt")
      ? "shirt"
      : file.startsWith("pant")
      ? "pant"
      : file.startsWith("shoe")
      ? "shoe"
      : null;

    if (!category) continue;

    const fullPath = path.join(folder, file);
    const embedding = await generateEmbedding(fullPath);

    await Asset.findOneAndUpdate(
      { name: file },
      {
        name: file,
        category,
        imagePath: "assets/" + file,
        embedding,
      },
      { upsert: true }
    );

    console.log("Saved:", file);
  }

  process.exit(0);
}

main();

// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import client from "../utils/openrouter.js";

// // Fix dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// async function generateEmbedding(imagePath) {
//   const fileBuffer = fs.readFileSync(imagePath);

//   const embedding = await client.embeddings.create({
//     model: "openai/clip-vit-large-patch14", // Model hosted on OpenRouter
//     input: [...fileBuffer],
//   });

//   return embedding.data[0].embedding;
// }

// async function main() {
//   const folder = path.join(__dirname, "../assets");
//   const files = fs.readdirSync(folder);

//   const results = [];

//   for (let file of files) {
//     const filePath = path.join(folder, file);

//     console.log("Embedding:", file);

//     const embedding = await generateEmbedding(filePath);

//     results.push({
//       file,
//       embedding,
//     });
//   }

//   fs.writeFileSync("assetEmbeddings.json", JSON.stringify(results, null, 2));
//   console.log("Done! Embeddings saved.");
// }

// main();

