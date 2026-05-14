import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
export const metadata: Metadata = {
  title: 'Roda Tiga Jakarta',
  description: 'Platform bajaj listrik Jakarta',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
