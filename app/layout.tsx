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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;900&family=Archivo+Black&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
