import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NicknameProvider } from "@/context/NicknameContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MultiSynq Chat",
  description: "Real-time chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NicknameProvider>{children}</NicknameProvider>
      </body>
    </html>
  );
}
