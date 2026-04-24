import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import DisclaimerModal from "@/components/DisclaimerModal";
import ReminderScheduler from "@/components/ReminderScheduler";

export const metadata: Metadata = {
  title: "ClinCalc | 精準計算臨床決策平台",
  description:
    "AI 驅動的健康自查平台，支援圖片辨識、數據分析、醫療翻譯。AI-powered health platform with image recognition, data analysis, and medical translation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <DisclaimerModal />
            <ReminderScheduler />
            <Navbar />
            {/* pb-20 = space for mobile bottom nav */}
            <main className="pb-20 md:pb-0">{children}</main>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
