import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import { WalletProvider } from "@/components/wallet-provider";
import { ToastProvider } from "@/components/toast-provider";
import WalletSidebar from "@/components/wallet-sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zing — Stellar-Native Trading & Launch Platform",
  description:
    "Trade, launch, and grow on Stellar. Non-custodial DEX trading, token launches, social campaigns, and trading competitions — all in one platform.",
  keywords: "Stellar, DEX, trading, Soroban, XLM, USDC, launchpad, DeFi",
  openGraph: {
    title: "Zing — Stellar-Native Trading & Launch Platform",
    description: "Trade on Stellar DEX. Launch tokens. Run campaigns. All chain-abstracted.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" style={{ background: "#09090B", color: "#F4F4F5" }}>
        <ToastProvider>
          <WalletProvider>
            <Nav />
            <main className="flex-1 flex flex-col">{children}</main>
            <WalletSidebar />
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
