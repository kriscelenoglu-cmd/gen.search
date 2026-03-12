// Frontend'de güvenli olarak gösterilebilecek ürün bilgileri
export interface SafeProduct {
  product_name: string;
  price: number;
  currency: string;
  image_url: string;
  discount: number;
  model_code: string;
}

// Frontend'e gönderilecek güvenli yanıt formatı
export interface SafeChatResponse {
  message: string;
  type: "product_list" | "info" | "error";
  products: SafeProduct[];
}

// Chat mesajı tipi
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: SafeProduct[];
  type?: "product_list" | "info" | "error";
  isLoading?: boolean;
}
