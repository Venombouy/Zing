"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function ClickableRow({ href, children, style, className }: { href: string, children: React.ReactNode, style?: React.CSSProperties, className?: string }) {
  const router = useRouter();
  
  return (
    <tr 
      onClick={() => router.push(href)} 
      style={{ ...style, cursor: "pointer" }} 
      className={className}
    >
      {children}
    </tr>
  );
}
