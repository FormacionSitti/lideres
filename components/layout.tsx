import type React from "react"
import Image from "next/image"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <Image
            src="https://sjc.microlink.io/AXXfO6dKYeF3dZxutItVGzzA6EwBwmj6NOWE3bLydZHFwn4MtONrZiJLZMQ_DOG2Oeo9sDL_WzbH2Hy1uzjQ9w.jpeg"
            alt="Sitti Logo"
            width={40}
            height={40}
            className="mr-3"
          />
          <h1 className="text-xl font-semibold">Seguimiento a Líderes</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
