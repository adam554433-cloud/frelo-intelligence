import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "frelo Intelligence — Brand Brain",
  description: "A living intelligence engine for frelo. Ask anything, test hypotheses, discover avatars.",
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
