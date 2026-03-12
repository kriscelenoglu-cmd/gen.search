"use client";

import Image from "next/image";
import type { SafeProduct } from "@/lib/types";
import { Tag, Package } from "lucide-react";

interface ProductCardProps {
  product: SafeProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: product.currency || "TRY",
    minimumFractionDigits: 0,
  }).format(product.price);

  const hasDiscount = product.discount > 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Ürün Görseli */}
      <div className="relative aspect-[4/3] bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.product_name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* İndirim etiketi */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <Tag className="w-3 h-3" />
            %{product.discount} İndirim
          </div>
        )}
      </div>

      {/* Ürün Bilgileri */}
      <div className="p-3">
        <h3 className="font-medium text-card-foreground text-sm line-clamp-2 mb-1">
          {product.product_name}
        </h3>
        
        <p className="text-xs text-muted-foreground mb-2">
          Kod: {product.model_code}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-primary font-bold text-lg">
            {formattedPrice}
          </span>
        </div>
      </div>
    </div>
  );
}
