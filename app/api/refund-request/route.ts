import { NextRequest, NextResponse } from 'next/server'
import { saveToGoogleSheets } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💰 [REEMBOLSO] Nova solicitação recebida')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📋 Transaction ID: ${data.transactionId}`)
    console.log(`👤 Nome: ${data.nome}`)
    console.log(`📧 Email: ${data.email}`)
    console.log(`📱 Telefone: ${data.telefone}`)
    console.log(`🆔 CPF: ${data.cpf}`)
    console.log(`🎮 ID Jogador: ${data.idJogador}`)
    console.log(`🏦 Banco: ${data.banco}`)
    console.log(`🔢 Agência: ${data.agencia}${data.digitoAgencia ? `-${data.digitoAgencia}` : ''}`)
    console.log(`💳 Conta: ${data.conta}-${data.digitoConta}`)
    console.log(`📊 Tipo: ${data.tipoConta}`)
    console.log(`🔑 PIX: ${data.chavePix}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Salvar na planilha de reembolsos
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_BASE_URL não configurado')
      }
      
      const domain = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')
      const projectName = domain.split('.')[0]

      await saveToGoogleSheets({
        projeto: `${projectName}_REEMBOLSOS`,
        transactionId: data.transactionId,
        email: data.email,
        phone: data.telefone,
        valorConvertido: 0, // Não temos o valor aqui
        gclid: '',
        gbraid: '',
        wbraid: '',
        ip: '',
        pais: 'BR',
        cidade: '',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        productName: 'REEMBOLSO',
        gateway: 'REEMBOLSO',
        utm_source: '',
        utm_campaign: '',
        utm_medium: '',
        utm_content: '',
        utm_term: '',
        fbclid: '',
        keyword: '',
        device: '',
        network: '',
        gad_source: '',
        gad_campaignid: '',
        cupons: '',
        nomeCliente: data.nome,
        cpf: data.cpf
      })

      console.log('✅ [REEMBOLSO] Salvo na planilha com sucesso')
    } catch (sheetsError) {
      console.error('❌ [REEMBOLSO] Erro ao salvar na planilha:', sheetsError)
      // Continuar mesmo se falhar
    }

    // TODO: Enviar email de confirmação
    // TODO: Notificar equipe de suporte

    return NextResponse.json({
      success: true,
      message: 'Solicitação de reembolso recebida com sucesso'
    })

  } catch (error) {
    console.error('❌ [REEMBOLSO] Erro ao processar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
