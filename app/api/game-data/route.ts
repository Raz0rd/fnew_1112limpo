import { NextRequest, NextResponse } from 'next/server'

// Forçar rota como dinâmica (não tentar gerar estaticamente)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const uid = searchParams.get('uid')
    
    if (!uid) {
      return NextResponse.json({ 
        success: false, 
        error: 'UID é obrigatório' 
      }, { status: 400 })
    }

    // Validar UID (apenas números)
    if (!/^\d+$/.test(uid)) {
      return NextResponse.json({ 
        success: false, 
        error: 'UID deve conter apenas números' 
      }, { status: 400 })
    }

    // URL e chave escondidas no servidor
    const API_URL = 'https://razord.vercel.app/api/data/br'
    const API_KEY = 'razord'
    
    // Fazer requisição para a API externa
    const response = await fetch(`${API_URL}?uid=${uid}&key=${API_KEY}`, {
      method: 'GET',  
      headers: {
        'User-Agent': 'RecargaJogo/1.0',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao consultar dados do jogador' 
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Log colorido no console do servidor
    if (data.basicInfo && data.basicInfo.nickname) {
      console.log('\x1b[36m%s\x1b[0m', '='.repeat(50))
      console.log('\x1b[32m✓ LOGIN REALIZADO\x1b[0m')
      console.log('\x1b[33mNickname:\x1b[0m \x1b[1m\x1b[35m%s\x1b[0m', data.basicInfo.nickname)
      console.log('\x1b[33mID:\x1b[0m \x1b[1m\x1b[34m%s\x1b[0m', uid)
      console.log('\x1b[36m%s\x1b[0m', '='.repeat(50))
    }
    
    // Retornar apenas os dados necessários (filtrar se necessário)
    return NextResponse.json({ 
      success: true, 
      data: data 
    })

  } catch (error) {
    console.error('Erro na API game-data:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
