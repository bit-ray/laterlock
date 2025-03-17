import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "LaterLock - Time-Delayed Access",
  description: "Store any text securely. Wait for a delay to get it back.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={atkinson.className}>
        <div className="bg-muted min-h-screen flex flex-col">
          <div className="flex-grow">
            {children}
          </div>
          <Toaster position="bottom-right" />
          <footer className="mt-12 text-center text-sm text-muted-foreground pt-8 pb-2">
            <div className="flex flex-col sm:flex-row justify-center gap-0 sm:gap-2">
              <p>Copyright 2025 LaterLock</p>
              <p>
                <a href="https://www.flaticon.com/free-icons/vault" title="vault icons">Vault icon by Andrejs Kirma</a>
              </p>
            </div>
            <p>By using LaterLock, you agree to our <Link href="/terms" className="underline">Terms of Service</Link>.</p>
            <p>Made with ❤️ by <Link href="https://linktr.ee/blakeraymond_" className="underline">Blake Raymond</Link></p>
          </footer>
        </div>
      </body>
    </html>
  );
}
