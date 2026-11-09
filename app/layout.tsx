import "./global.css";
import type { Metadata, Viewport } from "next";
import { Karla } from "next/font/google";
import type { ReactNode } from "react";

const siteFont = Karla({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-site"
});

export const metadata: Metadata = {
  description: "Shows which k3s node served this page.",
  title: "k3s | Yoginth"
};

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#faf8fc"
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      className={`${siteFont.variable} min-w-80 bg-site text-ink`}
      lang="en"
    >
      <body className="min-h-dvh bg-site font-sans text-base leading-[1.75] tracking-[-0.02em] text-ink">
        <div className="flex min-h-dvh flex-col py-12 sm:py-18">
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="mx-auto mt-24 w-full max-w-2xl px-5 text-[0.8125rem] leading-[1.8] text-muted">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-muted/20 pt-5">
              <a className="no-underline" href="https://yoginth.com">
                yoginth.com
              </a>
              <a
                className="no-underline"
                href="https://github.com/bigint/k3s-yoginth-com"
                rel="noopener noreferrer"
                target="_blank"
              >
                Source
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
