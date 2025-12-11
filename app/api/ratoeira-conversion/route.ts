import { NextRequest, NextResponse } from "next/server"

interface RatoeiraConversionData {
  orderId: string
  amount: number
  gclid?: string
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
  utm_term?: string
  utm_content?: string
  customerData?: {
    name: string
    email: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const ratoeiraEnabled = process.env.RATOEIRA_ENABLED === 'true'
    
    if (!ratoeiraEnabled) {
      return NextResponse.json({
        success: false,
        message: "Ratoeira ADS is disabled"
      })
    }

    const conversionData: RatoeiraConversionData = await request.json()
    
    //console.log("[v0] Ratoeira Conversion - Processing conversion:", conversionData)

    // Para Ratoeira ADS, precisamos fazer uma requisição HTTP para a API deles
    // Baseado nos dados que você mostrou, eles esperam estes campos:
    const ratoeiraPayload = {
      orderid: conversionData.orderId,
      status: "converted",
      amount: conversionData.amount.toString(),
      cy: "BRL",
      utm_source: conversionData.utm_source || "",
      utm_medium: conversionData.utm_medium || "",
      utm_campaign: conversionData.utm_campaign || "",
      utm_term: conversionData.utm_term || "",
      utm_content: conversionData.utm_content || "",
      gclid: conversionData.gclid || "",
      subid1: conversionData.utm_source || "",
      subid2: conversionData.utm_medium || "",
      subid3: conversionData.utm_term || "",
      utm_id: "",
      placement: "",
      network: "search",
      device: "mobile" // Você pode detectar isso dinamicamente se necessário
    }

    console.log("[v0] Ratoeira Conversion - Payload prepared:", ratoeiraPayload)

    // Aqui você precisaria da URL da API da Ratoeira ADS
    // Como não temos a URL exata, vamos apenas logar os dados
    console.log("[v0] Ratoeira Conversion - Would send to Ratoeira ADS API:")
    console.log(JSON.stringify(ratoeiraPayload, null, 2))

    // TODO: Implementar chamada real para API da Ratoeira quando tiver a URL
    /*
    const ratoeiraResponse = await fetch('https://api.ratoeira.com/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RATOEIRA_API_TOKEN}`
      },
      body: JSON.stringify(ratoeiraPayload)
    })

    if (!ratoeiraResponse.ok) {
      throw new Error(`Ratoeira API error: ${ratoeiraResponse.status}`)
    }

    const ratoeiraResult = await ratoeiraResponse.json()
    */

    return NextResponse.json({
      success: true,
      message: "Ratoeira conversion processed",
      data: ratoeiraPayload
    })

  } catch (error) {
    console.error("[v0] Ratoeira Conversion - Error:", error)
    
    return NextResponse.json({
      success: false,
      error: "Error processing Ratoeira conversion",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
