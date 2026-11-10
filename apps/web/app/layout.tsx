import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MockLab — API Mocking + Contract Testing",
  description: "Design the API. Mock it in seconds. Prove it in CI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
