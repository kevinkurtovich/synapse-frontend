import type { Metadata } from "next";
import "./globals.css";
import "@/styles/layout.css";
import { AuthGate } from "@/components/molecules/AuthGate";
import { Sidebar } from "@/components/molecules/Sidebar";

export const metadata: Metadata = {
  title: "Synapse",
  description: "Companion personality management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          <div className="app-shell">
            <Sidebar />
            <main className="app-shell__content">
              {children}
            </main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
