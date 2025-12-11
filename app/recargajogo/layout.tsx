import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import HeadManager from "@/components/HeadManager"
import ClickTracker from "@/components/ClickTracker"
import PWAInstaller from "@/components/PWAInstaller"
import DynamicTheme from "@/components/DynamicTheme"
import VerificationWrapper from "@/components/VerificationWrapper"

export const metadata: Metadata = {
  title: "Diamantes FF Grátis - Dicas Free Fire, Cupons e Promoções FF",
  description: "Dicas exclusivas de Free Fire, cupons de diamantes grátis, promoções FF e estratégias para melhorar seu jogo. Aproveite eventos e ganhe recompensas!",
  keywords: [
    "diamantes ff grátis",
    "dicas free fire",
    "cupons ff",
    "promoções free fire",
    "eventos ff",
    "free fire dicas",
    "como ganhar diamantes ff",
    "cupons free fire grátis",
    "recarga free fire",
    "comprar diamantes free fire", 
    "diamantes free fire barato",
    "free fire recarga oficial",
    "site recarga free fire",
    "diamantes ff",
    "recarga ff oficial",
    "recarga delta force",
    "comprar creditos delta force",
    "delta force recarga oficial",
    "site recarga delta force",
    "recarga haikyu",
    "comprar moedas haikyu",
    "haikyu recarga oficial",
    "site recarga haikyu",
    "recarga jogo",
    "site de recarga de jogos",
    "recarga jogos mobile",
    "comprar creditos jogos",
    "recarga oficial jogos",
    "centro de recarga",
    "recarga segura jogos",
    "recarga rapida jogos",
    "bonus recarga jogos",
    "promocao recarga jogos"
  ],
  authors: [{ name: "Centro Oficial de Recarga" }],
  generator: "Next.js",
  applicationName: "Centro de Recarga Oficial",
  referrer: "origin-when-cross-origin",
  creator: "Centro de Recarga",
  publisher: "Centro de Recarga Oficial",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'),
  alternates: {
    canonical: "/recargajogo",
  },
  openGraph: {
    title: "Recarga Free Fire, Delta Force, Haikyu - Site Oficial",
    description: "🔥 Compre diamantes Free Fire, créditos Delta Force e moedas Haikyu com segurança! Recarga oficial com bônus exclusivos e preços promocionais.",
    url: "/recargajogo",
    siteName: "Centro de Recarga Oficial",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Centro de Recarga Oficial - Free Fire, Delta Force, Haikyu"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Recarga Free Fire, Delta Force, Haikyu - Site Oficial",
    description: "🔥 Compre diamantes Free Fire, créditos Delta Force e moedas Haikyu com segurança! Recarga oficial.",
    images: ["/images/twitter-card.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Centro de Recarga Oficial"
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  }
}

export default function RecargaJogoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeadManager />
      <DynamicTheme />
      <PWAInstaller />
      <VerificationWrapper>
        <ClickTracker>
          <Suspense fallback={null}>{children}</Suspense>
        </ClickTracker>
      </VerificationWrapper>
    </>
  )
}
