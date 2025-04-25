// This is just a pass-through layout to maintain the navigation from the root layout
export default function AuctionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 