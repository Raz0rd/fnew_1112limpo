import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Tentar obter IP de diferentes headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    let ip = 'unknown'
    
    if (cfConnectingIp) {
      ip = cfConnectingIp
    } else if (forwarded) {
      // x-forwarded-for pode conter múltiplos IPs separados por vírgula
      ip = forwarded.split(',')[0].trim()
    } else if (realIp) {
      ip = realIp
    }
    
    // Validar se é um IP válido
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    
    if (!ipRegex.test(ip)) {
      ip = 'unknown'
    }
    
    return NextResponse.json({
      success: true,
      ip: ip,
      headers: {
        'x-forwarded-for': forwarded,
        'x-real-ip': realIp,
        'cf-connecting-ip': cfConnectingIp
      }
    })
    
  } catch (error) {
    console.error('[GET-USER-IP] Erro:', error)
    
    return NextResponse.json({
      success: false,
      ip: 'unknown',
      error: 'Erro ao capturar IP'
    }, { status: 500 })
  }
}
