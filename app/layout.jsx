import { Inter } from "next/font/google"
import "./globals.css"
import NavMenu from "@/components/nav-menu"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FlashBid - Live Auction Platform",
  description: "Bid on exclusive items in real-time.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavMenu />
        <main>{children}</main>
      </body>
    </html>
  )
} 