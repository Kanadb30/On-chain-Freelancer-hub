import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { WalletProvider } from "@/components/WalletProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "On-Chain Freelancer Hub",
  description: "A decentralized, trustless freelance marketplace smart contract built on Stellar",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} font-sans antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f7f9fb] text-slate-900 overflow-x-hidden">
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
