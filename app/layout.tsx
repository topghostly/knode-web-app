import type { Metadata, Viewport } from "next";
import { Geist_Mono, Stack_Sans_Headline, Stack_Sans_Text } from "next/font/google";
import "./globals.css";

const stackSansText = Stack_Sans_Text({
  variable: "--font-stack-sans-text",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const stackSansHeadline = Stack_Sans_Headline({
  variable: "--font-stack-sans-headline",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knode",
  description: "A ten-minute daily engineering workout for engineers who ship with AI.",
  applicationName: "Knode",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Knode", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#eadfc9",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${stackSansText.variable} ${stackSansHeadline.variable} ${geistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
