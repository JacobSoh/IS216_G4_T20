/* Importing Style or Fonts */
import { Inter } from "next/font/google";
import '@/styles/globals.css';

/* Importing Components */
import Navbar from "@/components/_navbar";
import Footer from "@/components/_footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-linear-(--custom-body-bg) bg-no-repeat text-(--custom-text-primary) leading-[1.6]`}
      >
        <Navbar/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
