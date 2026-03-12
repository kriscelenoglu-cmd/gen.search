"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface Product {
  product_name: string
  price: number
  currency: string
  image_url: string
  discount: number
  model_code: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  products?: Product[]
  timestamp: Date
}

interface DebugInfo {
  rawOutputType?: string
  status?: string
  model?: string
}

interface ApiResponse {
  message: string
  type?: string
  products?: Product[]
  error?: string
  _debug?: DebugInfo
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
      <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
      <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" />
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const formattedPrice = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: product.currency,
    minimumFractionDigits: 0,
  }).format(product.price)

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={product.image_url}
          alt={product.product_name}
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = `https://dummyimage.com/600x400/cccccc/000000&text=${encodeURIComponent(product.product_name)}`
          }}
        />
        {product.discount > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
            İndirimli
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h4 className="line-clamp-1 font-medium text-card-foreground">{product.product_name}</h4>
        <p className="text-sm text-muted-foreground">Kod: {product.model_code}</p>
        <p className="text-lg font-semibold text-primary">{formattedPrice}</p>
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-secondary text-secondary-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        
        {message.products && message.products.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {message.products.map((product, index) => (
              <ProductCard key={`${product.model_code}-${index}`} product={product} />
            ))}
          </div>
        )}
        
        <span className="mt-1 block text-right text-xs opacity-60">
          {message.timestamp.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}

function DebugPanel({ data, onClose }: { data: ApiResponse | null; onClose: () => void }) {
  if (!data) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-auto rounded-lg border border-border bg-card p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Debug Bilgisi</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>
      <pre className="overflow-auto rounded bg-muted p-2 text-xs text-muted-foreground">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Merhaba! Size mobilya ürünlerimiz hakkında yardımcı olabilirim. Hangi ürünü arıyorsunuz?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [debugData, setDebugData] = useState<ApiResponse | null>(null)
  const [showDebug, setShowDebug] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    // Kullanıcı mesajını ekle
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedInput }),
      })

      const data: ApiResponse = await response.json()

      // Debug için konsola ve debug panel'e yaz
      console.log("[ChatBot] API Response:", data)
      setDebugData(data)

      if (!response.ok || data.error) {
        console.error("[ChatBot] API Hatası:", data.error || response.statusText)
        throw new Error(data.error || "API isteği başarısız oldu")
      }

      // Assistant mesajını ekle
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        products: data.products,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[ChatBot] Hata:", error)

      // Hata mesajını ekle
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-card-foreground">Ürün Asistanı</h1>
            <p className="text-xs text-muted-foreground">Mobilya ürünleri hakkında yardımcı olurum</p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="chat-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-secondary text-secondary-foreground">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-border bg-card px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Aradığınız ürün hakkında detay yazın."
            disabled={isLoading}
            className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gönder"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </footer>

      {/* Debug Panel - Geliştirme aşamasında (sonra kaldırılacak) */}
      {showDebug && (
        <DebugPanel data={debugData} onClose={() => setShowDebug(false)} />
      )}

      {/* Debug Toggle Button */}
      {!showDebug && debugData && (
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-4 right-4 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/80"
        >
          Debug Göster
        </button>
      )}
    </div>
  )
}
