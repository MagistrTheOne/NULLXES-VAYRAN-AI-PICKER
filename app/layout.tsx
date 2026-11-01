import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./workspace.css";
import { SessionProvider } from "@/components/vayran/session";
import { CatalogProvider } from "@/components/vayran/catalog-provider";
import { NavigationRail, TopBar } from "@/components/vayran/shell";
import { version } from "@/package.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "VAYRAN — NULLXES", template: "%s — VAYRAN" },
  description:
    "NULLXES VAYRAN. Competitive draft intelligence for Mobile Legends: Bang Bang.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CatalogProvider><SessionProvider>
          <a href="#main-content" className="skip-link">
            Skip to workspace
          </a>
          <div className="application-shell">
            <NavigationRail version={version} />
            <div className="application-main">
              <TopBar />
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
              <footer className="application-footer">
                <span>
                  NULLXES VAYRAN <span className="footer-divider">/</span>{" "}
                  COMPETITIVE DRAFT INTELLIGENCE
                </span>
                <span>LOCAL WORKSPACE · NO LIVE PREDICTION</span>
              </footer>
            </div>
          </div>
        </SessionProvider></CatalogProvider>
      </body>
    </html>
  );
}
