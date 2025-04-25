// This is a simplified socket.io client implementation
// In a real app, you would use a more robust solution

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export const initializeSocket = (url: string) => {
  if (!socket) {
    socket = io(url, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on("connect", () => {
      console.log("Socket connected")
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err)
    })
  }

  return socket
}

export const joinAuctionRoom = (auctionId: string) => {
  if (!socket) return
  socket.emit("join_auction", { auctionId })
}

export const leaveAuctionRoom = (auctionId: string) => {
  if (!socket) return
  socket.emit("leave_auction", { auctionId })
}

export const placeBid = (auctionId: string, amount: number) => {
  if (!socket) return
  socket.emit("place_bid", { auctionId, amount })
}

export const onNewBid = (callback: (data: any) => void) => {
  if (!socket) return
  socket.on("new_bid", callback)
}

export const onAuctionUpdate = (callback: (data: any) => void) => {
  if (!socket) return
  socket.on("auction_update", callback)
}

export const onAuctionEnd = (callback: (data: any) => void) => {
  if (!socket) return
  socket.on("auction_end", callback)
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
