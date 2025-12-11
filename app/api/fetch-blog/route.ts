import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://www.incogaming.com.br/blog/categories/free-fire', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error('Falha ao carregar blog')
    }

    const html = await response.text()
    
    // Extrair apenas o conteúdo principal (remover header, footer, scripts)
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '') // Remove header
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '') // Remove footer
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '') // Remove nav
      .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
      .replace(/on\w+='[^']*'/g, '') // Remove event handlers
    
    return NextResponse.json({ 
      content: cleanHtml,
      success: true 
    })
  } catch (error) {
    console.error('Erro ao buscar blog:', error)
    return NextResponse.json({ 
      content: '<div class="p-8 text-center"><h2 class="text-2xl font-bold mb-4">Free Fire - Últimas Notícias</h2><p class="text-gray-600">Conteúdo temporariamente indisponível. Tente novamente mais tarde.</p></div>',
      success: false 
    }, { status: 200 }) // Retornar 200 mesmo com erro para não quebrar o frontend
  }
}
