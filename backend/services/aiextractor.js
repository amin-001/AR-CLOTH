import { openai } from "./openai.js";

export async function extractAttributes(imageBase64, userPrompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
You are a fashion assistant AI.
Return only JSON.
Extract:
- gender (male/female)
- estimated_size (S/M/L/XL)
- occasion (from user text)
        `
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `User prompt: ${userPrompt}`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}