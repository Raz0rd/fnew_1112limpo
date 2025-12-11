'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a home (white page)
    router.replace('/')
  }, [router])

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mb-4"></div>
        <p className="text-gray-800">Redirecionando...</p>
      </div>
    </div>
  )
}
