import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mood BGM",
  description:
    "Pick a mood, get an endless procedurally-generated soundtrack — and export it as WAV. Emotion lives in structure: scale, progression, tempo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
