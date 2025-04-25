import { Inter } from "next/font/google"
import "./globals.css"
import NavMenu from "@/components/nav-menu"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ThemeProvider } from "@/components/theme-provider"
import { PageTransition } from "@/components/ui/page-transition"
import { BottomNav } from "@/components/ui/bottom-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FlashBid - Live Auction Platform",
  description: "Bid on exclusive items in real-time.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Main navigation - shows on all screen sizes */}
          <NavMenu />
          
          <div className="container mx-auto px-4 pb-16 md:pb-0">
            <Breadcrumb className="py-4" />
            <PageTransition>
              <main>{children}</main>
            </PageTransition>
          </div>
          
          {/* Mobile navigation bar - only shows on mobile */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
} 