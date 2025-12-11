"use client"

import React from "react"
import { X, Copy, Check } from "lucide-react"
import { useTrackingParams, type OrderData, type TrackingParameters } from "../hooks/useTrackingParams"
import { orderStorageService } from "@/lib/order-storage"
import { mobileDebug } from "@/lib/mobile-debug"
import { getBrazilTimestamp } from "@/lib/brazil-time"

interface PixModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  customerData: {
    name: string
    email: string
    phone: string
    document: string
  }
  utmParameters?: Record<string, string>
}

export default function PixModal({ isOpen, onClose, amount, customerData, utmParameters = {} }: PixModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [pixCode, setPixCode] = React.useState("")
  const [qrCode, setQrCode] = React.useState("")
  const [transactionId, setTransactionId] = React.useState("")
  const [paymentStatus, setPaymentStatus] = React.useState<"pending" | "paid">("pending")
  const [isCopied, setIsCopied] = React.useState(false)
  const [orderData, setOrderData] = React.useState<any>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [showProcessing, setShowProcessing] = React.useState(false)

  // UTM parameters para enviar apenas ao UTMify (não ao BlackCat)
  const finalUtmParams: TrackingParameters = {
    src: utmParameters.src || null,
    sck: utmParameters.sck || null,
    utm_source: utmParameters.utm_source || null,
    utm_campaign: utmParameters.utm_campaign || null,
    utm_medium: utmParameters.utm_medium || null,
    utm_content: utmParameters.utm_content || null,
    utm_term: utmParameters.utm_term || null,
    xcod: utmParameters.xcod || null,
    keyword: utmParameters.keyword || null,
    device: utmParameters.device || null,
    network: utmParameters.network || null,
    gclid: utmParameters.gclid || null,
    gad_source: utmParameters.gad_source || null,
    gbraid: utmParameters.gbraid || null,
    ctax: utmParameters.ctax || null,
    gad_campaignid: utmParameters.gad_campaignid || null,
    wbraid: utmParameters.wbraid || null,
    fbclid: utmParameters.fbclid || null
  }

  const generatePixPayment = async () => {
    mobileDebug.log("PIX: Iniciando geração de pagamento")
    
    if (isGenerating) {
      mobileDebug.log("PIX: Geração já em progresso, ignorando")
      return
    }

    setIsGenerating(true)
    setIsLoading(true)
    setError("")
    
    mobileDebug.log("PIX: Estados definidos", { isGenerating: true, isLoading: true })

    try {
      // Validar dados obrigatórios
      mobileDebug.log("PIX: Validando dados", customerData)
      if (!customerData.name || !customerData.email || !customerData.phone || !customerData.document) {
        mobileDebug.error("PIX: Dados obrigatórios faltando")
        throw new Error("Todos os campos são obrigatórios")
      }

      // Validar formato do CPF (deve ter 11 dígitos)
      const cpfNumbers = customerData.document.replace(/\D/g, "")
      mobileDebug.log("PIX: CPF validado", { cpf: cpfNumbers, length: cpfNumbers.length })
      if (cpfNumbers.length !== 11) {
        mobileDebug.error("PIX: CPF inválido", { cpf: cpfNumbers, length: cpfNumbers.length })
        throw new Error("CPF deve ter 11 dígitos")
      }

      // Validar formato do telefone (deve ter 10 ou 11 dígitos)
      const phoneNumbers = customerData.phone.replace(/\D/g, "")
      mobileDebug.log("PIX: Telefone validado", { phone: phoneNumbers, length: phoneNumbers.length })
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        mobileDebug.error("PIX: Telefone inválido", { phone: phoneNumbers, length: phoneNumbers.length })
        throw new Error("Telefone deve ter 10 ou 11 dígitos")
      }

      // Criar dados básicos (sem orderId - será gerado pelo BlackCat)
      mobileDebug.log("PIX: Preparando dados para BlackCat")

      // Payload para BlackCat (SEM orderId - será gerado pelo BlackCat)
      const blackcatPayload = {
        amount: Math.round(amount * 100),
        utmParams: finalUtmParams, // Incluir UTMs para salvar no metadata
        customer: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          document: {
            number: customerData.document,
            type: "cpf",
          },
        }
      }

      mobileDebug.log("PIX: Fazendo requisição para API")
      mobileDebug.log("PIX: Payload", blackcatPayload)

      const response = await fetch("/api/generate-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blackcatPayload),
      })

      mobileDebug.log("PIX: Resposta recebida", { status: response.status, ok: response.ok })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Erro HTTP ${response.status}`
        const errorDetails = errorData.details || ''
        
        mobileDebug.error("PIX: Erro na API", { status: response.status, message: errorMessage, details: errorDetails })
        
        if (response.status === 401) {
          throw new Error("Erro de autenticação na API de pagamento")
        } else if (response.status === 400) {
          throw new Error("Dados inválidos para gerar PIX")
        } else if (response.status >= 500) {
          throw new Error("Erro no servidor de pagamentos. Tente novamente.")
        } else {
          throw new Error(`Erro ao gerar PIX: ${errorMessage}`)
        }
      }

      const data = await response.json()
      mobileDebug.log("PIX: Dados recebidos", { 
        hasPixCode: !!data.pixCode, 
        hasQrCode: !!data.qrCode, 
        hasTransactionId: !!data.transactionId 
      })

      if (data.pixCode) {
        setPixCode(data.pixCode)
        mobileDebug.log("PIX: Código PIX definido", { length: data.pixCode.length })
      }

      if (data.qrCode) {
        setQrCode(data.qrCode)
        mobileDebug.log("PIX: QR Code definido")
      }

      if (data.transactionId) {
        mobileDebug.log("PIX: Transaction ID definido", data.transactionId)
        setTransactionId(data.transactionId)
        
        // Salvar dados do pedido no storage para recuperar quando pagamento for confirmado
        const orderForStorage = {
          orderId: data.transactionId, // Usar transactionId como orderId
          transactionId: data.transactionId,
          amount: amount,
          status: 'pending' as const,
          customerData: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            document: customerData.document
          },
          trackingParameters: finalUtmParams, // UTMs salvos para enviar ao UTMify depois
          createdAt: getBrazilTimestamp() // Usar horário de Brasília (GMT-3)
        }
        
        orderStorageService.saveOrder(orderForStorage)
        mobileDebug.log("PIX: Pedido salvo no storage")
      }

      setPaymentStatus("pending")
      mobileDebug.log("PIX: Status definido como pending")
      mobileDebug.log("PIX: QR Code gerado com sucesso - aguardando confirmação do BlackCat via webhook")
      
      // Sistema de fallback - verificar status a cada 5 segundos
      let fallbackInterval: NodeJS.Timeout
      let fallbackAttempts = 0
      const maxFallbackAttempts = 43 // 5 minutos (43 x 7s)

      const startFallbackCheck = () => {
        fallbackInterval = setInterval(async () => {
          fallbackAttempts++

          try {
            const statusResponse = await fetch('/api/check-transaction-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId: data.transactionId })
            })

            const statusData = await statusResponse.json()

            if (statusData.status === 'paid') {
              setPaymentStatus("paid")
              setShowProcessing(true)
              clearInterval(fallbackInterval)
            } else if (fallbackAttempts >= maxFallbackAttempts) {
              clearInterval(fallbackInterval)
            }
          } catch (error) {
            // Erro ao verificar status
          }
        }, 15000) // A cada 15 segundos (evitar 429)
      }

      // Iniciar fallback após 10 segundos (dar tempo para webhook chegar)
      setTimeout(startFallbackCheck, 10000)

      // Cleanup do interval quando modal fechar
      const originalOnClose = onClose
      const enhancedOnClose = () => {
        if (fallbackInterval) {
          clearInterval(fallbackInterval)
        }
        originalOnClose()
      }

    } catch (error) {
      mobileDebug.error("pix: Erro geral", error)
    } finally {
      mobileDebug.log("PIX: Finalizando geração")
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      // Fallback para dispositivos que não suportam clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = pixCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // Generate PIX when modal opens
  React.useEffect(() => {
    if (isOpen && !pixCode && !isGenerating && !isLoading && customerData.name && customerData.email) {
      mobileDebug.log("PIX: Modal aberto, gerando PIX automaticamente")
      generatePixPayment()
    }
  }, [isOpen, customerData, pixCode, isGenerating, isLoading])

  // Reset states when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setPixCode("")
      setQrCode("")
      setTransactionId("")
      setPaymentStatus("pending")
      setError("")
      setIsCopied(false)
      setOrderData(null)
      setShowProcessing(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Pagamento PIX</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando pagamento PIX...</p>
            </div>
          )}

          {showProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-6"></div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-green-600">🎉 Pagamento Confirmado!</h3>
                <p className="text-gray-600">Processando sua recarga...</p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Seu pagamento foi aprovado<br/>
                    🔄 Aguarde enquanto processamos sua recarga<br/>
                    ⏱️ Isso pode levar alguns minutos
                  </p>
                </div>
                <div className="text-xs text-gray-500 mt-4">
                  Transaction ID: {transactionId}
                </div>
              </div>
            </div>
          )}

          {error && !showProcessing && (
            <div className="text-center py-6">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={generatePixPayment}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {pixCode && !isLoading && !error && !showProcessing && (
            <div className="flex w-full flex-col">
              {/* Título */}
              <div className="text-center text-lg font-medium text-gray-800 mb-4">Pague com Pix</div>
              
              {/* QR Code */}
              {qrCode && (
                <div className="my-3 flex h-[150px] w-full items-center justify-center">
                  <img 
                    src={qrCode} 
                    alt="QR Code Pix" 
                    width="150" 
                    height="150" 
                    className="rounded-lg"
                  />
                </div>
              )}

              {/* Informações da empresa */}
              <div className="text-center text-gray-500 text-sm mb-4">
                VENDAS ONLINE STORE LTDA<br/>
                CNPJ: 27.945.891/0001-05
              </div>

              {/* Código PIX */}
              <div className="mb-4 mt-3 select-all break-words rounded-md bg-gray-100 p-4 text-sm text-gray-800">
                {pixCode}
              </div>

              {/* Botão Copiar */}
              <button
                onClick={copyPixCode}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-red-500 text-white hover:bg-red-600 px-4 py-2 mb-6 h-11 text-base font-bold"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? 'Copiado!' : 'Copiar Código'}
              </button>

              {/* Timer/Alerta */}
              {paymentStatus === "pending" && (
                <div role="alert" className="relative rounded-lg border p-4 bg-blue-50 border-blue-200 text-left w-full mb-4">
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-0.5 flex-shrink-0">
                      <path d="M5 22h14"></path>
                      <path d="M5 2h14"></path>
                      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
                    </svg>
                    <div>
                      <h5 className="mb-1 font-medium leading-none tracking-tight text-blue-800">Aguardando pagamento</h5>
                      <div className="text-sm text-blue-700">
                        Você tem tempo para pagar. Após o pagamento, os diamantes podem levar alguns minutos para serem creditados.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instruções */}
              <div className="text-gray-500 text-sm space-y-4">
                <p className="font-semibold">Para realizar o pagamento siga os passos abaixo:</p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li>Abra o app ou o site da sua instituição financeira e selecione o Pix.</li>
                  <li>Utilize as informações acima para realizar o pagamento.</li>
                  <li>Revise as informações e pronto!</li>
                </ol>
                <p>Seu pedido está sendo processado pela VENDAS ONLINE STORE LTDA.</p>
                <p>Você receberá seus diamantes após recebermos a confirmação do pagamento. Isso ocorre geralmente em alguns minutos após a realização do pagamento na sua instituição financeira.</p>
                <p>Em caso de dúvidas entre em contato com o suporte.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
