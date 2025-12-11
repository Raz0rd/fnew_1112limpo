import { NextRequest, NextResponse } from "next/server"
import { orderStorageService } from "@/lib/order-storage"
import { getBrazilTimestamp } from "@/lib/brazil-time"
import { decodeGateway } from "@/lib/gateway-mapper"
import { logConversion } from "@/lib/conversion-logger"
import { saveToGoogleSheets, saveToGoogleAdsSheet, saveToEnhancedSheet, saveToMCCSheet } from "@/lib/google-sheets"
import { hashEmail, hashPhone, generateDeliveryHash } from "@/lib/hash-utils"

// Cache para evitar processamento duplicado (em memória)
const processedConversions = new Map<string, number>()
const DEBOUNCE_TIME = 10000 // 10 segundos

// Função para consultar status no Ezzpag
async function checkStatusEzzpag(transactionId: string) {
  const ezzpagUrl = `https://api.ezzypag.com.br/v1/transactions/${transactionId}`
  const ezzpagAuth = process.env.EZZPAG_API_AUTH

  if (!ezzpagAuth) {
    throw new Error("EZZPAG_API_AUTH não configurado")
  }

  console.log(`[Ezzpag] Consultando: ${ezzpagUrl}`)

  const response = await fetch(ezzpagUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${ezzpagAuth}`,
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    console.error(`[Ezzpag] Erro na API: ${response.status}`)
    throw new Error(`Erro na API Ezzpag: ${response.status}`)
  }

  const transactionData = await response.json()
  console.log(`[Ezzpag] Status atual: ${transactionData.status}`)
  
  return transactionData
}

// Função para consultar status no GhostPay
async function checkStatusGhostPay(transactionId: string) {
  const ghostpayUrl = `https://api.ghostspaysv2.com/functions/v1/transactions/${transactionId}`
  const secretKey = process.env.GHOSTPAY_API_KEY
  const companyId = process.env.GHOSTPAY_COMPANY_ID

  if (!secretKey || !companyId) {
    throw new Error("GHOSTPAY_API_KEY e GHOSTPAY_COMPANY_ID não configurados")
  }

  console.log(`[GhostPay] Consultando: ${ghostpayUrl}`)

  // Criar auth Basic com base64 (SECRET_KEY:COMPANY_ID)
  const authString = Buffer.from(`${secretKey}:${companyId}`).toString('base64')

  const response = await fetch(ghostpayUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${authString}`,
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    console.error(`[GhostPay] Erro na API: ${response.status}`)
    throw new Error(`Erro na API GhostPay: ${response.status}`)
  }

  const transactionData = await response.json()
  console.log(`[GhostPay] Status atual: ${transactionData.status}`)
  
  return transactionData
}

// Função para consultar status no Nitro Pagamentos
async function checkStatusNitro(transactionId: string) {
  const apiKey = process.env.NITRO_API_KEY

  if (!apiKey) {
    throw new Error("NITRO_API_KEY não configurado")
  }

  const nitroUrl = `https://api.nitropagamentos.com/api/public/v1/transactions/${transactionId}?api_token=${apiKey}`
  console.log(`[Nitro] Consultando: ${nitroUrl}`)

  const response = await fetch(nitroUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  })

  if (!response.ok) {
    console.error(`[Nitro] Erro na API: ${response.status}`)
    throw new Error(`Erro na API Nitro: ${response.status}`)
  }

  const transactionData = await response.json()
  console.log(`[Nitro] Status atual: ${transactionData.payment_status}`)
  
  return transactionData
}

// Função para consultar status no Umbrela
async function checkStatusUmbrela(transactionId: string) {
  const umbrelaUrl = `https://api-gateway.umbrellapag.com/api/user/transactions/${transactionId}`
  const apiKey = process.env.UMBRELA_API_KEY

  if (!apiKey) {
    throw new Error("UMBRELA_API_KEY não configurado")
  }

  console.log(`[Umbrela] Consultando: ${umbrelaUrl}`)

  const response = await fetch(umbrelaUrl, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "User-Agent": "UMBRELLAB2B/1.0"
    }
  })

  if (!response.ok) {
    console.error(`[Umbrela] Erro na API: ${response.status}`)
    throw new Error(`Erro na API Umbrela: ${response.status}`)
  }

  const result = await response.json()
  const transactionData = result.data
  console.log(`[Umbrela] Status atual: ${transactionData.status}`)
  
  return transactionData
}

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()
    
    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: "transactionId é obrigatório"
      }, { status: 400 })
    }

    // Buscar gateway usado no storage e decodificar
    const savedOrder = orderStorageService.getOrder(transactionId)
    const encodedGateway = savedOrder?.gateway || 'gw_beta'
    const gateway = decodeGateway(encodedGateway)
    
    console.log(`🏦 [CHECK-STATUS] Gateway: ${encodedGateway} → ${gateway} (transactionId: ${transactionId})`)
    
    // Log simplificado (1 linha apenas)

    // Verificar se já processamos esta transação como paid
    const storedOrder = orderStorageService.getOrder(transactionId.toString())
    if (storedOrder && storedOrder.status === 'paid') {
      console.log(`[CHECK-STATUS] Transação ${transactionId} já processada como paid`)
      
      const response = NextResponse.json({
        success: true,
        status: 'paid',
        message: 'Transação já processada como paid',
        alreadyProcessed: true
      })
      
      // Headers anti-cache
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }

    // Consultar API do gateway configurado
    let transactionData
    
    try {
      if (gateway === 'nitro') {
        transactionData = await checkStatusNitro(transactionId)
      } else if (gateway === 'ghostpay') {
        transactionData = await checkStatusGhostPay(transactionId)
      } else if (gateway === 'umbrela') {
        transactionData = await checkStatusUmbrela(transactionId)
      } else {
        // Padrão: Ezzpag
        transactionData = await checkStatusEzzpag(transactionId)
      }
    } catch (error) {
      console.error(`[CHECK-STATUS] Erro ao consultar gateway:`, error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao consultar gateway',
        status: 500
      }, { status: 500 })
    }

    // Normalizar status baseado no gateway
    let currentStatus
    if (gateway === 'nitro') {
      // Nitro usa payment_status
      currentStatus = transactionData.payment_status
    } else {
      currentStatus = transactionData.status
    }
    
    const isNowPaid = currentStatus === 'paid' || currentStatus === 'approved' || currentStatus === 'PAID'
    const isWaitingPayment = currentStatus === 'waiting_payment' || currentStatus === 'WAITING_PAYMENT'
    
    // Log simplificado: apenas 1 linha
    console.log(`[POLLING] ${transactionId} → ${currentStatus.toUpperCase()}`)

    // Se status é paid, verificar se já foi processado pelo webhook
    if (isNowPaid) {
      console.log(`[CHECK-STATUS] Status é PAID!`)
      
      // VALIDAÇÃO: Verificar se a transação está no storage
      const storedOrder = orderStorageService.getOrder(transactionId)
      if (!storedOrder) {
        console.log(`⚠️ [CHECK-STATUS] Transação NÃO encontrada no storage`)
        console.log(`   - Transaction ID: ${transactionId}`)
        console.log(`   - Motivo: Pode ter sido perdida no hot-reload ou é de outro servidor`)
        console.log(`   - Ação: Retornando status PAID sem enviar para UTMify`)
        return NextResponse.json({
          success: true,
          status: 'paid',
          message: 'Pagamento confirmado',
          storageNotFound: true,
          note: 'Transação não encontrada no storage local (hot-reload ou outro servidor)',
          transactionData: {
            id: transactionData.id,
            status: transactionData.status,
            amount: transactionData.amount,
            paidAt: transactionData.paidAt,
            customer: transactionData.customer?.name || 'N/A'
          }
        })
      }
      
      // PROTEÇÃO ANTI-DUPLICAÇÃO: Verificar cache em memória
      const conversionKey = `${transactionId}-paid`
      const lastProcessed = processedConversions.get(conversionKey)
      const now = Date.now()
      
      if (lastProcessed && (now - lastProcessed) < DEBOUNCE_TIME) {
        const timeDiff = ((now - lastProcessed) / 1000).toFixed(2)
        console.log(`⚠️ [CHECK-STATUS] CONVERSÃO DUPLICADA detectada - IGNORANDO`)
        console.log(`   - Transaction ID: ${transactionId}`)
        console.log(`   - Último processamento: ${timeDiff}s atrás`)
        return NextResponse.json({
          success: true,
          status: 'paid',
          message: 'Conversão duplicada - ignorada',
          stopPolling: true, // ✅ PARAR POLLING - já foi processado
          alreadyProcessed: true,
          timeDiff: `${timeDiff}s`
        })
      }
      
      // Marcar como processado IMEDIATAMENTE
      processedConversions.set(conversionKey, now)
      
      // Limpar cache antigo (mais de 1 hora)
      for (const [key, timestamp] of processedConversions.entries()) {
        if (now - timestamp > 3600000) { // 1 hora
          processedConversions.delete(key)
        }
      }
      
      console.log(`[CHECK-STATUS] ✅ Processando PAID - enviando para UTMify...`)
      
      // Log estruturado
      logConversion({
        transactionId,
        step: 'PAYMENT_CONFIRMED',
        status: 'success',
        message: 'Pagamento confirmado pelo polling',
        route: '/api/check-transaction-status',
        userId: storedOrder?.customerData?.document || 'unknown',
        data: {
          gateway: gateway,
          amount: transactionData.amount / 100
        }
      })

      // Recuperar UTMs do storage ou usar fallback
      let trackingParameters: Record<string, any> = {}
      if (storedOrder && storedOrder.trackingParameters) {
        const params = storedOrder.trackingParameters
        // Extrair apenas propriedades UTM válidas (ignorar índices numéricos)
        trackingParameters = {
          utm_source: params.utm_source || null,
          utm_medium: params.utm_medium || null,
          utm_campaign: params.utm_campaign || null,
          utm_content: params.utm_content || null,
          utm_term: params.utm_term || null,
          gclid: params.gclid || null,
          gbraid: params.gbraid || null,
          wbraid: params.wbraid || null,
          fbclid: params.fbclid || null,
          keyword: params.keyword || null,
          device: params.device || null,
          network: params.network || null,
          gad_source: params.gad_source || null,
          gad_campaignid: params.gad_campaignid || null,
          src: params.src || null,
          sck: params.sck || null,
          ctax: params.ctax || null
        }
      }

      // Atualizar status no storage
      if (storedOrder) {
        orderStorageService.saveOrder({
          ...storedOrder,
          status: 'paid',
          paidAt: transactionData.paidAt || new Date().toISOString()
        })
      }

      // Enviar para UTMify
      const utmifyEnabled = process.env.UTMIFY_ENABLED === 'true'
      const utmifyToken = process.env.UTMIFY_API_TOKEN
      let utmifySuccess = false
      
      // Log de aviso se não tiver GCLID (Google Ads não vai aceitar, mas UTMify sim)
      const hasGclid = trackingParameters.gclid && trackingParameters.gclid !== 'null'
      if (!hasGclid) {
        console.log(`⚠️ [CHECK-STATUS] Sem GCLID - Google Ads não vai aceitar esta conversão`)
        console.log(`   - Mas enviando para UTMify mesmo assim (pode ter outros destinos)`)
      }
      
      console.log(`[CHECK-STATUS] 🔍 DEBUG UTMify: ENABLED=${utmifyEnabled}, TOKEN=${!!utmifyToken}`)
      
      if (utmifyEnabled && utmifyToken) {
        try {
          console.log(`[CHECK-STATUS] Enviando status PAID para UTMify`)

          // Extrair dados do cliente com fallback
          const customerData = transactionData.customer || {}
          const documentNumber = customerData.document?.number || customerData.document || 'N/A'
          
          // IMPORTANTE: Usar createdAt do storage (que vem do gateway) ao invés do transactionData
          const utmifyData = {
            orderId: transactionId.toString(),
            platform: "GMePortsFF",
            paymentMethod: "pix",
            status: "paid", // Status UTMify para paid
            createdAt: storedOrder.createdAt ? getBrazilTimestamp(new Date(storedOrder.createdAt)) : getBrazilTimestamp(),
            approvedDate: transactionData.paidAt ? getBrazilTimestamp(new Date(transactionData.paidAt)) : getBrazilTimestamp(new Date()),
            refundedAt: null,
            customer: {
              name: customerData.name || 'Cliente',
              email: customerData.email || 'nao-informado@email.com',
              phone: customerData.phone || null,
              document: documentNumber,
              country: "BR",
              ip: transactionData.ip || "unknown"
            },
            products: [
              {
                id: `recarga-${transactionId}`,
                name: "GMePorts",
                planId: null,
                planName: null,
                quantity: 1,
                priceInCents: transactionData.amount
              }
            ],
            trackingParameters: {
              src: (trackingParameters as any)?.src || null,
              sck: (trackingParameters as any)?.sck || null,
              utm_source: (trackingParameters as any)?.utm_source || null,
              utm_campaign: (trackingParameters as any)?.utm_campaign || null,
              utm_medium: (trackingParameters as any)?.utm_medium || null,
              utm_content: (trackingParameters as any)?.utm_content || null,
              utm_term: (trackingParameters as any)?.utm_term || null,
              gclid: (trackingParameters as any)?.gclid || null,
              xcod: (trackingParameters as any)?.xcod || null,
              keyword: (trackingParameters as any)?.keyword || null,
              device: (trackingParameters as any)?.device || null,
              network: (trackingParameters as any)?.network || null,
              gad_source: (trackingParameters as any)?.gad_source || (trackingParameters as any)?.utm_source || null,
              gad_campaignid: (trackingParameters as any)?.gad_campaignid || (trackingParameters as any)?.utm_campaign || null,
              gbraid: (trackingParameters as any)?.gbraid || null,
              wbraid: (trackingParameters as any)?.wbraid || null,
              fbclid: (trackingParameters as any)?.fbclid || null
            },
            commission: {
              totalPriceInCents: transactionData.amount,
              gatewayFeeInCents: Math.round((transactionData.amount * 0.0549) + 149), // 5.49% + R$ 1,49
              userCommissionInCents: Math.round(transactionData.amount - ((transactionData.amount * 0.0549) + 149)) // Total - taxa
            },
            isTest: process.env.UTMIFY_TEST_MODE === 'true'
          }

          console.log(`[CHECK-STATUS] 📤 Enviando PAID para UTMify:`)
          console.log(`   - Order ID: ${utmifyData.orderId}`)
          console.log(`   - Status: ${utmifyData.status}`)
          console.log(`   - Valor: R$ ${(utmifyData.products[0].priceInCents / 100).toFixed(2)}`)
          console.log(`   - Cliente: ${utmifyData.customer.name}`)
          console.log(`   - Email: ${utmifyData.customer.email}`)
          console.log(`   - GCLID: ${utmifyData.trackingParameters.gclid || '❌ NÃO CAPTURADO'}`)
          console.log(`   - GAD Source: ${utmifyData.trackingParameters.gad_source || 'N/A'}`)
          console.log(`   - GBraid: ${utmifyData.trackingParameters.gbraid || 'N/A'}`)

          // Detectar URL base automaticamente (SEMPRE usar HTTPS em produção)
          const host = request.headers.get('host')
          const baseUrl = `https://${host}`
          
          // Usar a mesma API que usamos para pending
          const utmifyResponse = await fetch(`${baseUrl}/api/utmify-track`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(utmifyData),
          })

          if (utmifyResponse.ok) {
            const utmifyResult = await utmifyResponse.json()
            console.log(`[CHECK-STATUS] ✅ UTMify notificado com sucesso (PAID)`)
            console.log(`[CHECK-STATUS] 📊 Resposta UTMify:`, JSON.stringify(utmifyResult, null, 2))
            utmifySuccess = true
            
            // Log estruturado
            logConversion({
              transactionId,
              step: 'UTMIFY_PAID_SENT',
              status: 'success',
              message: 'Conversão PAID enviada para UTMify',
              route: '/api/check-transaction-status',
              userId: storedOrder?.customerData?.document || 'unknown',
              data: {
                hasGclid: !!trackingParameters.gclid,
                hasUtmSource: !!trackingParameters.utm_source,
                amount: transactionData.amount / 100
              },
              utmParams: trackingParameters
            })
            
            // Marcar como enviado no storage para evitar duplicação futura
            if (storedOrder) {
              orderStorageService.saveOrder({
                ...storedOrder,
                utmifySent: true,
                utmifyPaidSent: true,
                status: 'paid',
                paidAt: transactionData.paidAt || new Date().toISOString()
              })
              console.log(`[CHECK-STATUS] 🔒 Marcado como enviado para UTMify no storage`)
            }
            
            // ============================================
            // 📊 GOOGLE SHEETS - Salvar dados do cliente
            // ============================================
            if (storedOrder) {
              try {
                // Extrair nome do domínio para usar como projeto
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
                if (!baseUrl) {
                  throw new Error('NEXT_PUBLIC_BASE_URL não configurado')
                }
                // Ex: https://aprovarevolucaoweb.click/ → aprovarevolucaoweb
                const domain = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')
                const projectName = domain.split('.')[0]
                
                // Usar any para acessar campos extras que podem existir
                const orderAny = storedOrder as any
                
                // LOG DEBUG - Ver o que tem no storedOrder
                console.log('')
                console.log('🔍 [DEBUG] storedOrder completo:')
                console.log(JSON.stringify(storedOrder, null, 2))
                console.log('')
                console.log('🔍 [DEBUG] trackingParameters completo:')
                console.log(JSON.stringify(trackingParameters, null, 2))
                console.log('')
                console.log('🔍 [DEBUG] transactionData completo:')
                console.log(JSON.stringify(transactionData, null, 2))
                console.log('')
                
                const sheetsData = {
                  projeto: projectName,
                  transactionId: transactionId,
                  email: storedOrder.customerData?.email || '',
                  phone: storedOrder.customerData?.phone || '',
                  valorConvertido: transactionData.amount / 100,
                  gclid: trackingParameters.gclid || '',
                  gbraid: trackingParameters.gbraid || '',
                  wbraid: trackingParameters.wbraid || '',
                  ip: orderAny.ip || '',
                  pais: 'BR',
                  cidade: orderAny.city || '',
                  createdAt: storedOrder.createdAt || new Date().toISOString(),
                  paidAt: transactionData.paidAt || new Date().toISOString(),
                  productName: orderAny.product || '',
                  gateway: decodeGateway(storedOrder.gateway || ''),
                  utm_source: trackingParameters.utm_source || '',
                  utm_campaign: trackingParameters.utm_campaign || '',
                  utm_medium: trackingParameters.utm_medium || '',
                  utm_content: trackingParameters.utm_content || '',
                  utm_term: trackingParameters.utm_term || '',
                  fbclid: trackingParameters.fbclid || '',
                  keyword: trackingParameters.keyword || '',
                  device: trackingParameters.device || '',
                  network: trackingParameters.network || '',
                  gad_source: trackingParameters.gad_source || trackingParameters.utm_source || '',
                  gad_campaignid: trackingParameters.gad_campaignid || trackingParameters.utm_campaign || '',
                  cupons: orderAny.cupons || '',
                  nomeCliente: transactionData.customer?.name || storedOrder.customerData?.name || '',
                  cpf: storedOrder.customerData?.document || ''
                }
                
                // LOG DETALHADO - Verificar TODOS os dados antes de enviar
                console.log('')
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                console.log('📊 [GOOGLE SHEETS] DADOS PARA ENVIAR')
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                console.log(`📁 Projeto: ${sheetsData.projeto}`)
                console.log(`🆔 Transaction ID: ${sheetsData.transactionId}`)
                console.log(`📧 Email: ${sheetsData.email || '❌ VAZIO'}`)
                console.log(`📱 Telefone: ${sheetsData.phone || '❌ VAZIO'}`)
                console.log(`💰 Valor: R$ ${sheetsData.valorConvertido}`)
                console.log(`🎯 GCLID: ${sheetsData.gclid || '❌ VAZIO'}`)
                console.log(`🎯 GBraid: ${sheetsData.gbraid || '❌ VAZIO'}`)
                console.log(`🎯 WBraid: ${sheetsData.wbraid || '❌ VAZIO'}`)
                console.log(`🌐 IP: ${sheetsData.ip || '❌ VAZIO'}`)
                console.log(`🌍 País: ${sheetsData.pais}`)
                console.log(`🏙️  Cidade: ${sheetsData.cidade || '❌ VAZIO'}`)
                console.log(`📅 Data Criação: ${sheetsData.createdAt}`)
                console.log(`💳 Data Pagamento: ${sheetsData.paidAt}`)
                console.log(`📦 Produto: ${sheetsData.productName || '❌ VAZIO'}`)
                console.log(`🏦 Gateway: ${sheetsData.gateway}`)
                console.log(`📊 UTM Source: ${sheetsData.utm_source || '❌ VAZIO'}`)
                console.log(`📊 UTM Campaign: ${sheetsData.utm_campaign || '❌ VAZIO'}`)
                console.log(`📊 UTM Medium: ${sheetsData.utm_medium || '❌ VAZIO'}`)
                console.log(`📊 UTM Content: ${sheetsData.utm_content || '❌ VAZIO'}`)
                console.log(`📊 UTM Term: ${sheetsData.utm_term || '❌ VAZIO'}`)
                console.log(`📘 FBCLID: ${sheetsData.fbclid || '❌ VAZIO'}`)
                console.log(`🔑 Keyword: ${sheetsData.keyword || '❌ VAZIO'}`)
                console.log(`📱 Device: ${sheetsData.device || '❌ VAZIO'}`)
                console.log(`🌐 Network: ${sheetsData.network || '❌ VAZIO'}`)
                console.log(`🎯 GAD Source: ${sheetsData.gad_source || '❌ VAZIO'}`)
                console.log(`🎯 GAD Campaign ID: ${sheetsData.gad_campaignid || '❌ VAZIO'}`)
                console.log(`🎟️  Cupons: ${sheetsData.cupons || '❌ VAZIO'}`)
                console.log(`👤 Nome Cliente: ${sheetsData.nomeCliente || '❌ VAZIO'}`)
                console.log(`🆔 CPF: ${sheetsData.cpf || '❌ VAZIO'}`)
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                console.log('')
                
                // Gerar dados de comprovação de entrega para aba normal
                const dataEntregaNormal = new Date(sheetsData.paidAt).toISOString()
                const quantidadeEntregueNormal = sheetsData.productName || String(sheetsData.valorConvertido)
                const deliveryHashNormal = await generateDeliveryHash(
                  sheetsData.transactionId,
                  sheetsData.email.toLowerCase().trim(),
                  dataEntregaNormal,
                  quantidadeEntregueNormal
                )
                
                // Adicionar campos de comprovação à sheetsData
                const sheetsDataCompleto = {
                  ...sheetsData,
                  dataEntrega: dataEntregaNormal,
                  quantidadeEntregue: quantidadeEntregueNormal,
                  deliveryHash: deliveryHashNormal,
                  pdfStatus: 'PENDENTE'
                }
                
                // Salvar usando Google Sheets API
                const result = await saveToGoogleSheets(sheetsDataCompleto)
                console.log(`✅ [GOOGLE SHEETS] Cliente salvo: ${sheetsData.email}`)
                console.log(`   - Aba: ${result.sheet}`)
                console.log(`   - Linhas: ${result.rows}`)
                
                // ============================================
                // 📊 GOOGLE ADS - Salvar conversão para importação
                // ============================================
                try {
                  // Formatar data no padrão do Google Ads (ISO 8601: 2025-12-07T19:14:10Z)
                  const eventDate = new Date(sheetsData.paidAt)
                  const formatGoogleAdsDate = (date: Date) => {
                    return date.toISOString() // Formato: 2025-12-07T19:14:10.000Z
                  }
                  
                  // Formato antigo para aba antiga (compatibilidade)
                  const formatGoogleAdsDateOld = (date: Date) => {
                    const year = date.getUTCFullYear()
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                    const day = String(date.getUTCDate()).padStart(2, '0')
                    const hours = String(date.getUTCHours()).padStart(2, '0')
                    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
                    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`
                  }
                  
                  // Formatar telefone no formato E.164 (+55 + número)
                  let phoneFormatted = sheetsData.phone.replace(/\D/g, '')
                  // Adicionar +55 se não tiver código do país
                  if (!phoneFormatted.startsWith('55')) {
                    phoneFormatted = '55' + phoneFormatted
                  }
                  phoneFormatted = '+' + phoneFormatted
                  
                  // Criar session_attributes (parâmetros GAD) - omitir campos vazios/null
                  const sessionData: Record<string, string> = {}
                  if (sheetsData.gad_source) sessionData.gad_source = sheetsData.gad_source
                  if (sheetsData.gad_campaignid) sessionData.gad_campaignid = sheetsData.gad_campaignid
                  const sessionAttrs = Object.keys(sessionData).length > 0 ? JSON.stringify(sessionData) : ''
                  
                  // Gerar hashes SHA-256 para Enhanced Conversions
                  const emailNormalized = sheetsData.email.toLowerCase().trim()
                  const emailHash = await hashEmail(emailNormalized)
                  const phoneHash = await hashPhone(phoneFormatted)
                  
                  // Gerar dados de comprovação de entrega
                  const dataEntrega = formatGoogleAdsDate(eventDate) // ISO 8601
                  // Usar produto ou valor como quantidade (ex: "100 Diamantes" ou valor em R$)
                  const quantidadeEntregue = sheetsData.productName || String(sheetsData.valorConvertido)
                  const deliveryHash = await generateDeliveryHash(
                    sheetsData.transactionId,
                    emailNormalized,
                    dataEntrega,
                    quantidadeEntregue
                  )
                  
                  const googleAdsData = {
                    eventTime: formatGoogleAdsDateOld(eventDate), // Formato antigo para aba antiga
                    gclid: sheetsData.gclid || '',
                    email: emailNormalized,
                    phoneNumber: phoneFormatted,
                    gbraid: sheetsData.gbraid || '',
                    wbraid: sheetsData.wbraid || '',
                    conversionValue: sheetsData.valorConvertido,
                    currencyCode: 'BRL',
                    orderId: sheetsData.transactionId,
                    userAgent: orderAny.userAgent || '',
                    ipAddress: sheetsData.ip || '',
                    sessionAttributes: sessionAttrs,
                    dataEntrega: dataEntrega,
                    quantidadeEntregue: quantidadeEntregue,
                    deliveryHash: deliveryHash,
                    pdfStatus: 'PENDENTE' // Status inicial do PDF
                  }
                  
                  const adsResult = await saveToGoogleAdsSheet(googleAdsData)
                  console.log(`✅ [GOOGLE ADS SHEET] Conversão salva para importação`)
                  console.log(`   - Aba: ${adsResult.sheet}`)
                  console.log(`   - Linhas: ${adsResult.rows}`)
                  console.log(`   - Telefone E.164: ${phoneFormatted}`)
                  
                  // ============================================
                  // 📊 MCC_CONVERSIONS - Salvar para múltiplas contas Google Ads
                  // IMPORTANTE: Salvar SOMENTE quando tiver ctax (Google Customer ID)
                  // ============================================
                  try {
                    // Verificar se temos dados do usuário (email OU telefone)
                    const hasUserData = emailHash || phoneHash
                    
                    if (hasUserData) {
                      // Verificar se temos ctax nos trackingParameters
                      const ctax = trackingParameters.ctax
                      
                      if (ctax) {
                        console.log(`🎯 [MCC] Detectado ctax: ${ctax} - enviando para MCC_CONVERSIONS`)
                        
                        const mccData = {
                          googleCustomerId: ctax,
                          conversionName: 'Compra_Finalizada',
                          conversionEventTime: formatGoogleAdsDate(eventDate),
                          gclid: sheetsData.gclid || '',
                          hashedEmail: emailHash,
                          hashedPhoneNumber: phoneHash,
                          conversionValue: sheetsData.valorConvertido,
                          currencyCode: 'BRL',
                          orderId: sheetsData.transactionId
                        }
                        
                        const mccResult = await saveToMCCSheet(mccData)
                        console.log(`✅ [MCC SHEET] Conversão MCC salva com sucesso`)
                        console.log(`   - Google Customer ID: ${ctax}`)
                        console.log(`   - Aba: ${mccResult.sheet}`)
                        console.log(`   - Linhas: ${mccResult.rows}`)
                        console.log(`   ℹ️  Pronto para importar no Google Ads MCC!`)
                      } else {
                        console.log(`ℹ️  [MCC] Sem ctax - não enviando para MCC_CONVERSIONS`)
                      }
                    } else {
                      console.log(`⚠️  [MCC] Sem dados do usuário (email/telefone) - não salvando`)
                    }
                    
                  } catch (mccError) {
                    console.error(`❌ [MCC SHEET] Erro ao salvar:`, mccError)
                  }
                  
                } catch (adsError) {
                  console.error(`❌ [GOOGLE ADS SHEET] Erro ao salvar conversão:`, adsError)
                }
                
              } catch (sheetsError) {
                console.error(`❌ [GOOGLE SHEETS] Erro ao salvar:`, sheetsError)
              }
            }
          } else {
            const errorText = await utmifyResponse.text()
            console.error(`[CHECK-STATUS] ❌ Erro ao notificar UTMify:`, utmifyResponse.status)
            console.error(`[CHECK-STATUS] 📄 Detalhes do erro:`, errorText)
          }
        } catch (error) {
          console.error(`[CHECK-STATUS] Erro ao enviar para UTMify:`, error)
        }
      }

      const response = NextResponse.json({
        success: true,
        status: 'paid',
        message: 'Pagamento confirmado',
        stopPolling: true, // ✅ PARAR POLLING - conversão enviada
        transactionData: {
          id: transactionData.id,
          status: transactionData.status,
          amount: transactionData.amount,
          paidAt: transactionData.paidAt,
          customer: transactionData.customer.name
        },
        utmifySent: utmifySuccess,
        utmifyPaidSent: utmifySuccess
      })
      
      // Headers anti-cache
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }

    // Se status é waiting_payment/pending, enviar para UTMify (primeira vez)
    if (isWaitingPayment) {
      const storedOrder = orderStorageService.getOrder(transactionId)
      
      // PROTEÇÃO 1: Verificar no storage se já enviou
      if (storedOrder && storedOrder.utmifySent) {
        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Aguardando pagamento',
          alreadySent: true,
          note: 'UTMify PENDING já foi enviado anteriormente'
        })
      }
      
      // PROTEÇÃO 2: Verificar cache em memória
      const pendingKey = `${transactionId}-pending`
      const lastPendingSent = processedConversions.get(pendingKey)
      
      if (lastPendingSent) {
        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Aguardando pagamento',
          alreadySent: true,
          note: 'UTMify PENDING já foi enviado (cache)'
        })
      }
      
      // Se não tem no storage, não processar (evitar envios sem dados completos)
      if (!storedOrder) {
        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Aguardando pagamento',
          alreadySent: true
        })
      }
      
      // Recuperar UTMs do storage
      let trackingParameters: Record<string, any> = {}
      if (storedOrder && storedOrder.trackingParameters) {
        trackingParameters = storedOrder.trackingParameters
      }
      
      // Marcar como enviado ANTES de enviar (evita race condition)
      const now = Date.now()
      processedConversions.set(pendingKey, now)
      
      // Enviar para UTMify
      const utmifyEnabled = process.env.UTMIFY_ENABLED === 'true'
      if (utmifyEnabled) {
          try {
            // SEMPRE usar HTTPS em produção
            const host = request.headers.get('host')
            const baseUrl = `https://${host}`
            
            // Recuperar UTMs do storage (já verificado acima que trackingParameters existe)
            const utmTrackingParams = storedOrder?.trackingParameters || trackingParameters
            
            // Extrair dados do cliente
            const customerData = transactionData.customer || {}
            const documentNumber = customerData.document?.number || customerData.document || '00000000000'
            
            // Criar dados no formato UTMify
            const utmifyData = {
              orderId: transactionId.toString(),
              platform: "RecarGames",
              paymentMethod: "pix",
              status: "waiting_payment",
              createdAt: transactionData.createdAt ? getBrazilTimestamp(new Date(transactionData.createdAt)) : getBrazilTimestamp(),
              approvedDate: null,
              refundedAt: null,
              customer: {
                name: customerData.name || 'Cliente',
                email: customerData.email || 'nao-informado@email.com',
                phone: customerData.phone || null,
                document: documentNumber,
                country: "BR",
                ip: transactionData.ip || "unknown"
              },
              products: [
                {
                  id: `recarga-${transactionId}`,
                  name: "Recarga Free Fire",
                  planId: null,
                  planName: null,
                  quantity: 1,
                  priceInCents: transactionData.amount
                }
              ],
              trackingParameters: {
                src: (utmTrackingParams as any)?.src || null,
                sck: (utmTrackingParams as any)?.sck || null,
                utm_source: (utmTrackingParams as any)?.utm_source || null,
                utm_campaign: (utmTrackingParams as any)?.utm_campaign || null,
                utm_medium: (utmTrackingParams as any)?.utm_medium || null,
                utm_content: (utmTrackingParams as any)?.utm_content || null,
                utm_term: (utmTrackingParams as any)?.utm_term || null,
                gclid: (utmTrackingParams as any)?.gclid || null,
                xcod: (utmTrackingParams as any)?.xcod || null,
                keyword: (utmTrackingParams as any)?.keyword || null,
                device: (utmTrackingParams as any)?.device || null,
                network: (utmTrackingParams as any)?.network || null,
                gad_source: (utmTrackingParams as any)?.gad_source || (utmTrackingParams as any)?.utm_source || null,
                gad_campaignid: (utmTrackingParams as any)?.gad_campaignid || (utmTrackingParams as any)?.utm_campaign || null,
                gbraid: (utmTrackingParams as any)?.gbraid || null,
                wbraid: (utmTrackingParams as any)?.wbraid || null,
                fbclid: (utmTrackingParams as any)?.fbclid || null
              },
              commission: {
                totalPriceInCents: transactionData.amount,
                gatewayFeeInCents: Math.round((transactionData.amount * 0.0549) + 149), // 5.49% + R$ 1,49
                userCommissionInCents: Math.round(transactionData.amount - ((transactionData.amount * 0.0549) + 149)) // Total - taxa
              },
              isTest: process.env.UTMIFY_TEST_MODE === 'true'
            }
            
            const utmifyResponse = await fetch(`${baseUrl}/api/utmify-track`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(utmifyData),
            })
            
            if (utmifyResponse.ok) {
              // Log estruturado
              logConversion({
                transactionId,
                step: 'UTMIFY_PENDING_SENT',
                status: 'success',
                message: 'Conversão WAITING_PAYMENT enviada para UTMify',
                route: '/api/check-transaction-status',
                userId: storedOrder?.customerData?.document || 'unknown',
                data: {
                  hasGclid: !!(utmTrackingParams as any)?.gclid,
                  hasUtmSource: !!(utmTrackingParams as any)?.utm_source,
                  amount: transactionData.amount / 100
                },
                utmParams: utmTrackingParams
              })
              
              // Marcar como enviado no storage
              if (storedOrder) {
                orderStorageService.saveOrder({
                  ...storedOrder,
                  utmifySent: true
                })
              }
            }
          } catch (error) {
            // Silencioso
          }
        }
      
      // Retornar status atual (sem processar)
      return NextResponse.json({
        success: true,
        status: currentStatus,
        message: `Status atual: ${currentStatus}`,
        transactionData: {
          id: transactionData.id,
          status: transactionData.status,
          amount: transactionData.amount,
          paidAt: transactionData.paidAt,
          customer: transactionData.customer.name
        },
        needsProcessing: false
      })
    }
    
    // Retornar status atual para outros casos
    return NextResponse.json({
      success: true,
      status: currentStatus,
      message: `Status atual: ${currentStatus}`,
      transactionData: {
        id: transactionData.id,
        status: transactionData.status,
        amount: transactionData.amount,
        paidAt: transactionData.paidAt,
        customer: transactionData.customer?.name || 'N/A'
      }
    })

  } catch (error) {
    console.error("[CHECK-STATUS] Erro:", error)
    return NextResponse.json({
      success: false,
      error: "Erro ao verificar status da transação",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
