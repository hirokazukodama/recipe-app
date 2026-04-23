import { Inter, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ['700', '900'],
  variable: '--font-noto-serif',
});

export const metadata: Metadata = {
  title: "Recipe Auto-Importer",
  description: "Import your recipes automatically using AI.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Recipe",
  },
};

export const viewport = {
  themeColor: "#0c111d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSerif.variable} antialiased`}>
        <Header />
        <main style={{ minHeight: 'calc(100vh - 72px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
