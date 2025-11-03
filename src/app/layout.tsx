import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import AuthSessionProvider from "@/components/providers/session-provider";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";
import "./fonts.css";

const interVariable = localFont({
  src: [
    {
      path: "../../public/fonts/InterVariable.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/InterVariable-Italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bring learning to life, never wait for the right tutorial again.",
  description: "Turn your questions into clear, on-demand explanations you can follow, refine, and build on instantly. Bring learning to life — one question at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-white">
      <body
        className={`${interVariable.variable} ${geistMono.variable} font-sans antialiased h-full`}
      >
        <AuthSessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
