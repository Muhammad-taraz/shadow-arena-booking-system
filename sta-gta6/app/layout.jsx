import { Barlow_Condensed, Figtree } from "next/font/google";
import "./globals.css";
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--display",
});
const body = Figtree({ subsets: ["latin"], variable: "--body" });
export const metadata = {
  title: "GTA VI Launch Sessions | Shadow Tournament Arena",
  description:
    "Reserve a PS5 session at Shadow Tournament Arena for GTA VI launch week.",
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#150b26",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
