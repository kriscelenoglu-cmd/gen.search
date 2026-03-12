import { NextRequest, NextResponse } from "next/server"

// Güvenli alanlar - sadece bu alanlar frontend'e gönderilecek
interface SafeProduct {
  product_name: string
  price: number
  currency: string
  image_url: string
  discount: number
  model_code: string
}

interface SafeResponse {
  message: string
  type?: string
  products?: SafeProduct[]
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Geçersiz mesaj formatı" },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("[API] OPENAI_API_KEY ortam değişkeni tanımlı değil")
      return NextResponse.json(
        { error: "API yapılandırması eksik" },
        { status: 500 }
      )
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: {
          id: "pmpt_69b2c8f8fc64819798c197ae0dfd430606690605b520b122",
          version: "3",
        },
        input: message,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] OpenAI API hatası:", response.status, errorText)
      return NextResponse.json(
        { error: "API isteği başarısız oldu", status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Debug için tüm response'u logla (sadece sunucu tarafında)
    console.log("[API] OpenAI Response:", JSON.stringify(data, null, 2))

    // response.output[1].content[0].text içindeki JSON'u parse et
    let parsedContent: SafeResponse = { message: "Bir hata oluştu." }

    try {
      if (
        data.output &&
        Array.isArray(data.output) &&
        data.output[1] &&
        data.output[1].content &&
        Array.isArray(data.output[1].content) &&
        data.output[1].content[0] &&
        data.output[1].content[0].text
      ) {
        const textContent = data.output[1].content[0].text
        parsedContent = JSON.parse(textContent)
      } else if (
        data.output &&
        Array.isArray(data.output) &&
        data.output[0] &&
        data.output[0].content &&
        Array.isArray(data.output[0].content) &&
        data.output[0].content[0] &&
        data.output[0].content[0].text
      ) {
        // Alternatif yapı: output[0] içinde olabilir
        const textContent = data.output[0].content[0].text
        parsedContent = JSON.parse(textContent)
      }
    } catch (parseError) {
      console.error("[API] JSON parse hatası:", parseError)
      // Parse hatası durumunda ham text'i mesaj olarak kullan
      if (data.output?.[1]?.content?.[0]?.text) {
        parsedContent = { message: data.output[1].content[0].text }
      } else if (data.output?.[0]?.content?.[0]?.text) {
        parsedContent = { message: data.output[0].content[0].text }
      }
    }

    // Güvenli response oluştur - sadece izin verilen alanları döndür
    const safeResponse: SafeResponse = {
      message: parsedContent.message || "Cevap alınamadı.",
      type: parsedContent.type,
      products: parsedContent.products?.map((product) => ({
        product_name: product.product_name || "",
        price: product.price || 0,
        currency: product.currency || "TRY",
        image_url: product.image_url || "",
        discount: product.discount || 0,
        model_code: product.model_code || "",
      })),
    }

    // Debug bilgisi (geliştirme aşamasında - sonra kaldırılacak)
    return NextResponse.json({
      ...safeResponse,
      _debug: {
        rawOutputType: data.output?.[1]?.type || data.output?.[0]?.type,
        status: data.status,
        model: data.model,
      },
    })
  } catch (error) {
    console.error("[API] Beklenmeyen hata:", error)
    return NextResponse.json(
      { error: "Sunucu hatası oluştu" },
      { status: 500 }
    )
  }
}
