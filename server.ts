import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Image Generation Endpoint
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, productName, category } = req.body;
      
      const userPrompt = (prompt || '').trim();
      const pName = (productName || '').trim();

      if (!userPrompt && !pName) {
        return res.status(400).json({ error: "الرجاء كتابة وصف للصورة أو اسم المنتج" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "مفتاح GEMINI_API_KEY غير متوفر في بيئة الخادم. يرجى التأكد من إضافته في إعدادات Secrets.",
          needsKey: true 
        });
      }

      const ai = getGenAI();

      // Construct a high-quality, realistic supermarket product photography prompt
      let finalPrompt = "";
      if (userPrompt) {
        finalPrompt = `${userPrompt}, commercial supermarket product photo, clean white or grocery shelf background, studio lighting, crisp packaging, 4k sharp focus, professional retail presentation`;
      } else {
        const categoryDesc = category ? `in ${category} category` : 'supermarket product';
        finalPrompt = `High quality commercial product photo of ${pName} (${categoryDesc}), authentic retail packaging, clean minimalist studio background, bright lighting, sharp focus, 4k`;
      }

      let generatedImageUrl: string | null = null;

      // Try with gemini-3.1-flash-lite-image first
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              { text: finalPrompt }
            ]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            }
          }
        });

        const candidates = response.candidates || [];
        if (candidates.length > 0 && candidates[0].content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (err: any) {
        console.warn("Retrying with gemini-3.1-flash-image...", err?.message);
        try {
          const response2 = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: {
              parts: [
                { text: finalPrompt }
              ]
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1",
              }
            }
          });

          const candidates2 = response2.candidates || [];
          if (candidates2.length > 0 && candidates2[0].content?.parts) {
            for (const part of candidates2[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
                break;
              }
            }
          }
        } catch (err2: any) {
          console.error("Image generation failed:", err2);
          throw err2;
        }
      }

      if (!generatedImageUrl) {
        return res.status(500).json({ error: "لم يتمكن الذكاء الاصطناعي من تكوين الصورة، يرجى المحاولة مرة أخرى أو تعديل الوصف." });
      }

      return res.json({ 
        success: true, 
        imageUrl: generatedImageUrl,
        prompt: finalPrompt
      });

    } catch (error: any) {
      console.error("API /api/generate-image Error:", error);
      return res.status(500).json({ 
        error: error.message || "حدث خطأ أثناء توليد الصورة بالذكاء الاصطناعي." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
