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
      <body>
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-credit">
              <span className="site-footer-eyebrow">Developed by</span>
              <strong>Muhammad Taraz</strong>
            </div>
            <nav className="site-footer-links" aria-label="Developer links">
              <a
                href="https://www.linkedin.com/in/muhammad-taraz-ansari-747b782a3"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href="https://github.com/Muhammad-taraz"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <span aria-hidden="true">↗</span>
              </a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
