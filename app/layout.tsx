import "./global.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const siteFont = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-site"
});

export const metadata: Metadata = {
  description: "Shows which k3s node served this page.",
  title: "k3s | Yoginth"
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#101010"
};

const linkClassName =
  "text-muted no-underline hover:text-heading hover:underline";

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      className={`${siteFont.variable} min-w-80 bg-site text-ink`}
      lang="en"
    >
      <body className="min-h-dvh bg-site font-sans text-body text-ink antialiased">
        <a
          className="fixed top-2 left-4 z-50 translate-y-[-150%] rounded border border-muted bg-site px-3.5 py-2.5 font-title text-heading no-underline focus-visible:translate-y-0"
          href="#main-content"
        >
          Skip to main content
        </a>
        <div className="flex min-h-dvh flex-col py-12 sm:py-18">
          <header className="mx-auto w-full max-w-2xl px-5">
            <div className="flex items-start justify-between gap-x-4 sm:gap-x-6">
              <a
                className="mt-1.25 block size-4.5 shrink-0 bg-mark forced-colors:bg-[CanvasText]"
                href="https://yoginth.com"
              >
                <span className="sr-only">Yoginth, home</span>
              </a>
              <nav
                aria-label="Site"
                className="flex flex-wrap justify-end gap-x-3.5 gap-y-1 sm:gap-x-5"
              >
                <a className={linkClassName} href="https://yoginth.com/blog">
                  blog
                </a>
                <a
                  className={linkClassName}
                  href="https://github.com/bigint/k3s-yoginth-com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  source
                  <span aria-hidden="true" className="ml-0.5 text-[0.78em]">
                    ↗
                  </span>
                </a>
              </nav>
            </div>
          </header>
          <main
            className="mt-12 flex flex-1 flex-col sm:mt-14"
            id="main-content"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
