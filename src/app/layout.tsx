import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "frelo Intelligence — Brand Brain",
  description: "A living intelligence engine for frelo. Ask anything, test hypotheses, discover avatars.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "frelo Intel",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1B0D02",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
