import { NextRequest, NextResponse } from 'next/server'

const ADSPECT_POSTBACK_URL = 'https://rpc.adspect.net/v1/postback'
const ADSPECT_ACCOUNT_ID = '39074d6f-79c0-4a95-a716-c257b5a0f1c2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cid, sum } = body

    if (!cid) {
      console.log('[Adspect] Click ID não fornecido, conversão não enviada')
      return NextResponse.json({ 
        success: false, 
        message: 'Click ID não fornecido' 
      }, { status: 400 })
    }

    if (!sum || sum <= 0) {
      console.log('[Adspect] Valor inválido, conversão não enviada')
      return NextResponse.json({ 
        success: false, 
        message: 'Valor inválido' 
      }, { status: 400 })
    }

    // Construir URL de postback
    const postbackUrl = `${ADSPECT_POSTBACK_URL}?cid=${encodeURIComponent(cid)}&sum=${sum}&aid=${ADSPECT_ACCOUNT_ID}`
    
    console.log('[Adspect] Enviando conversão:', {
      cid,
      sum,
      url: postbackUrl
    })

    // Enviar postback ao Adspect (GET request)
    const response = await fetch(postbackUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'RecarGames/1.0'
      }
    })

    const responseText = await response.text()
    
    console.log('[Adspect] Resposta:', {
      status: response.status,
      body: responseText
    })

    // Adspect retorna status 200 e "OK" para conversão bem-sucedida
    if (response.ok && responseText.includes('OK')) {
      console.log('[Adspect] ✅ Conversão registrada com sucesso!')
      
      return NextResponse.json({ 
        success: true,
        message: 'Conversão registrada no Adspect',
        adspectResponse: responseText
      })
    }

    console.error('[Adspect] Conversão não foi registrada:', {
      status: response.status,
      body: responseText
    })
    
    return NextResponse.json({ 
      success: false, 
      message: 'Conversão não foi registrada',
      details: responseText
    }, { status: 500 })

  } catch (error) {
    console.error('[Adspect] Erro:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno' 
    }, { status: 500 })
  }
}
