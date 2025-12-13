'use client'

interface VerificationWrapperProps {
  children: React.ReactNode
}

export default function VerificationWrapper({ children }: VerificationWrapperProps) {
  // WhitePage desativado - retorna conteúdo diretamente
  return <>{children}</>
}
