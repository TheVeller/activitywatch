import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import ConnectionStatus from './ConnectionStatus'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-dark flex">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-sm border-b border-white/10 px-6 py-3">
          <ConnectionStatus />
        </div>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
