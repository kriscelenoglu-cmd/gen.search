"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, SafeChatResponse } from "@/lib/types";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { MessageCircle } from "lucide-react";

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Merhaba! Ben mobilya asistanınızım. Size en uygun mobilya ürünlerini bulmak için buradayım. Hangi tür mobilya arıyorsunuz?",
      type: "info",
      products: [],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Yeni mesaj geldiğinde aşağı kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Kullanıcı mesajını ekle
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    // Loading mesajını ekle
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });

      const data: SafeChatResponse = await response.json();

      // Loading mesajını gerçek yanıtla değiştir
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        type: data.type,
        products: data.products,
      };

      setMessages((prev) =>
        prev.filter((m) => !m.isLoading).concat(assistantMessage)
      );
    } catch (error) {
      console.error("[v0] Chat error:", error);
      
      // Hata durumunda loading mesajını hata mesajıyla değiştir
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        type: "error",
        products: [],
      };

      setMessages((prev) =>
        prev.filter((m) => !m.isLoading).concat(errorMessage)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-card-foreground">
            Mobilya Asistanı
          </h1>
          <p className="text-xs text-muted-foreground">
            Size uygun ürünleri bulmak için buradayım
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
