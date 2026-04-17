import { GoogleGenAI } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { imageBase64 } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              text: "Retouch this portrait photo. Smoothen the skin, remove acne and blemishes, even out skin tone, and enhance the overall appearance naturally. Keep the person looking realistic, not over-edited. Return only the retouched image.",
            },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const parts = response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (imagePart) {
      res.status(200).json({
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      });
    } else {
      res.status(500).json({ error: "No image returned from Gemini" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
