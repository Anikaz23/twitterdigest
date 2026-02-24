import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twitter Digest",
  description: "Your Twitter feed, distilled.",
};

const themeBootstrapScript = `
(() => {
  try {
    const stored = localStorage.getItem("ui-theme");
    const theme = stored === "x" || stored === "twitter" ? stored : "twitter";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", "twitter");
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="twitter" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
