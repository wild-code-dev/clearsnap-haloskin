const { VertexAI } = require("@google-cloud/vertexai");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const project = process.env.GOOGLE_CLOUD_PROJECT;

    const vertexAI = new VertexAI({
      project,
      location: "us-central1",
      googleAuthOptions: { credentials },
    });

    const model = vertexAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    });

    const { imageBase64 } = req.body;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
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
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const parts = result.response.candidates[0].content.parts;
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
