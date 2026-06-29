import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/components/user-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Community Hero",
  description: "Hyperlocal civic issue reporting platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster richColors position="top-right" />
        </UserProvider>
      </body>
    </html>
  )
}