import { NextRequest, NextResponse } from 'next/server'
import { logConversion } from '@/lib/conversion-logger'

/**
 * API para receber logs do frontend (client-side)
 * POST /api/log-conversion-client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      transactionId,
      step,
      status,
      message,
      data,
      userId,
      utmParams
    } = body
    
    if (!transactionId || !step || !message) {
      return NextResponse.json({
        success: false,
        error: 'transactionId, step e message são obrigatórios'
      }, { status: 400 })
    }
    
    // Registrar log
    logConversion({
      transactionId,
      step,
      status: status || 'info',
      message,
      route: 'CLIENT_SIDE',
      userId,
      data,
      utmParams
    })
    
    return NextResponse.json({
      success: true,
      message: 'Log registrado'
    })
  } catch (error) {
    console.error('[LOG-CONVERSION-CLIENT] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao registrar log'
    }, { status: 500 })
  }
}
