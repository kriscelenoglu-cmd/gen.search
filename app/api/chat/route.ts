import { NextRequest, NextResponse } from "next/server";
import type { SafeChatResponse, SafeProduct } from "@/lib/types";

// Backend'de OpenAI'dan gelen ham yanıt tipi
interface OpenAIResponse {
  output?: Array<{
    type?: string;
    role?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

// OpenAI'dan parse edilen JSON formatı (text alanı içindeki JSON)
interface ParsedAIResponse {
  message?: string;
  type?: string;
  products?: Array<{
    product_name?: string;
    price?: number;
    currency?: string;
    image_url?: string;
    discount?: number;
    model_code?: string;
  }>;
}

// Ürün tipi - ayrı interface olarak tanımla
interface ProductItem {
  product_name?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  discount?: number;
  model_code?: string;
}

// Ürünleri güvenli formata dönüştür - sadece izin verilen alanları al
function sanitizeProduct(product: ProductItem): SafeProduct | null {
  // Gerekli alanlar yoksa null döndür
  if (!product.product_name || typeof product.price !== "number") {
    return null;
  }

  return {
    product_name: String(product.product_name).slice(0, 200),
    price: Number(product.price),
    currency: String(product.currency || "TRY").slice(0, 10),
    image_url: sanitizeImageUrl(product.image_url),
    discount: Number(product.discount) || 0,
    model_code: String(product.model_code || "").slice(0, 50),
  };
}

// Resim URL'sini güvenli hale getir
function sanitizeImageUrl(url?: string): string {
  if (!url) return "";
  
  try {
    const parsed = new URL(url);
    // HTTP ve HTTPS'e izin ver (dummyimage.com için)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "";
    }
    return url;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json<SafeChatResponse>(
        {
          message: "Lütfen geçerli bir mesaj girin.",
          type: "error",
          products: [],
        },
        { status: 400 }
      );
    }

    const sanitizedMessage = message.slice(0, 1000);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[v0] OPENAI_API_KEY is not configured");
      return NextResponse.json<SafeChatResponse>(
        {
          message: "Sistem yapılandırması eksik. Lütfen daha sonra tekrar deneyin.",
          type: "error",
          products: [],
        },
        { status: 500 }
      );
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: {
          id: "pmpt_69b2c8f8fc64819798c197ae0dfd430606690605b520b122",
          version: "1",
        },
        input: sanitizedMessage,
      }),
    });

    if (!openaiResponse.ok) {
      console.error("[v0] OpenAI API error:", openaiResponse.status, openaiResponse.statusText);
      return NextResponse.json<SafeChatResponse>(
        {
          message: "Bir hata oluştu. Lütfen tekrar deneyin.",
          type: "error",
          products: [],
        },
        { status: 500 }
      );
    }

    const data: OpenAIResponse = await openaiResponse.json();
    
    console.log("[v0] OpenAI raw response:", JSON.stringify(data, null, 2));
    
    // OpenAI response yapısı: output array'inde assistant mesajı var
    const assistantOutput = data.output?.find(
      (item) => item.role === "assistant" || item.type === "message"
    );
    
    console.log("[v0] Assistant output:", JSON.stringify(assistantOutput, null, 2));
    
    const outputText = assistantOutput?.content?.find(
      (c) => c.type === "output_text"
    )?.text;

    console.log("[v0] Output text:", outputText);

    if (!outputText) {
      return NextResponse.json<SafeChatResponse>({
        message: "Yanıt alınamadı. Lütfen tekrar deneyin.",
        type: "error",
        products: [],
      });
    }

    let parsed: ParsedAIResponse;
    try {
      parsed = JSON.parse(outputText);
      console.log("[v0] Parsed response:", JSON.stringify(parsed, null, 2));
    } catch {
      console.error("[v0] Failed to parse AI response JSON:", outputText);
      return NextResponse.json<SafeChatResponse>({
        message: "Yanıt işlenemedi. Lütfen tekrar deneyin.",
        type: "error",
        products: [],
      });
    }

    const safeProducts: SafeProduct[] = [];
    if (Array.isArray(parsed.products)) {
      for (const product of parsed.products) {
        const safeProduct = sanitizeProduct(product);
        if (safeProduct) {
          safeProducts.push(safeProduct);
        }
      }
    }

    const safeResponse: SafeChatResponse = {
      message: String(parsed.message || "").slice(0, 2000),
      type: parsed.type === "product_list" ? "product_list" : "info",
      products: safeProducts,
    };

    return NextResponse.json(safeResponse);
  } catch (error) {
    console.error("[v0] Unexpected error in chat API:", error);
    return NextResponse.json<SafeChatResponse>(
      {
        message: "Beklenmeyen bir hata oluştu.",
        type: "error",
        products: [],
      },
      { status: 500 }
    );
  }
}
