'use client'

/**
 * Componente Anti-Scraping
 * Wrapper simples sem bloqueio de JavaScript
 */
export default function AntiScraping({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
