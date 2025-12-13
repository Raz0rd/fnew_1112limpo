import { NextRequest, NextResponse } from "next/server"
import { orderStorageService } from "@/lib/order-storage"
import { getBrazilTimestamp } from "@/lib/brazil-time"
import { decodeGateway } from "@/lib/gateway-mapper"
import { saveToGoogleSheets, saveToGoogleAdsSheet, saveToEnhancedSheet, saveToMCCSheet } from "@/lib/google-sheets"
import { hashEmail, hashPhone, generateDeliveryHash } from "@/lib/hash-utils"

/**
 * 🧪 API DE TESTE - Simular conversão PAID e enviar para planilha
 * 
 * Uso: POST /api/test-paid-conversion
 * Body: { transactionId: "txn_123" }
 * 
 * Esta API força o envio da conversão para a planilha mesmo sem pagamento real
 */
export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()
    
    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: "transactionId é obrigatório"
      }, { status: 400 })
    }
    
    console.log('')
    console.log('🧪━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🧪 [TEST PAID] INICIANDO TESTE DE CONVERSÃO')
    console.log('🧪━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🧪 Transaction ID: ${transactionId}`)
    console.log('')
    
    // Buscar pedido no storage
    const storedOrder = orderStorageService.getOrder(transactionId)
    
    if (!storedOrder) {
      console.error(`🧪 ❌ Pedido não encontrado no storage: ${transactionId}`)
      return NextResponse.json({
        success: false,
        error: "Pedido não encontrado no storage"
      }, { status: 404 })
    }
    
    console.log('🧪 ✅ Pedido encontrado no storage')
    console.log(`🧪 Email: ${storedOrder.customerData?.email}`)
    console.log(`🧪 Telefone: ${storedOrder.customerData?.phone}`)
    console.log(`🧪 Valor: R$ ${storedOrder.amount / 100}`)
    
    // Extrair tracking parameters
    const trackingParameters = storedOrder.trackingParameters || {}
    
    console.log('')
    console.log('🧪 📊 Tracking Parameters:')
    console.log(`   - GCLID: ${trackingParameters.gclid || '❌ NÃO TEM'}`)
    console.log(`   - CTAX: ${trackingParameters.ctax || '❌ NÃO TEM'}`)
    console.log(`   - UTM Source: ${trackingParameters.utm_source || '❌ NÃO TEM'}`)
    console.log(`   - UTM Campaign: ${trackingParameters.utm_campaign || '❌ NÃO TEM'}`)
    console.log(`   - GAD Source: ${trackingParameters.gad_source || '❌ NÃO TEM'}`)
    console.log('')
    
    // Simular dados de transação paga
    const transactionData = {
      id: transactionId,
      status: 'paid',
      amount: storedOrder.amount,
      paidAt: new Date().toISOString(),
      customer: {
        name: storedOrder.customerData?.name || 'Cliente Teste',
        email: storedOrder.customerData?.email || '',
        phone: storedOrder.customerData?.phone || ''
      }
    }
    
    // ============================================
    // 📊 GOOGLE SHEETS - Salvar dados do cliente
    // ============================================
    try {
      // Extrair nome do domínio para usar como projeto
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_BASE_URL não configurado')
      }
      
      const domain = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')
      const projectName = domain.split('.')[0]
      
      const orderAny = storedOrder as any
      
      const sheetsData = {
        projeto: projectName,
        transactionId: transactionId,
        email: storedOrder.customerData?.email || '',
        phone: storedOrder.customerData?.phone || '',
        valorConvertido: transactionData.amount / 100,
        gclid: trackingParameters.gclid || '',
        gbraid: trackingParameters.gbraid || '',
        wbraid: trackingParameters.wbraid || '',
        ip: orderAny.ip || '127.0.0.1',
        pais: 'BR',
        cidade: orderAny.city || 'Teste',
        createdAt: storedOrder.createdAt || new Date().toISOString(),
        paidAt: transactionData.paidAt,
        productName: orderAny.product || 'Produto Teste',
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
      
      console.log('🧪 📊 Salvando na aba do projeto...')
      
      // Gerar dados de comprovação de entrega
      const dataEntregaNormal = new Date(sheetsData.paidAt).toISOString()
      const quantidadeEntregueNormal = sheetsData.productName || String(sheetsData.valorConvertido)
      const deliveryHashNormal = await generateDeliveryHash(
        sheetsData.transactionId,
        sheetsData.email.toLowerCase().trim(),
        dataEntregaNormal,
        quantidadeEntregueNormal
      )
      
      const sheetsDataCompleto = {
        ...sheetsData,
        dataEntrega: dataEntregaNormal,
        quantidadeEntregue: quantidadeEntregueNormal,
        deliveryHash: deliveryHashNormal,
        pdfStatus: 'TESTE'
      }
      
      const result = await saveToGoogleSheets(sheetsDataCompleto)
      console.log(`🧪 ✅ Salvo na aba: ${result.sheet}`)
      
      // ============================================
      // 📊 GOOGLE ADS - Salvar conversão
      // ============================================
      const eventDate = new Date(sheetsData.paidAt)
      
      const formatGoogleAdsDate = (date: Date) => {
        // Converter para horário do Brasil (UTC-3)
        const brazilDate = new Date(date.getTime() - (3 * 60 * 60 * 1000))
        return brazilDate.toISOString() // Formato: 2025-12-07T19:14:10.000Z (horário Brasil)
      }
      
      const formatGoogleAdsDateOld = (date: Date) => {
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        const hours = String(date.getUTCHours()).padStart(2, '0')
        const minutes = String(date.getUTCMinutes()).padStart(2, '0')
        const seconds = String(date.getUTCSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`
      }
      
      let phoneFormatted = sheetsData.phone.replace(/\D/g, '')
      if (!phoneFormatted.startsWith('55')) {
        phoneFormatted = '55' + phoneFormatted
      }
      phoneFormatted = '+' + phoneFormatted
      
      const sessionData: Record<string, string> = {}
      if (sheetsData.gad_source) sessionData.gad_source = sheetsData.gad_source
      if (sheetsData.gad_campaignid) sessionData.gad_campaignid = sheetsData.gad_campaignid
      const sessionAttrs = Object.keys(sessionData).length > 0 ? JSON.stringify(sessionData) : ''
      
      const emailNormalized = sheetsData.email.toLowerCase().trim()
      const emailHash = await hashEmail(emailNormalized)
      const phoneHash = await hashPhone(phoneFormatted)
      
      const dataEntrega = formatGoogleAdsDate(eventDate)
      const quantidadeEntregue = sheetsData.productName || String(sheetsData.valorConvertido)
      const deliveryHash = await generateDeliveryHash(
        sheetsData.transactionId,
        emailNormalized,
        dataEntrega,
        quantidadeEntregue
      )
      
      const googleAdsData = {
        eventTime: formatGoogleAdsDateOld(eventDate),
        gclid: sheetsData.gclid || '',
        email: emailNormalized,
        phoneNumber: phoneFormatted,
        gbraid: sheetsData.gbraid || '',
        wbraid: sheetsData.wbraid || '',
        conversionValue: sheetsData.valorConvertido,
        currencyCode: 'BRL',
        orderId: sheetsData.transactionId,
        userAgent: orderAny.userAgent || 'Test User Agent',
        ipAddress: sheetsData.ip || '127.0.0.1',
        sessionAttributes: sessionAttrs,
        dataEntrega: dataEntrega,
        quantidadeEntregue: quantidadeEntregue,
        deliveryHash: deliveryHash,
        pdfStatus: 'TESTE'
      }
      
      console.log('🧪 📊 Salvando na aba Google Ads Conversões...')
      const adsResult = await saveToGoogleAdsSheet(googleAdsData)
      console.log(`🧪 ✅ Salvo na aba: ${adsResult.sheet}`)
      
      // ============================================
      // 📊 MCC_CONVERSIONS - Salvar se tiver ctax
      // ============================================
      const hasUserData = emailHash || phoneHash
      const ctax = trackingParameters.ctax
      
      if (hasUserData && ctax) {
        console.log('')
        console.log('🧪 🎯 CTAX DETECTADO! Enviando para MCC_CONVERSIONS...')
        console.log(`🧪 Google Customer ID: ${ctax}`)
        
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
        console.log(`🧪 ✅ SALVO NA ABA MCC_CONVERSIONS!`)
        console.log(`🧪    - Google Customer ID: ${ctax}`)
        console.log(`🧪    - Aba: ${mccResult.sheet}`)
        console.log(`🧪    - Linhas: ${mccResult.rows}`)
        console.log('')
      } else {
        if (!ctax) {
          console.log('🧪 ⚠️ Sem CTAX - não enviando para MCC_CONVERSIONS')
        }
        if (!hasUserData) {
          console.log('🧪 ⚠️ Sem dados do usuário - não enviando para MCC_CONVERSIONS')
        }
      }
      
      console.log('')
      console.log('🧪━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🧪 ✅ TESTE CONCLUÍDO COM SUCESSO!')
      console.log('🧪━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      
      return NextResponse.json({
        success: true,
        message: 'Conversão de teste enviada para planilha com sucesso!',
        data: {
          transactionId,
          sheets: {
            projeto: result.sheet,
            googleAds: adsResult.sheet,
            mccSent: !!trackingParameters.ctax
          },
          tracking: {
            hasGclid: !!trackingParameters.gclid,
            hasCtax: !!trackingParameters.ctax,
            ctaxValue: trackingParameters.ctax || null
          }
        }
      })
      
    } catch (error) {
      console.error('🧪 ❌ Erro ao salvar na planilha:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar na planilha',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('🧪 ❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar teste',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
