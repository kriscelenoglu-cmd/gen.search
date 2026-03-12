"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { ProductCard } from "./product-card";
import { User, Bot } from "lucide-react";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar - Sol tarafta bot için */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Mesaj baloncuğu */}
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          )}
        >
          {message.isLoading ? (
            <LoadingIndicator />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {/* Ürün listesi - sadece assistant mesajları için */}
        {!isUser && message.products && message.products.length > 0 && (
          <div className="w-full mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.products.map((product, index) => (
                <ProductCard key={`${product.model_code}-${index}`} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar - Sağ tarafta kullanıcı için */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
      </div>
      <span className="text-sm">Yanıt hazırlanıyor...</span>
    </div>
  );
}
