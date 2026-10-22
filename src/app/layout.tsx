import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Everyday Calculator",
  description: "A clear, straightforward calculator for everyday arithmetic.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
