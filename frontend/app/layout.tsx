import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Navigation from '@/components/Navigation'
import HeaderClient from '@/components/HeaderClient'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'KiranaFlow AI — Underwriting Workstation',
  description: 'AI-powered remote cash-flow underwriting for Kirana stores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme script — runs before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var saved = localStorage.getItem('kirana-theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (saved === 'dark' || (!saved && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className={inter.className}>

        {/* ── Header ── */}
        <header
          className="sticky top-0 z-50 backdrop-blur-xl"
          style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)' }}
        >
          <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo mark */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,78,0,0.1)', border: '1px solid rgba(245,78,0,0.22)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="#f54e00" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>KiranaFlow</span>
                <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--primary)' }}> AI</span>
              </div>
              <div className="hidden sm:block h-4 w-px mx-1" style={{ background: 'var(--hairline)' }} />
              <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--muted)' }}>
                NBFC Underwriting Workstation
              </span>
            </div>
            <HeaderClient />
          </div>
        </header>

        <Navigation />

        <main className="min-h-screen">{children}</main>

        <footer className="mt-16" style={{ borderTop: '1px solid var(--hairline)', background: 'var(--canvas)' }}>
          <div className="max-w-[1800px] mx-auto px-6 py-5">
            <p className="text-center text-xs font-medium" style={{ color: 'var(--muted)' }}>
              KiranaFlow AI · Computer Vision + ML Underwriting · NBFC Analyst Workstation
            </p>
          </div>
        </footer>

      </body>
    </html>
  )
}
