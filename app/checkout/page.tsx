"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Toast from "../../components/toast"
import PendingPaymentModal from "../../components/pending-payment-modal"
import SuccessModal from "@/components/SuccessModal"
import RefundModal from "@/components/RefundModal"
import { useUtmParams } from "@/hooks/useUtmParams"
import QRCode from "qrcode"
import { getBrazilTimestamp } from "@/lib/brazil-time"
import { trackPurchase } from "@/lib/google-ads"
import { fetchWithRetry, saveFailedRequest } from "@/lib/retry-fetch"

// Importar lista completa de CPFs e nomes
import { FAKE_DATA } from "@/lib/fake-data"

// Endereços para uso aleatório
const ADDRESSES = [
  { cep: "12510516", cidade: "Guaratinguetá", estado: "SP", bairro: "Bosque dos Ipês", rua: "Rua Fábio Rangel Dinamarco" },
  { cep: "58400295", cidade: "Campina Grande", estado: "PB", bairro: "Centro", rua: "Rua Frei Caneca" },
  { cep: "66025660", cidade: "Belém", estado: "PA", bairro: "Jurunas", rua: "Rua dos Mundurucus" },
  { cep: "37206660", cidade: "Lavras", estado: "MG", bairro: "Jardim Floresta", rua: "Rua Tenente Fulgêncio" },
  { cep: "13150148", cidade: "Cosmópolis", estado: "SP", bairro: "Jardim Bela Vista", rua: "Rua Eurides de Godoi" },
  { cep: "89560190", cidade: "Videira", estado: "SC", bairro: "Centro", rua: "Rua Padre Anchieta" },
  { cep: "60331200", cidade: "Fortaleza", estado: "CE", bairro: "Barra do Ceará", rua: "Avenida Vinte de Janeiro" },
  { cep: "71065330", cidade: "Brasília", estado: "DF", bairro: "Guará II", rua: "Quadra QI 33" },
  { cep: "61932130", cidade: "Maracanaú", estado: "CE", bairro: "Pajuçara", rua: "Rua Senador Petrônio Portela" },
  { cep: "60331240", cidade: "Fortaleza", estado: "CE", bairro: "Barra do Ceará", rua: "Rua Estevão de Campos" },
  { cep: "29125036", cidade: "Vila Velha", estado: "ES", bairro: "Barra do Jucu", rua: "Rua das Andorinhas" },
  { cep: "85863000", cidade: "Foz do Iguaçu", estado: "PR", bairro: "Centro Cívico", rua: "Avenida Costa e Silva" },
  { cep: "35162087", cidade: "Ipatinga", estado: "MG", bairro: "Iguaçu", rua: "Rua Magnetita" }
]

// Função para gerar dados aleatórios (apenas telefone)
const generateRandomUserData = () => {
  const randomEntry = FAKE_DATA[Math.floor(Math.random() * FAKE_DATA.length)]
  const [cpf, fullName] = randomEntry.split(':')
  
  // Gerar telefone válido aleatório
  const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '91']
  const ddd = ddds[Math.floor(Math.random() * ddds.length)]
  
  // Gera os 8 ou 9 dígitos restantes
  const isCelular = Math.random() > 0.5
  let phone = ''
  if (isCelular) {
    // Celular: 9 dígitos começando com 9
    const numero = Math.floor(10000000 + Math.random() * 90000000)
    phone = `${ddd}9${numero}`
  } else {
    // Telefone fixo: 8 dígitos
    const numero = Math.floor(10000000 + Math.random() * 90000000)
    phone = `${ddd}${numero}`
  }
  
  // Selecionar endereço aleatório
  const randomAddress = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)]
  
  return {
    fullName, // Manter para compatibilidade com API
    cpf, // Manter para compatibilidade com API
    phone,
    address: randomAddress
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { utmParams } = useUtmParams()

  const [playerName, setPlayerName] = useState("")
  const [playerNickname, setPlayerNickname] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cpf, setCpf] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [dob, setDob] = useState("")
  const [cpfError, setCpfError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [dobError, setDobError] = useState("")
  const [utmParameters, setUtmParameters] = useState<Record<string, string>>({})
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success")
  const [pixData, setPixData] = useState<{code: string, qrCode: string, transactionId: string} | null>(null)
  const [showPixInline, setShowPixInline] = useState(false)
  const [pixError, setPixError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState("")
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos em segundos
  const [timerActive, setTimerActive] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending')
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [selectedPromos, setSelectedPromos] = useState<string[]>([])
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState(false)
  const [hasPendingPayment, setHasPendingPayment] = useState(false)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false) // Se usuário está logado
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showOrderBump, setShowOrderBump] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isOrderBumpPurchase, setIsOrderBumpPurchase] = useState(false)
  const [orderBumpItemName, setOrderBumpItemName] = useState('')

  // ❌ VERIFICAÇÃO REMOVIDA - Usuário compra direto
  // useEffect(() => {
  //   if (typeof window === 'undefined') return
  //   
  //   // Verificar múltiplos cookies de verificação
  //   const hasVerificationCookie = document.cookie.split(';').some(cookie => {
  //     const trimmed = cookie.trim()
  //     return trimmed.startsWith('user_verified=') || 
  //            trimmed.startsWith('quiz_completed=') || 
  //            trimmed.startsWith('referer_verified=')
  //   })
  //   
  //   console.log('🔍 [CHECKOUT] Verificando cookies:', hasVerificationCookie)
  //   
  //   if (hasVerificationCookie) {
  //     setIsVerified(true)
  //     setIsCheckingVerification(false)
  //   } else {
  //     // Aguardar um pouco antes de mostrar verificação (evitar flash)
  //     setTimeout(() => {
  //       setIsCheckingVerification(false)
  //     }, 300)
  //   }
  // }, [])

  // Get URL parameters
  const itemType = searchParams.get("type") || searchParams.get("itemType") || "recharge"
  const itemValue = searchParams.get("value") || searchParams.get("itemValue") || "1.060"
  const testMode = searchParams.get("test") === "gads2024" // Param secreto para teste
  const itemBonus = searchParams.get("bonus") || "0"
  const playerId = searchParams.get("playerId") || ""
  const price = searchParams.get("price") || "14.24"
  const paymentMethod = searchParams.get("payment") || searchParams.get("paymentMethod") || "PIX"
  const gameApp = searchParams.get("app") || "100067" // Detectar qual jogo
  
  // Determinar qual jogo baseado no app
  const currentGame = gameApp === "100157" ? "deltaforce" : gameApp === "haikyu" ? "haikyu" : "freefire"
  
  // Função para adicionar UTMs a qualquer URL interna
  const addUtmsToUrl = (url: string): string => {
    if (typeof window === 'undefined') return url
    
    const currentParams = new URLSearchParams(window.location.search)
    const urlObj = new URL(url, window.location.origin)
    
    // Adicionar todos os parâmetros atuais à nova URL
    currentParams.forEach((value, key) => {
      if (!urlObj.searchParams.has(key)) {
        urlObj.searchParams.set(key, value)
      }
    })
    
    return urlObj.pathname + urlObj.search
  }
  
  // Configuração por jogo
  const gameConfig = {
    freefire: {
      banner: "/images/checkout-banner.webp",
      icon: "/images/icon.png",
      coinIcon: "/images/point.png",
      name: "Free Fire",
      coinName: "Diamantes",
      showOrderBump: true,
      showNickname: true
    },
    deltaforce: {
      banner: "/images/backgroundDelta.jpg",
      icon: "/images/iconeusuarioDeltaForce.png",
      coinIcon: "/images/IconeCoinsDF.png",
      name: "Delta Force",
      coinName: "Coins",
      showOrderBump: false,
      showNickname: false
    },
    haikyu: {
      banner: "/images/backgroundHiuki.jpg",
      icon: "/images/HAIKIU FLY HIGH.png",
      coinIcon: "/images/iconCoinHaikyu.png",
      name: "HAIKYU!! FLY HIGH",
      coinName: "Diamantes Estelares",
      showOrderBump: false,
      showNickname: false
    }
  }
  
  const config = gameConfig[currentGame as keyof typeof gameConfig]

  // Bloquear scroll do background quando modais estão abertos
  useEffect(() => {
    if (showPromoModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showPromoModal])
  
  // Verificar se usuário já está logado
  useEffect(() => {
    const checkUserLoggedIn = () => {
      if (typeof window === 'undefined') return
      
      // Verificar se há dados de usuário no localStorage
      const userData = localStorage.getItem('user_data')
      const verificationData = localStorage.getItem('verificationData')
      const user_data = localStorage.getItem('userData')
      
      // Se já temos dados de usuário, está logado
      if (userData || verificationData || user_data) {
        setIsUserLoggedIn(true)
      } else {
        setIsUserLoggedIn(false)
      }
    }
    
    checkUserLoggedIn()
  }, [])

  useEffect(() => {
    setPlayerName(playerId)
    
    // Buscar nickname do jogador do localStorage específico do jogo
    const gameStorageKey = `userData_${gameApp}`
    const storedUserData = localStorage.getItem(gameStorageKey)
    
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData)
        if (userData.nickname) {
          setPlayerNickname(userData.nickname)
        }
      } catch (error) {
        console.error('Erro ao recuperar nickname:', error)
      }
    } else {
      // Fallback: tentar pegar do localStorage genérico
      const fallbackData = localStorage.getItem('userData')
      if (fallbackData) {
        try {
          const userData = JSON.parse(fallbackData)
          if (userData.nickname) {
            setPlayerNickname(userData.nickname)
          }
        } catch (error) {
          console.error('Erro ao recuperar nickname fallback:', error)
        }
      }
    }
    
    // Capturar parâmetros UTM da URL atual e do sessionStorage
    const urlParams = new URLSearchParams(window.location.search)
    const utmData: Record<string, string> = {}
    
    // Lista de parâmetros para capturar (Google Ads + UTMify + MCC)
    const paramsToCapture = [
      // UTMs básicos
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      // Google Ads Click IDs
      'gclid', 'gbraid', 'wbraid',
      // Google Ads parâmetros adicionais
      'keyword', 'device', 'network', 'gad_source', 'gad_campaignid',
      // MCC (múltiplas contas Google Ads)
      'ctax',
      // Outros tracking
      'fbclid', 'src', 'sck', 'xcod', 'msclkid'
    ]
    
    // 1. Capturar da URL atual
    paramsToCapture.forEach(param => {
      const value = urlParams.get(param)
      if (value) {
        utmData[param] = value
      }
    })
    
    // 2. Capturar do sessionStorage (persistência entre páginas)
    paramsToCapture.forEach(param => {
      if (!utmData[param]) {
        const storedValue = sessionStorage.getItem(`utm_${param}`)
        if (storedValue) {
          utmData[param] = storedValue
        }
      }
    })
    
    // 3. Usar parâmetros do hook como fallback (parsear string)
    if (utmParams && typeof utmParams === 'string') {
      const hookParams = new URLSearchParams(utmParams)
      hookParams.forEach((value, key) => {
        if (value && !utmData[key]) {
          utmData[key] = value
        }
      })
    } else if (utmParams && typeof utmParams === 'object') {
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value && !utmData[key]) {
          utmData[key] = value as string
        }
      })
    }
    // 4. Salvar no sessionStorage para próximas páginas
    Object.entries(utmData).forEach(([key, value]) => {
      sessionStorage.setItem(`utm_${key}`, value)
    })
    
    // 5. Adicionar timestamp e página atual
    utmData.timestamp = new Date().toISOString()
    utmData.current_page = 'checkout'
    
    // Log de debug para verificar captura
    console.log('🎯 [CHECKOUT] UTM Parameters capturados:', utmData)
    console.log('🎯 [CHECKOUT] CTAX capturado?', utmData.ctax ? `SIM: ${utmData.ctax}` : 'NÃO')
    
    setUtmParameters(utmData)
  }, [playerId, gameApp, utmParams])

  // Detectar pagamento pendente ao carregar a página
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const pendingPayment = localStorage.getItem('pending_payment')
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment)
        // Verificar se o pagamento não expirou (15 minutos)
        const createdAt = new Date(paymentData.createdAt).getTime()
        const now = Date.now()
        const fifteenMinutes = 15 * 60 * 1000
        
        if (now - createdAt < fifteenMinutes) {
          setHasPendingPayment(true)
          setShowPendingPaymentModal(true)
        } else {
          // Pagamento expirado, limpar
          localStorage.removeItem('pending_payment')
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento pendente:', error)
        localStorage.removeItem('pending_payment')
      }
    }
  }, [])

  // Função para continuar com pagamento pendente
  const handleContinuePendingPayment = () => {
    if (typeof window === 'undefined') return
    
    const pendingPayment = localStorage.getItem('pending_payment')
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment)
        
        // Restaurar dados do pagamento
        setPixData({
          code: paymentData.pixCode,
          qrCode: paymentData.pixQrCode,
          transactionId: paymentData.transactionId
        })
        setQrCodeImage(paymentData.qrCodeImage)
        setShowPixInline(true)
        setTimerActive(true)
        
        // Calcular tempo restante
        const createdAt = new Date(paymentData.createdAt).getTime()
        const now = Date.now()
        const elapsed = Math.floor((now - createdAt) / 1000)
        const remaining = (15 * 60) - elapsed
        setTimeLeft(remaining > 0 ? remaining : 0)
        
        setShowPendingPaymentModal(false)
      } catch (error) {
        console.error('Erro ao restaurar pagamento:', error)
        handleStartNewPayment()
      }
    }
  }

  // Função para iniciar novo pagamento
  const handleStartNewPayment = () => {
    if (typeof window === 'undefined') return
    
    // Limpar pagamento pendente
    localStorage.removeItem('pending_payment')
    
    // Limpar estados
    setPixData(null)
    setQrCodeImage('')
    setShowPixInline(false)
    setTimerActive(false)
    setTimeLeft(15 * 60)
    setPaymentStatus('pending')
    setHasPendingPayment(false)
    setShowPendingPaymentModal(false)
    
    // Não deslogar, apenas limpar itens do carrinho
    // O usuário permanece logado
  }

  const showToastMessage = (message: string, type: "success" | "error" | "info") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const getFinalPrice = () => {
    return Number.parseFloat(price!)
  }


  const calculateDiamondDetails = (diamonds: string) => {
    const diamondCount = Number.parseInt(diamonds.replace(".", "").replace(",", ""))
    const bonusMap: { [key: number]: number } = {
      100: 20, 310: 62, 520: 104, 2180: 436, 5600: 1120, 15600: 3120,
    }
    const bonus = bonusMap[diamondCount] || 0
    const total = diamondCount + bonus
    return { original: diamondCount, bonus, total }
  }

  const handleBack = () => {
    router.back()
  }

  const promoItems = [
    { id: 'jimg-violento', name: 'Jimg Violento', image: '/images/jimg_violento.png', oldPrice: 149.29, price: 54.19 },
    { id: 'barba-velho', name: 'Barba do Velho', image: '/images/Barba do Velho.png', oldPrice: 89.99, price: 10.99 },
    { id: 'jimg-ambicioso', name: 'Jimg Ambicioso', image: '/images/jimg_ambicioso.png', oldPrice: 149.29, price: 54.39 },
    { id: 'calca-angelical', name: 'Calça Angelical Azul', image: '/images/Calça Angelical Azul.png', oldPrice: 129.90, price: 39.80 },
    { id: 'jimg-pisico', name: 'Jimg Piscoco', image: '/images/jimg_pisico.png', oldPrice: 149.29, price: 54.29 },
  ]

  const togglePromoItem = (itemId: string) => {
    console.log('🎯 [togglePromoItem] Clicou no item:', itemId)
    setSelectedPromos(prev => {
      const newSelection = prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      console.log('🎯 [togglePromoItem] Nova seleção:', newSelection)
      return newSelection
    })
  }

  const getPromoTotal = () => {
    const total = selectedPromos.reduce((total, itemId) => {
      const item = promoItems.find(p => p.id === itemId)
      return total + (item?.price || 0)
    }, 0)
    return total
  }

  // Funções de formatação e validação
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length !== 11) return false
    if (/^(\d)\1{10}$/.test(numbers)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(numbers.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(numbers.charAt(10))) return false
    
    return true
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    return numbers.length === 11
  }

  const formatDOB = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3')
    }
    return value
  }

  const validateDOB = (dob: string) => {
    const numbers = dob.replace(/\D/g, '')
    if (numbers.length !== 8) return false
    
    const day = parseInt(numbers.substring(0, 2))
    const month = parseInt(numbers.substring(2, 4))
    const year = parseInt(numbers.substring(4, 8))
    
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false
    if (year < 1900 || year > new Date().getFullYear()) return false
    
    return true
  }

  const handleProceedToPayment = async () => {
    if (isProcessingPayment) {
      return
    }

    // Validar campos obrigatórios
    if (!fullName.trim()) {
      alert("Por favor, preencha o nome completo.")
      return
    }

    if (!email.trim()) {
      alert("Por favor, preencha o email.")
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert("Por favor, digite um email válido.")
      return
    }

    if (!cpf.trim() || !validateCPF(cpf)) {
      alert("Por favor, digite um CPF válido.")
      return
    }

    if (!dob.trim() || !validateDOB(dob)) {
      alert("Por favor, digite uma data de nascimento válida.")
      return
    }

    if (!phone.trim() || !validatePhone(phone)) {
      alert("Por favor, digite um telefone válido.")
      return
    }

    // ❌ ORDER BUMP REMOVIDO - Agora só aparece APÓS pagamento
    // Ir direto para finalizar pedido
    handleFinalizeOrder()
  }

  const handleFinalizeOrder = async () => {
    console.log('🚀 [INICIO] handleFinalizeOrder chamado')
    console.log('🚀 [INICIO] paymentStatus:', paymentStatus)
    console.log('🚀 [INICIO] selectedPromos:', selectedPromos)
    console.log('🚀 [INICIO] selectedPromos.length:', selectedPromos.length)
    
    // Se já pagou e não selecionou nenhum order bump, mostrar erro e NÃO fechar modal
    if (paymentStatus === 'paid' && selectedPromos.length === 0) {
      console.log('⚠️ [ORDER BUMP] Nenhum item selecionado')
      setErrorMessage('Por favor, selecione pelo menos uma oferta!')
      setShowErrorModal(true)
      return // NÃO fecha o modal de order bump
    }
    
    // Verificar se é order bump após pagamento
    const isOrderBumpAfterPayment = paymentStatus === 'paid'
    
    // Só fecha o modal se tiver selecionado algo ou se não for order bump
    setShowPromoModal(false)
    
    setIsProcessingPayment(true)
    setShowPixInline(true)
    setPixError("")
    setEmailError("")
    
    // Validar email APENAS se não for order bump (pois já foi validado antes)
    if (!isOrderBumpAfterPayment) {
      const emailParts = email.split('@')
      if (!email || emailParts.length !== 2 || emailParts[0].length < 3) {
        setEmailError("Email inválido")
        setIsProcessingPayment(false)
        return
      }
    }
    
    // Garantir que o telefone foi gerado
    if (!phone) {
      const randomData = generateRandomUserData()
      setPhone(randomData.phone)
    }
    
    try {
      
      // Calcular valor total com promoções
      const basePrice = isOrderBumpAfterPayment ? 0 : getFinalPrice()
      const promoTotal = getPromoTotal()
      const totalPrice = basePrice + promoTotal
      
      console.log('💰 [DEBUG] isOrderBumpAfterPayment:', isOrderBumpAfterPayment)
      console.log('💰 [DEBUG] basePrice:', basePrice)
      console.log('💰 [DEBUG] promoTotal:', promoTotal)
      console.log('💰 [DEBUG] selectedPromos:', selectedPromos)
      console.log('💰 [DEBUG] totalPrice:', totalPrice)
      
      // Validar se tem valor para cobrar
      if (totalPrice <= 0) {
        console.error('❌ [ERRO] Valor total é 0 ou negativo!')
        setIsProcessingPayment(false)
        return
      }
      
      // Se é order bump após pagamento, resetar tudo
      if (isOrderBumpAfterPayment && promoTotal > 0) {
        console.log('🎁 [ORDER BUMP] Gerando novo PIX apenas para order bump')
        console.log('🎁 [ORDER BUMP] Valor: R$', totalPrice.toFixed(2))
        
        // Marcar como compra de order bump
        setIsOrderBumpPurchase(true)
        
        // Salvar nome dos itens selecionados
        const selectedItemsNames = selectedPromos
          .map(promoId => promoItems.find(item => item.id === promoId)?.name)
          .filter(Boolean)
          .join(' + ')
        setOrderBumpItemName(selectedItemsNames)
        console.log('🎁 [ORDER BUMP] Itens:', selectedItemsNames)
        
        // Limpar localStorage
        localStorage.removeItem('pending_payment')
        
        // Resetar estados
        setPaymentStatus('pending')
        setPixData(null)
        setQrCodeImage('')
        setIsCopied(false)
        setTimeLeft(15 * 60)
        setTimerActive(false)
      }
      
      console.log('📡 [DEBUG] Chamando API generate-pix com amount:', Math.round(totalPrice * 100))
      
      // Gerar PIX
      const response = await fetch('/api/generate-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 100),
          trackingParams: utmParameters,
          playerId: playerId,
          itemType: itemType,
          itemValue: itemValue,
          paymentMethod: paymentMethod,
          customer: {
            name: fullName,
            email: email,
            phone: getPhoneNumbers(phone),
            document: {
              number: cpf.replace(/\D/g, ""),
              type: "cpf"
            }
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Gerar QR Code em base64
        let qrCodeImageData = ""
        try {
          const qrCodeDataURL = await QRCode.toDataURL(data.pixCode, {
            width: 150,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          })
          qrCodeImageData = qrCodeDataURL
        } catch (qrError) {
          // Erro silencioso no QR Code
          // Fallback: usar a imagem do servidor se disponível
          if (data.qrCode) {
            qrCodeImageData = data.qrCode
          }
        }
        
        setPixData({
          code: data.pixCode,
          qrCode: data.qrCode,
          transactionId: data.transactionId
        })
        
        setQrCodeImage(qrCodeImageData)
        
        // Iniciar timer de 15 minutos
        setTimeLeft(15 * 60)
        setTimerActive(true)
        
        // Salvar pagamento pendente no localStorage
        const pendingPaymentData = {
          pixCode: data.pixCode,
          pixQrCode: data.qrCode,
          transactionId: data.transactionId,
          qrCodeImage: qrCodeImageData,
          createdAt: new Date().toISOString(),
          playerName,
          itemValue,
          price
        }
        localStorage.setItem('pending_payment', JSON.stringify(pendingPaymentData))
        
        // ✅ Enviar waiting_payment para UTMify
        sendToUtmify('pending', data).catch(err => {
          console.error('Erro ao enviar waiting_payment para UTMify:', err)
        })
        
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Erro HTTP ${response.status}`
        setPixError(`Erro ao gerar PIX: ${errorMessage}`)
      }
    } catch (error) {
      setPixError('Erro ao gerar PIX. Tente novamente.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const formatPrice = (priceStr: string) => {
    return `R$ ${Number.parseFloat(priceStr).toFixed(2).replace(".", ",")}`
  }

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    return value
  }

  const getPhoneNumbers = (formattedPhone: string) => {
    return formattedPhone.replace(/\D/g, "")
  }

  const validateCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "")
    if (numbers.length !== 11) return false
    
    if (/^(\d)\1{10}$/.test(numbers)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i)
    }
    let digit1 = 11 - (sum % 11)
    if (digit1 > 9) digit1 = 0
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i)
    }
    let digit2 = 11 - (sum % 11)
    if (digit2 > 9) digit2 = 0
    
    return parseInt(numbers[9]) === digit1 && parseInt(numbers[10]) === digit2
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value)
    setCpf(formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  // Timer de 15 minutos
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false)
            setPaymentStatus('expired')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeLeft])

  // Polling para verificar status do pagamento a cada 10 segundos
  useEffect(() => {
    let statusInterval: NodeJS.Timeout
    
    // Função para verificar se a página está visível
    const isPageVisible = () => !document.hidden
    
    // Função para verificar status (reutilizável)
    const checkPaymentStatus = async () => {
      if (!pixData) return // Verificação de segurança
      
      if (!isPageVisible()) {
        console.log('[POLLING] ⏸️ Página não visível - aguardando retorno')
        return
      }
      
      console.log('[POLLING] 🔄 Verificando status do pagamento...')
      
      try {
        const response = await fetch('/api/check-transaction-status', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store',
          body: JSON.stringify({ transactionId: pixData.transactionId })
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // ✅ PARAR POLLING se backend solicitar (conversão já enviada)
          if (data.stopPolling) {
            console.log('[POLLING] 🛑 Backend solicitou parada do polling')
            setTimerActive(false)
          }
          
          if (data.success && data.status === 'paid') {
            console.log('[POLLING] ✅ PAGAMENTO CONFIRMADO!')
              setPaymentStatus('paid')
              setTimerActive(false)
              
              // Resetar flag de order bump (novo ciclo de compra)
              setIsOrderBumpPurchase(false)
              setOrderBumpItemName('')
              
              // Limpar pagamento pendente do localStorage
              localStorage.removeItem('pending_payment')
              
              // Mostrar modal de oferta após 2 segundos
              setTimeout(() => {
                setShowSuccessModal(true)
              }, 2000)
              
              // Calcular valor total da compra (o que realmente foi pago)
              // Neste ponto, getFinalPrice() já retorna o valor correto
              const totalValue = getFinalPrice() + getPromoTotal()
              
              // Capturar TODOS os parâmetros de tracking da URL atual
              const urlParams = new URLSearchParams(window.location.search)
              
              // Parâmetros principais
              const gclid = urlParams.get('gclid') || utmParameters.gclid || ''
              const utm_source = urlParams.get('utm_source') || utmParameters.utm_source || ''
              const utm_campaign = urlParams.get('utm_campaign') || utmParameters.utm_campaign || ''
              const utm_medium = urlParams.get('utm_medium') || utmParameters.utm_medium || ''
              const utm_content = urlParams.get('utm_content') || utmParameters.utm_content || ''
              const utm_term = urlParams.get('utm_term') || utmParameters.utm_term || ''
              
              // Parâmetros adicionais do Google Ads
              const keyword = urlParams.get('keyword') || ''
              const device = urlParams.get('device') || ''
              const network = urlParams.get('network') || ''
              const gad_source = urlParams.get('gad_source') || ''
              const gad_campaignid = urlParams.get('gad_campaignid') || ''
              const gbraid = urlParams.get('gbraid') || ''
              
              // Construir URL da página de sucesso INTERNA
              const sucessoUrl = new URL('/sucesso', window.location.origin)
              
              // Dados da compra
              sucessoUrl.searchParams.set('transactionId', pixData.transactionId)
              sucessoUrl.searchParams.set('amount', (totalValue * 100).toString()) // Converter para centavos
              sucessoUrl.searchParams.set('currency', 'BRL')
              
              // Dados do cliente (serão hasheados na página de sucesso para Enhanced Conversions)
              if (email) sucessoUrl.searchParams.set('email', email)
              if (phone) sucessoUrl.searchParams.set('phone', phone)
              if (playerName) sucessoUrl.searchParams.set('playerName', playerName)
              
              // Parâmetros de tracking principais
              if (gclid) sucessoUrl.searchParams.set('gclid', gclid)
              if (utm_source) sucessoUrl.searchParams.set('utm_source', utm_source)
              if (utm_campaign) sucessoUrl.searchParams.set('utm_campaign', utm_campaign)
              if (utm_medium) sucessoUrl.searchParams.set('utm_medium', utm_medium)
              if (utm_content) sucessoUrl.searchParams.set('utm_content', utm_content)
              if (utm_term) sucessoUrl.searchParams.set('utm_term', utm_term)
              
              // Parâmetros adicionais do Google Ads
              if (keyword) sucessoUrl.searchParams.set('keyword', keyword)
              if (device) sucessoUrl.searchParams.set('device', device)
              if (network) sucessoUrl.searchParams.set('network', network)
              if (gad_source) sucessoUrl.searchParams.set('gad_source', gad_source)
              if (gad_campaignid) sucessoUrl.searchParams.set('gad_campaignid', gad_campaignid)
              if (gbraid) sucessoUrl.searchParams.set('gbraid', gbraid)
              
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('🎯 [PAID] ENVIANDO CONVERSÃO PARA UTMIFY')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('💳 Transaction ID:', pixData.transactionId)
              console.log('💰 Valor:', `R$ ${totalValue.toFixed(2)}`)
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              
              // ✅ CRÍTICO: Enviar para UTMify ANTES de redirecionar
              try {
                console.log('[PAID] 📤 Enviando conversão PAID para UTMify...')
                await sendToUtmifyPaid(pixData.transactionId)
                console.log('[PAID] ✅ Conversão PAID enviada com sucesso!')
              } catch (err) {
                console.error('[PAID] ❌ Erro ao enviar conversão:', err)
                // Continuar mesmo com erro (não bloquear usuário)
              }
              
              // Agora sim, redirecionar para página de sucesso
              console.log('[PAID] 🔀 Redirecionando para página de sucesso...')
              console.log('[PAID] 🔗 URL:', sucessoUrl.toString())
              window.location.href = sucessoUrl.toString()
          }
        }
      } catch (error) {
        console.error('[POLLING] ❌ Erro ao verificar status:', error)
      }
    }
    
    if (pixData && paymentStatus === 'pending' && timerActive) {
      // Iniciar polling a cada 10 segundos
      statusInterval = setInterval(checkPaymentStatus, 10000)
      
      // ✅ CRÍTICO: Listener para quando usuário volta para a página
      const handleVisibilityChange = () => {
        if (!document.hidden && pixData && paymentStatus === 'pending') {
          console.log('[POLLING] 👁️ Usuário voltou - verificando status IMEDIATAMENTE')
          checkPaymentStatus() // Verificar imediatamente
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Fazer primeira verificação imediatamente
      checkPaymentStatus()
      
      return () => {
        if (statusInterval) clearInterval(statusInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [pixData, paymentStatus, timerActive])


  // Formatar tempo para exibição (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Função auxiliar para calcular comissão
  const calculateCommission = (totalPriceInCents: number) => {
    // Não calculamos fee - enviamos 0
    // Comissão = valor total
    return {
      totalPriceInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: totalPriceInCents
    }
  }

  // Função para capturar IP real do cliente
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://ipinfo.io/?token=32090226b9d116')
      if (response.ok) {
        const data = await response.json()
        return data.ip
      }
    } catch (error) {
      // Erro ao capturar IP
    }
    return 'unknown'
  }

  // Função para enviar dados para UTMify (PENDING)
  const sendToUtmify = async (status: 'pending', transactionData: any) => {
    
    // Capturar IP real
    const clientIp = await getClientIP()
    
    // Calcular comissão real com orderbump
    // Se já pagou, não incluir o produto base (apenas order bump)
    const isOrderBumpAfterPayment = paymentStatus === 'paid'
    const basePrice = isOrderBumpAfterPayment ? 0 : getFinalPrice()
    const promoTotal = getPromoTotal()
    const totalPrice = basePrice + promoTotal
    const totalPriceInCents = Math.round(totalPrice * 100)
    const commission = calculateCommission(totalPriceInCents)
    
    console.log('💰 [sendToUtmify] isOrderBumpAfterPayment:', isOrderBumpAfterPayment)
    console.log('💰 [sendToUtmify] basePrice:', basePrice)
    console.log('💰 [sendToUtmify] promoTotal:', promoTotal)
    console.log('💰 [sendToUtmify] totalPriceInCents:', totalPriceInCents)
    
    // Criar produto único com valor total
    const products = [
      {
        id: `recarga-${transactionData.transactionId}`,
        name: itemType === "recharge" ? `eBook eSport Digital Premium` : `eBook eSport Gold Edition`,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: totalPriceInCents
      }
    ]
    
    // Criar dados no formato do UTMify
    // Converter UTC para horário do Brasil (GMT-3) e formatar como "YYYY-MM-DD HH:mm:ss"
    const now = new Date()
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000))
    const formatDate = (date: Date) => {
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      const hours = String(date.getUTCHours()).padStart(2, '0')
      const minutes = String(date.getUTCMinutes()).padStart(2, '0')
      const seconds = String(date.getUTCSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
    
    const utmifyData = {
        orderId: transactionData.transactionId,
        platform: "Central Promocional Games (Jogos Tiro)",
        paymentMethod: "pix",
        status: "waiting_payment",
        createdAt: formatDate(brazilTime),
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: fullName,
          email: email,
          phone: getPhoneNumbers(phone),
          document: cpf.replace(/\D/g, ""),
          country: "BR",
          ip: clientIp
        },
        products: products,
        trackingParameters: {
          src: utmParameters.src || null,
          sck: utmParameters.sck || null,
          utm_source: utmParameters.utm_source || null,
          utm_campaign: utmParameters.utm_campaign || null,
          utm_medium: utmParameters.utm_medium || null,
          utm_content: utmParameters.utm_content || null,
          utm_term: utmParameters.utm_term || null,
          gclid: utmParameters.gclid || null,
          xcod: utmParameters.xcod || null,
          keyword: utmParameters.keyword || null,
          device: utmParameters.device || null,
          network: utmParameters.network || null,
          gad_source: utmParameters.gad_source || null,
          gbraid: utmParameters.gbraid || null,
          ctax: utmParameters.ctax || null,
        },
        commission: commission,
        isTest: process.env.NEXT_PUBLIC_UTMIFY_TEST_MODE === 'true'
      }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📤 [UTMIFY] ENVIANDO WAITING_PAYMENT')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 Payload completo:', JSON.stringify(utmifyData, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    try {
      // Usar fetchWithRetry para tentar até 3 vezes
      const response = await fetchWithRetry('/api/utmify-track', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(utmifyData)
      }, {
        maxRetries: 3,
        delayMs: 2000,
        timeout: 30000,
        onRetry: (attempt, error) => {
        }
      })
      
      if (response.ok) {
        const result = await response.json()
      } else {
        const errorText = await response.text()
        
        // Salvar para retry posterior
        saveFailedRequest('/api/utmify-track', utmifyData)
      }
    } catch (error) {
      
      // Salvar para retry posterior
      saveFailedRequest('/api/utmify-track', utmifyData)
    }
  }

  // Função para enviar dados para UTMify (PAID)
  const sendToUtmifyPaid = async (transactionId: string) => {
    
    // Capturar IP real
    const clientIp = await getClientIP()
    
    // Calcular comissão real com orderbump
    // IMPORTANTE: Aqui NÃO precisa verificar paymentStatus pois quando chama esta função
    // é porque acabou de pagar, então deve enviar o valor REAL que foi pago
    // (que pode ser produto + order bump OU apenas order bump)
    const basePrice = getFinalPrice()
    const promoTotal = getPromoTotal()
    const totalPrice = basePrice + promoTotal
    const totalPriceInCents = Math.round(totalPrice * 100)
    const commission = calculateCommission(totalPriceInCents)
    
    console.log('💰 [sendToUtmifyPaid] basePrice:', basePrice)
    console.log('💰 [sendToUtmifyPaid] promoTotal:', promoTotal)
    console.log('💰 [sendToUtmifyPaid] totalPriceInCents:', totalPriceInCents)
    
    // Criar produto único com valor total
    const products = [
      {
        id: `recarga-${transactionId}`,
        name: itemType === "recharge" ? `eBook eSport Digital Premium` : `eBook eSport Gold Edition`,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: totalPriceInCents
      }
    ]
    
    // Criar dados no formato do UTMify
    // Converter UTC para horário do Brasil (GMT-3) e formatar como "YYYY-MM-DD HH:mm:ss"
    const now = new Date()
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000))
    const formatDate = (date: Date) => {
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      const hours = String(date.getUTCHours()).padStart(2, '0')
      const minutes = String(date.getUTCMinutes()).padStart(2, '0')
      const seconds = String(date.getUTCSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
    
    const utmifyData = {
        orderId: transactionId,
        platform: "Central Promocional Games (Jogos Tiro)",
        paymentMethod: "pix",
        status: "paid",
        createdAt: formatDate(brazilTime),
        approvedDate: formatDate(brazilTime),
        refundedAt: null,
        customer: {
          name: fullName,
          email: email,
          phone: getPhoneNumbers(phone),
          document: cpf.replace(/\D/g, ""),
          country: "BR",
          ip: clientIp
        },
        products: products,
        trackingParameters: {
          src: utmParameters.src || null,
          sck: utmParameters.sck || null,
          utm_source: utmParameters.utm_source || null,
          utm_campaign: utmParameters.utm_campaign || null,
          utm_medium: utmParameters.utm_medium || null,
          utm_content: utmParameters.utm_content || null,
          utm_term: utmParameters.utm_term || null,
          gclid: utmParameters.gclid || null,
          xcod: utmParameters.xcod || null,
          keyword: utmParameters.keyword || null,
          device: utmParameters.device || null,
          network: utmParameters.network || null,
          gad_source: utmParameters.gad_source || null,
          gbraid: utmParameters.gbraid || null,
          ctax: utmParameters.ctax || null,
      },
      commission: commission,
      isTest: process.env.NEXT_PUBLIC_UTMIFY_TEST_MODE === 'true'
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💰 [UTMIFY] ENVIANDO PAID')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 Payload completo:', JSON.stringify(utmifyData, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    try {
      // Usar fetchWithRetry para tentar até 3 vezes
      const response = await fetchWithRetry('/api/utmify-track', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(utmifyData)
      }, {
        maxRetries: 3,
        delayMs: 2000,
        timeout: 30000,
        onRetry: (attempt, error) => {
        }
      })
      
      if (response.ok) {
        const result = await response.json()
      } else {
        const errorText = await response.text()
        
        // Salvar para retry posterior
        saveFailedRequest('/api/utmify-track', utmifyData)
      }
    } catch (error) {
      
      // Salvar para retry posterior
      saveFailedRequest('/api/utmify-track', utmifyData)
    }
  }

  // Função de teste para simular redirect para success
  const handleTestConversion = () => {
    if (!pixData) return
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    const successUrl = new URL(`${baseUrl}/success`)
    
    // Adicionar params necessários
    successUrl.searchParams.set('transactionId', pixData.transactionId)
    successUrl.searchParams.set('amount', (getFinalPrice() * 100).toString())
    successUrl.searchParams.set('playerName', playerName)
    successUrl.searchParams.set('itemType', itemType)
    successUrl.searchParams.set('game', currentGame)
    successUrl.searchParams.set('itemValue', itemValue)
    

    
    // Redirecionar
    window.location.href = successUrl.toString()
  }

  // ✅ Não precisa mais de loading - modal aparece quando necessário

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto flex h-full w-full max-w-5xl items-stretch justify-between gap-1 px-3 md:px-4 py-3">
          <a className="flex items-center gap-2.5 md:gap-3" href="/recargajogo">
            <div className="flex items-center">
              <svg width="34" height="36" viewBox="0 0 34 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[34px] md:hidden">
                <g><path d="M19.5397 0.10298L19.6326 0.022157L19.8982 0L19.7826 0.195385L19.5734 0.229753L19.3184 0.505834L19.1692 0.425641L19.1335 0.516787L18.8325 0.540581L18.8448 0.620774L19.1335 0.655772L18.8911 0.724761L18.8565 0.828244L18.7168 0.81641L18.7058 0.920145L18.4166 0.931098V1.00097L18.2308 1.04679L18.0569 1.24155L17.9295 1.1611C17.9295 1.1611 17.8947 1.1611 17.8714 1.28838C17.2684 1.64168 16.0247 2.32664 14.7703 3.01758C13.7365 3.58698 12.6953 4.16043 11.9993 4.55566C11.9567 4.58208 11.9112 4.61072 11.8625 4.64133C11.2738 5.0112 10.2255 5.66994 8.52449 6.21303C10.1314 5.87985 10.7558 5.59868 11.6469 5.19752C12.079 5.00297 12.5738 4.7802 13.2737 4.50958C15.4158 3.68083 17.7672 3.77273 17.7672 3.77273L17.478 3.94646L17.5003 4.24496L17.6626 4.26837L17.7791 4.29128L17.9871 4.15356L17.9991 4.25691L18.1848 4.29128L18.3465 4.25691L18.5783 4.18856L18.7643 4.23098L18.7396 4.04894L18.8973 4.09993L19.0023 4.21839L19.1335 4.04894L19.4478 4.13606L19.1458 4.14172L19.1804 4.25691L18.6473 4.26837L18.6819 4.34869L18.3115 4.32603L18.2422 4.3604C18.2422 4.3604 18.3005 4.44147 18.2191 4.45255C17.9295 4.55566 17.7731 4.74638 17.7731 4.74638C20.4134 3.64105 23.6109 5.57412 23.6109 5.57412L23.8187 5.62498L23.8546 5.93669L23.9404 6.00631H24.1149L23.9927 6.19528L24.1149 6.33313V6.55721L23.9058 6.5061L23.7495 6.33313L23.8365 6.22939L23.7323 6.09267H23.4195L23.2638 5.98869L23.1416 5.97094L22.8634 5.83258L22.6374 5.86821L22.4292 5.67673L21.4904 5.69435L21.5431 5.78096L22.0121 5.81546L22.0818 5.93669H22.551L22.7937 6.12641L23.107 6.09267L23.2809 6.17815L23.6279 6.28139L23.4023 6.36787C23.4023 6.36787 23.8811 7.1017 26.8589 7.8004C31.1329 8.80112 34 6.95516 34 6.95516C33.2703 7.88638 32.3836 8.16221 32.3836 8.16221L31.7406 8.23208L31.6014 8.33519L31.3065 8.42193L30.4385 8.88798L30.2122 9.04283L30.1948 9.16318L30.1085 9.26742L30.0737 9.09507H29.8121L29.5699 9.16318L29.604 9.25017L29.5519 9.47388H29.3773L29.4655 9.33691L29.3773 9.26742L29.2742 9.09507L29.1182 9.11169L28.8052 9.38765L28.6141 9.33691L28.4918 9.37078L28.3188 9.45714L28.1452 9.52588L27.9192 9.45714L27.6927 9.5605L27.537 9.45714L27.1897 9.42201L27.1721 9.30204H26.9637L26.8067 9.38765L26.5986 9.52588L25.9041 9.5605L26.5464 9.68211L26.7728 9.71572L26.9288 9.52588L27.0854 9.50901L27.242 9.5605L27.5717 9.6991L27.7804 9.68211L27.9363 9.57724L28.058 9.63012L28.2145 9.71572L28.3772 9.80208C28.3772 9.80208 27.3808 9.94006 26.1071 10.0101C27.358 10.078 28.5379 10.9065 28.5379 10.9065C28.5379 10.9065 27.9131 10.6542 25.5978 10.8143C23.4676 10.9631 22.2721 10.4309 21.0773 9.89913C20.129 9.47709 19.1813 9.05525 17.7672 8.97409C13.5286 8.72936 11.7362 11.2349 11.7362 11.2349L11.579 11.5807L11.2405 11.6057L11.206 11.8123L11.1366 11.8384L11.1189 11.9071L10.8933 11.9937L10.902 12.0973L11.1189 12.1224L11.0758 12.261L11.0059 12.4072L11.3276 12.9697L10.9362 12.6326L10.7801 12.5545L10.511 12.4428L10.4241 12.5373L10.3543 12.7278L10.2415 12.9002L10.0767 12.8482C10.0767 12.8482 10.1113 13.3052 9.65914 13.3919C9.48551 13.5728 9.6509 13.677 9.6509 13.677L9.87674 13.694V13.8851L9.96406 13.901C9.96406 13.901 9.91172 13.9611 9.87674 14.0911C10.0416 14.1163 10.1193 14.0047 10.1193 14.0047L10.224 14.03C10.224 14.03 9.97242 14.5573 9.33825 14.7641C9.43342 14.8671 9.53773 14.8765 9.53773 14.8765C9.53773 14.8765 8.84297 15.2818 8.62588 15.7473C8.49585 16.2138 8.7042 16.1794 8.7042 16.1794C8.7042 16.1794 8.50383 16.4036 8.4866 16.0837C8.28724 15.9987 8.19194 16.2219 8.19194 16.2219C8.19194 16.2219 8.18231 16.2737 8.27825 16.3003C8.07826 16.4643 8.08739 16.6787 8.08739 16.6787L8.28724 16.6961C8.28724 16.6961 8.37342 16.9034 8.19194 16.9034C8.00945 16.9034 8.00057 16.9987 8.00057 16.9987V17.0931L8.096 17.1629L7.87587 17.3489C7.87587 17.3489 7.66752 18.1319 7.82999 19.582C8.40891 24.4364 13.0651 24.2304 13.0651 24.2304C13.0651 24.2304 17.6517 24.5978 19.7597 20.916C23.0032 15.1179 18.0454 13.8972 18.0454 13.8972C18.0454 13.8972 14.3855 13.0235 13.1807 14.3585C12.1089 15.5457 13.5514 16.9578 13.5514 16.9578C13.5514 16.9578 14.4087 17.5568 14.0145 18.5701C13.3594 20.253 11.5828 19.8334 11.5828 19.8334C11.5828 19.8334 8.80191 19.1686 9.45117 16.7523C10.3581 13.3735 14.7559 12.8164 14.7559 12.8164C14.7559 12.8164 19.4232 11.9764 22.2846 13.8868C23.5404 14.7256 25.6555 13.9906 25.6555 13.9906C25.044 14.5972 23.964 14.8053 23.9527 14.807C23.9532 14.807 23.9557 14.8065 23.9602 14.8058C24.0877 14.7838 25.8036 14.4876 28.0874 14.5433C30.3032 14.5964 31.6661 12.5633 31.6661 12.5633C31.6661 12.5633 31.2639 13.5216 29.4074 14.6231C26.6483 16.2595 26.2915 16.8663 26.2915 16.8663C26.2915 16.8663 26.524 16.7404 27.323 16.3371C25.4002 17.9829 24.1496 19.823 24.1496 19.823L23.9527 19.8811L24.0795 19.9951L24.253 20.0642L24.1947 20.2029L23.9757 20.2253C23.9757 20.2253 23.9527 20.5479 24.1612 20.6409C23.7903 20.9279 23.4314 21.3074 23.4314 21.3074L23.6159 21.3879C23.6159 21.3879 23.8709 21.6289 23.5465 21.9177C23.2687 22.2166 23.2568 21.837 23.2568 21.837C23.2568 21.837 23.2454 22.3198 22.6085 22.6538C22.4812 22.6992 22.2727 22.6416 22.2727 22.6416L21.9595 22.9987C21.9595 22.9987 24.1612 22.838 26.1071 22.032C22.539 23.7813 20.5126 23.9765 20.5126 23.9765V24.0341L20.7904 24.1037C20.7904 24.1037 20.0723 24.5398 17.3621 24.7826C17.8246 24.9317 17.8947 24.9205 17.8947 24.9205C17.8947 24.9205 17.2572 25.1273 15.7178 25.23C16.3083 25.4379 16.898 25.5081 16.898 25.5081L12.3351 25.5421C8.82523 25.5069 1.68961 22.5415 3.50964 16.1181C5.45538 9.25017 14.1769 8.04375 14.1769 8.04375C14.1769 8.04375 9.96545 6.80094 6.18486 8.55928C2.3281 10.3553 0 9.31929 0 9.31929L1.67998 7.67337L1.07749 7.83464L2.22304 6.81038L2.3044 6.95969L3.86842 5.30346L3.99579 5.50048L4.11213 5.61466L4.1575 5.41789L4.05409 5.2458L4.54036 4.71781L4.48232 4.67135L4.85301 4.08419L5.13107 4.02666L5.98804 3.11721C5.98804 3.11721 5.46729 3.71646 5.13107 4.32603C4.96847 4.87756 4.63301 5.10757 4.63301 5.10757C4.63301 5.10757 4.65582 5.15453 4.71373 5.25688C5.00345 4.48705 6.61284 3.67001 6.61284 3.67001C6.61284 3.67001 6.26635 3.94647 5.89515 4.32603C6.43947 3.8426 10.2161 1.35762 10.2161 1.35762L10.3776 1.36908L10.3896 1.49509C10.3896 1.49509 8.32729 2.99031 7.34321 4.02666C8.21108 3.76254 9.20822 2.9212 9.20822 2.9212L9.2655 3.09481L9.56713 3.11721L9.67092 3.03778L9.94911 2.85246L10.053 2.78347L10.0884 2.58771L10.4583 2.60068L10.4933 2.69195H10.5864L10.7243 2.63505L10.7712 2.51948L10.6902 2.39296L10.7712 2.28922C10.7712 2.28922 10.8641 2.38125 10.9565 2.50865C11.2815 2.19707 12.6137 1.87491 12.6137 1.87491C12.6137 1.87491 12.5323 1.9901 12.4399 2.09359C16.0297 1.42611 19.0416 0.218171 19.0416 0.218171L19.2839 0.206337L19.3079 0.126396L19.5397 0.10298Z" fill="#E41E26"/></g>
              </svg>
              <svg width="100" height="26" viewBox="0 0 100 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[100px] max-md:hidden">
                <g><path fillRule="evenodd" clipRule="evenodd" d="M51.5505 20.1501H50.5769L50.3984 17.5929H50.3582C49.4061 19.599 47.5005 20.4442 45.456 20.4442C40.9891 20.4442 38.7656 16.9636 38.7656 13.1283C38.7656 9.29396 40.9891 5.8125 45.456 5.8125C48.4334 5.8125 50.8555 7.40551 51.372 10.4726H50.0221C49.8431 8.86099 48.1558 6.95308 45.456 6.95308C41.7037 6.95308 40.1168 10.0608 40.1168 13.1283C40.1168 16.1972 41.7037 19.304 45.456 19.304C48.5923 19.304 50.4189 17.1206 50.3582 14.1513H45.535V13.0107H51.5505V20.1501Z" fill="#E41E26"/><path fillRule="evenodd" clipRule="evenodd" d="M60.4616 14.6036H60.4219C60.263 14.8982 59.7081 14.9968 59.3702 15.0561C57.2454 15.4293 54.606 15.4099 54.606 17.3956C54.606 18.6357 55.7179 19.403 56.8883 19.403C58.7944 19.403 60.4822 18.2027 60.4616 16.2161V14.6036ZM53.7915 13.1085C53.9103 10.7291 55.5985 9.70618 57.9407 9.70618C59.7468 9.70618 61.7122 10.2572 61.7122 12.9714V18.3598C61.7122 18.8317 61.951 19.1073 62.4465 19.1073C62.5862 19.1073 62.7442 19.0679 62.8438 19.029V20.0709C62.5666 20.1306 62.3675 20.1497 62.03 20.1497C60.7587 20.1497 60.5614 19.4416 60.5614 18.3802H60.5212C59.6477 19.6981 58.754 20.4442 56.7881 20.4442C54.9035 20.4442 53.355 19.5199 53.355 17.4749C53.355 14.6236 56.1534 14.525 58.8531 14.2106C59.8856 14.0921 60.4614 13.9541 60.4614 12.8329C60.4614 11.1616 59.2499 10.7486 57.7818 10.7486C56.2333 10.7486 55.082 11.4566 55.0419 13.1085H53.7915Z" fill="#E41E26"/><path fillRule="evenodd" clipRule="evenodd" d="M64.2124 10.0007H65.3632V12.3809H65.4034C66.0386 10.7486 67.4282 9.78489 69.274 9.86361V11.1028C67.0117 10.9843 65.4627 12.637 65.4627 14.7408V20.1501H64.2124V10.0007Z" fill="#E41E26"/><path fillRule="evenodd" clipRule="evenodd" d="M77.4719 14.3675C77.4121 12.499 76.2417 10.7485 74.216 10.7485C72.172 10.7485 71.0408 12.5189 70.8413 14.3675H77.4719ZM70.8412 15.4098C70.8613 17.2186 71.8139 19.4029 74.2159 19.4029C76.0429 19.4029 77.0357 18.3397 77.4321 16.806H78.6824C78.1467 19.1079 76.7969 20.444 74.2159 20.444C70.9604 20.444 69.5918 17.9665 69.5918 15.0759C69.5918 12.4007 70.9604 9.70642 74.2159 9.70642C77.5115 9.70642 78.8212 12.5585 78.7221 15.4098H70.8412Z" fill="#E41E26"/><path fillRule="evenodd" clipRule="evenodd" d="M80.3892 10.0008H81.6395V11.7517H81.6792C82.1354 10.5324 83.5049 9.70667 84.9548 9.70667C87.8331 9.70667 88.7057 11.2011 88.7057 13.6198V20.1502H87.4559V13.817C87.4559 12.0666 86.8805 10.7486 84.8552 10.7486C82.8697 10.7486 81.6792 12.2435 81.6395 14.2296V20.1502H80.3892V10.0008Z" fill="#E41E26"/><path fillRule="evenodd" clipRule="evenodd" d="M97.6182 14.6036H97.5781C97.4205 14.8982 96.8638 14.9968 96.5264 15.0561C94.402 15.4293 91.7612 15.4099 91.7612 17.3956C91.7612 18.6357 92.8741 19.403 94.0445 19.403C95.9514 19.403 97.6379 18.2027 97.6182 16.2161V14.6036ZM90.9486 13.1085C91.0678 10.7291 92.7547 9.70618 95.0973 9.70618C96.903 9.70618 98.8688 10.2572 98.8688 12.9714V18.3598C98.8688 18.8317 99.1068 19.1073 99.6022 19.1073C99.7415 19.1073 99.9 19.0679 100 19.029V20.0709C99.7223 20.1306 99.5241 20.1497 99.1862 20.1497C97.9163 20.1497 97.7172 19.4416 97.7172 18.3802H97.6774C96.8048 19.6981 95.9115 20.4442 93.9457 20.4442C92.0592 20.4442 90.5107 19.5199 90.5107 17.4749C90.5107 14.6236 93.31 14.525 96.0102 14.2106C97.0427 14.0921 97.6181 13.9541 97.6181 12.8329C97.6181 11.1616 96.407 10.7486 94.9375 10.7486C93.3895 10.7486 92.2387 11.4566 92.1985 13.1085H90.9486Z" fill="#E41E26"/><path fillRule="evenodd" clipRule="evenodd" d="M19.6346 0.0230808L19.5414 0.10481L19.3098 0.128647L19.2851 0.210755L19.0433 0.222106C19.0433 0.222106 16.0312 1.45144 12.4408 2.13138C12.5333 2.0262 12.6141 1.90928 12.6141 1.90928C12.6141 1.90928 11.2822 2.23733 10.9581 2.55327C10.865 2.42462 10.7725 2.33041 10.7725 2.33041L10.6909 2.43597L10.7725 2.56462L10.7257 2.68305L10.5877 2.74057H10.4945L10.46 2.64749L10.0896 2.63538L10.0544 2.8344L9.94997 2.9044L9.67229 3.09208L9.56825 3.17381L9.26663 3.15072L9.209 2.9744C9.209 2.9744 8.21243 3.83104 7.34422 4.09855C8.32844 3.04478 10.3904 1.52182 10.3904 1.52182L10.3788 1.39355L10.2168 1.3822C10.2168 1.3822 6.44008 3.91239 5.89596 4.40428C6.26644 4.01758 6.6141 3.73569 6.6141 3.73569C6.6141 3.73569 5.00417 4.56774 4.71415 5.35286C4.65652 5.24768 4.63331 5.2 4.63331 5.2C4.63331 5.2 4.969 4.96503 5.13066 4.40428C5.46672 3.78299 5.98877 3.17381 5.98877 3.17381L5.13066 4.09855L4.85336 4.15796L4.48287 4.75503L4.54088 4.80233L4.05476 5.33962L4.15804 5.51594L4.11201 5.71535L3.99638 5.59881L3.86914 5.39865L2.30487 7.08582L2.22404 6.93333L1.0774 7.97651L1.68028 7.81154L0 9.4866C0 9.4866 2.32919 10.5411 6.18598 8.71321C9.96643 6.92274 14.178 8.18764 14.178 8.18764C14.178 8.18764 5.45549 9.41661 3.50951 16.4082C1.68964 22.9465 8.82654 25.9659 12.336 26L16.9001 25.9659C16.9001 25.9659 16.3096 25.8948 15.7187 25.6837C17.259 25.5789 17.8963 25.3681 17.8963 25.3681C17.8963 25.3681 17.8267 25.3802 17.3634 25.2277C20.0736 24.981 20.7928 24.5361 20.7928 24.5361L20.514 24.4661V24.407C20.514 24.407 22.5416 24.2092 26.1087 22.4274C24.1635 23.2485 21.9616 23.4119 21.9616 23.4119L22.2752 23.0483C22.2752 23.0483 22.4836 23.1066 22.6105 23.0608C23.2478 22.7214 23.2594 22.2284 23.2594 22.2284C23.2594 22.2284 23.271 22.6154 23.5494 22.3112C23.8731 22.0176 23.6183 21.7728 23.6183 21.7728L23.4334 21.6903C23.4334 21.6903 23.793 21.3044 24.1635 21.0108C23.9551 20.9173 23.979 20.5892 23.979 20.5892L24.1983 20.5658L24.2556 20.4258L24.0819 20.3554L23.9551 20.2377L24.1519 20.1798C24.1519 20.1798 25.4026 18.3058 27.3257 16.6307C26.5264 17.0405 26.2944 17.1695 26.2944 17.1695C26.2944 17.1695 26.651 16.5509 29.4113 14.8856C31.2682 13.7649 31.6698 12.7891 31.6698 12.7891C31.6698 12.7891 30.3061 14.8584 28.0899 14.8047C25.7154 14.7453 23.9551 15.0741 23.9551 15.0741C23.9551 15.0741 25.0433 14.8618 25.6578 14.2416C25.6578 14.2416 23.5427 14.9904 22.2864 14.1364C19.425 12.1916 14.7573 13.0464 14.7573 13.0464C14.7573 13.0464 10.359 13.6143 9.4515 17.0526C8.80333 19.5124 11.5842 20.1912 11.5842 20.1912C11.5842 20.1912 13.3607 20.6165 14.016 18.9032C14.41 17.8725 13.553 17.2622 13.553 17.2622C13.553 17.2622 12.11 15.8251 13.1825 14.6162C14.3872 13.2579 18.0468 14.1474 18.0468 14.1474C18.0468 14.1474 23.0049 15.3896 19.7615 21.2923C17.6542 25.0397 13.0665 24.6659 13.0665 24.6659C13.0665 24.6659 8.40965 24.8751 7.83034 19.9343C7.66905 18.4586 7.87712 17.6618 7.87712 17.6618L8.09679 17.4707L8.00174 17.4007V17.3046C8.00174 17.3046 8.01034 17.2073 8.19222 17.2073C8.37409 17.2073 8.28765 16.997 8.28765 16.997L8.08781 16.9788C8.08781 16.9788 8.07958 16.7597 8.27904 16.5932C8.18286 16.566 8.19222 16.5134 8.19222 16.5134C8.19222 16.5134 8.28765 16.286 8.48748 16.3734C8.5047 16.6984 8.70566 16.4699 8.70566 16.4699C8.70566 16.4699 8.49684 16.5055 8.62707 16.0306C8.84375 15.5569 9.53832 15.1437 9.53832 15.1437C9.53832 15.1437 9.43428 15.1338 9.33923 15.0287C9.97317 14.819 10.2254 14.2825 10.2254 14.2825L10.121 14.2556C10.121 14.2556 10.0431 14.3707 9.87774 14.3442C9.91255 14.2121 9.96531 14.1504 9.96531 14.1504L9.87774 14.1334V13.9401L9.65171 13.9227C9.65171 13.9227 9.48667 13.8175 9.66069 13.6328C10.1128 13.545 10.0776 13.0793 10.0776 13.0793L10.2422 13.1319L10.3556 12.9559L10.4252 12.7622L10.5117 12.6657L10.7823 12.7807L10.9376 12.8598L11.3282 13.2026L11.0083 12.6305L11.0764 12.4822L11.1202 12.3403L10.9028 12.3157L10.8945 12.2094L11.1202 12.122L11.1378 12.0516L11.2074 12.0247L11.2418 11.8144L11.5801 11.7886L11.7373 11.4371C11.7373 11.4371 13.5298 8.8865 17.7683 9.13509C20.9661 9.32277 21.7804 11.2805 25.599 11.0096C27.9163 10.8453 28.5409 11.1038 28.5409 11.1038C28.5409 11.1038 27.3598 10.26 26.1087 10.1892C27.3845 10.1192 28.3796 9.97849 28.3796 9.97849L28.2168 9.88995L28.0615 9.80293L27.9395 9.74958L27.783 9.85552L27.5742 9.8733L27.2442 9.73255L27.0885 9.68071L26.9313 9.69774L26.7756 9.88995L26.55 9.85552L25.9063 9.73255L26.6012 9.69774L26.8097 9.55623L26.9665 9.46958H27.1745L27.1929 9.59104L27.5402 9.62698L27.6962 9.73255L27.9215 9.62698L28.1479 9.69774L28.3219 9.62698L28.4956 9.5392L28.6168 9.50439L28.8084 9.55623L29.1213 9.27623L29.2781 9.25882L29.3806 9.43477L29.4686 9.50439L29.3806 9.64439H29.5554L29.6078 9.41661L29.573 9.32882L29.8147 9.25882H30.0767L30.1107 9.43477L30.1979 9.32882L30.2159 9.20547L30.4412 9.04769L31.3094 8.57321L31.6054 8.48467L31.745 8.37948L32.3872 8.30948C32.3872 8.30948 33.2733 8.02911 34.0038 7.07976C34.0038 7.07976 31.1361 8.95953 26.8624 7.94057C23.8836 7.23036 23.4046 6.48231 23.4046 6.48231L23.6302 6.39453L23.2833 6.28896L23.1086 6.20156L22.7957 6.23675L22.5528 6.04415H22.0843L22.0147 5.9208L21.545 5.88486L21.4934 5.7967L22.4312 5.78005L22.6397 5.97302L22.8661 5.93745L23.1434 6.07783L23.2654 6.09713L23.4218 6.20156H23.7343L23.8391 6.34231L23.7515 6.44712L23.9083 6.62382L24.1175 6.67566V6.44712L23.9959 6.30675L24.1175 6.11453H23.9427L23.8563 6.04415L23.8218 5.7267L23.6126 5.67448C23.6126 5.67448 20.416 3.70656 17.7743 4.83071C17.7743 4.83071 17.9307 4.63774 18.2211 4.53293C18.3027 4.52157 18.2444 4.43871 18.2444 4.43871L18.3132 4.40428L18.6844 4.4266L18.6493 4.34525L19.1825 4.3339L19.1474 4.21585L19.4486 4.21131L19.1358 4.12201L19.0048 4.29455L18.8981 4.17498L18.7424 4.12201L18.7664 4.30742L18.58 4.26314L18.3491 4.3339L18.1863 4.36871L18.0007 4.3339L17.9895 4.22833L17.7811 4.36871L17.665 4.34525L17.5026 4.32179L17.4798 4.01758L17.7683 3.84164C17.7683 3.84164 15.4178 3.74742 13.2746 4.59082C11.1314 5.43421 10.9117 5.82053 8.52528 6.32453C10.3672 5.7267 11.4443 4.98925 12.0004 4.63774C13.5411 3.74742 16.7733 1.9683 17.8735 1.31145C17.8963 1.18204 17.9307 1.18204 17.9307 1.18204L18.0584 1.26377L18.2324 1.06588L18.4176 1.01896V0.948963L18.7073 0.937234L18.7196 0.83091L18.8577 0.843397L18.8925 0.73783L19.1358 0.668209L18.8461 0.631885L18.8345 0.550535L19.1358 0.527076L19.1709 0.433617L19.321 0.515346L19.5755 0.234214L19.785 0.199403L19.9011 0L19.6346 0.0230808Z" fill="#E41E26"/></g>
              </svg>
              <div className="ms-1.5 h-5 border-e border-gray-200 md:ms-3 md:h-3.5"></div>
            </div>
            <div className="text-xs font-medium text-gray-800 max-md:max-w-24 md:text-base/5">Canal Oficial de Recarga</div>
          </a>
          <div className="flex min-w-0 items-stretch gap-4 md:gap-[18px]">
            <div className="relative flex items-center">
              <div className="relative h-[30px] w-[30px]">
                <div className="h-full w-full overflow-hidden rounded-full">
                  <img className="h-full w-full" src={config.icon} alt="Game icon" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Espaçamento para o header fixo */}
      <div className="h-16 sm:h-20"></div>

      {/* Background Banner */}
      <div className="relative w-full" style={{ height: '180px' }}>
        <img 
          src={config.banner} 
          alt={`${config.name} Banner`} 
          className="w-full h-banner-custom object-cover"
        />
        
        <a
          href={addUtmsToUrl('/recargajogo')}
          className="absolute start-4 top-4 md:start-6 md:top-6 flex items-center gap-0.5 rounded-full bg-black/40 p-1.5 pe-3 text-sm/none font-medium text-white outline outline-1 -outline-offset-1 outline-white/70 transition-colors hover:bg-[#606060]/50 md:pe-3.5 md:text-base/none z-10"
          aria-label="Voltar para a pagina inicial"
        >
          <svg width="1em" height="1em" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-90 text-base rtl:-rotate-90 md:text-xl">
            <g>
              <path fillRule="evenodd" clipRule="evenodd" d="M17.1716 28.1716C18.7337 26.6095 21.2663 26.6095 22.8284 28.1716L40 45.3431L57.1716 28.1716C58.7337 26.6095 61.2663 26.6095 62.8284 28.1716C64.3905 29.7337 64.3905 32.2663 62.8284 33.8284L42.8284 53.8284C41.2663 55.3905 38.7337 55.3905 37.1716 53.8284L17.1716 33.8284C15.6095 32.2663 15.6095 29.7337 17.1716 28.1716Z" fill="currentColor"/>
            </g>
          </svg>
          Voltar
        </a>
      </div>

      {/* Ícone e Título */}
      <div className="relative flex flex-col items-center bg-white" style={{ marginTop: '-32px' }}>
        <div className="w-16-custom h-16-custom mb-3 relative" style={{
          border: '1px solid white',
          borderRadius: '15px',
          padding: '4px',
          backgroundColor: 'white',
          marginTop: '-110px',
          width: '70px',

        }}>
          <img src={config.icon} alt={`${config.name} Icon`} className="w-full h-full object-contain" style={{ borderRadius: '8px' }} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 whitespace-pre-line text-center">
          {isOrderBumpPurchase ? orderBumpItemName : config.name}
        </h2>
        <div className="h-4"></div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <dl className="mb-3 grid grid-cols-2 justify-between gap-x-3.5 px-4 md:mb-4 md:px-10">
            {/* Total */}
            <dt className="py-3 text-sm/none md:text-base/none">Total</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium md:text-base/none">
              {!isOrderBumpPurchase && <img className="h-3.5 w-3.5" src={config.coinIcon} alt={config.coinName} />}
              {isOrderBumpPurchase ? orderBumpItemName : itemValue?.replace(/\./g, '').replace(/,/g, '')}
            </dd>

            {/* Detalhes em Card */}
            {itemType === "recharge" && (
              <div className="col-span-2 mb-2 w-full">
                <ul className="flex flex-col gap-3 rounded-[5px] border border-gray-200 bg-gray-50 p-3 text-xs/none md:text-sm/none">
                  <li className="flex items-start justify-between gap-12">
                    <div className="shrink-0">Preço Original</div>
                    <div className="text-end font-medium">
                      <div className="flex items-center gap-1">
                        <img className="h-3 w-3 object-contain" src={config.coinIcon} alt={config.coinName} />
                        <div>{itemValue?.replace(/\./g, '').replace(/,/g, '')}</div>
                      </div>
                    </div>
                  </li>
                  {parseInt(itemBonus) > 0 && (
                    <li className="flex items-start justify-between gap-12">
                      <div className="shrink-0">+ Bônus Geral</div>
                      <div className="text-end font-medium">
                        <div className="flex items-center gap-1">
                          <img className="h-3 w-3 object-contain" src={config.coinIcon} alt={config.coinName} />
                          <div>{parseInt(itemBonus).toLocaleString()}</div>
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Informação sobre os diamantes/coins */}
            {itemType === "recharge" && (
              <div className="col-span-2 mb-1 text-xs/normal text-gray-600 md:text-sm/normal">
                Os {config.coinName.toLowerCase()}, são válidos apenas para a região do Brasil e serão creditados diretamente na conta de jogo.
              </div>
            )}

            {/* Preço */}
            <dt className="py-3 text-sm/none md:text-base/none">Preço</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium md:text-base/none">
              <span className="items-center [text-decoration:inherit] justify-end flex">
                {(() => {
                  // Se é order bump, mostrar apenas o valor do order bump
                  const basePrice = isOrderBumpPurchase ? 0 : getFinalPrice()
                  const promoTotal = getPromoTotal()
                  const total = basePrice + promoTotal
                  return formatPrice(total.toString())
                })()}
              </span>
            </dd>

            {/* Método de pagamento */}
            <dt className="py-3 text-sm/none md:text-base/none">Método de pagamento</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium md:text-base/none">
              {paymentMethod === "PIX" ? "Pix via PagSeguro" : 
               paymentMethod === "CREDIT_CARD" ? "Cartão de Crédito" :
               paymentMethod === "PICPAY" ? "PicPay" :
               paymentMethod === "NUPAY" ? "NuPay" :
               paymentMethod === "MERCADO_PAGO" ? "Mercado Pago" :
               "Pix via PagSeguro"}
            </dd>

            {/* Nome do Jogador */}
            <dt className="py-3 text-sm/none md:text-base/none">Nome do Jogador</dt>
            <dd className="flex items-center justify-end gap-1 py-3 text-end text-sm/none font-medium md:text-base/none">
              {config.showNickname ? (playerNickname || playerId || 'N/A') : (playerId || 'N/A')}
            </dd>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          {!pixData ? (
            <div className="flex flex-col gap-6">
              {/* Nome Completo */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[15px]/4 font-medium text-gray-800">Nome Completo</span>
                </div>
                <div className="relative flex items-end justify-between">
                  <input
                    name="name"
                    placeholder="Nome Completo"
                    maxLength={50}
                    className="w-full flex-1 px-3 py-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{ backgroundColor: 'white', border: '1px solid #d1d5db' }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[15px]/4 font-medium text-gray-800">E-mail</span>
                </div>
                <div className="relative flex items-end justify-between">
                  <input
                    name="email"
                    type="email"
                    placeholder="E-mail"
                    maxLength={60}
                    className="w-full flex-1 px-3 py-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{ backgroundColor: 'white', border: emailError ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError("")
                    }}
                  />
                </div>
                {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
              </div>

              {/* CPF e Data de Nascimento */}
              <div className="grid grid-cols-2 items-end gap-x-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[15px]/4 font-medium text-gray-800">CPF</span>
                  </div>
                  <div className="relative flex items-end justify-between">
                    <input
                      inputMode="numeric"
                      name="CPF"
                      placeholder="CPF"
                      className="w-full flex-1 px-3 py-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      style={{ backgroundColor: 'white', border: cpfError ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                      type="text"
                      value={cpf}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value)
                        setCpf(formatted)
                        if (formatted.replace(/\D/g, '').length === 11) {
                          setCpfError(validateCPF(formatted) ? "" : "CPF inválido")
                        } else {
                          setCpfError("")
                        }
                      }}
                      maxLength={14}
                    />
                  </div>
                  {cpfError && <p className="text-xs text-red-600 mt-1">{cpfError}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[15px]/4 font-medium text-gray-800">Data de nascimento</span>
                  </div>
                  <div className="relative flex items-end justify-between">
                    <input
                      inputMode="numeric"
                      name="DOB"
                      placeholder="DD/MM/AAAA"
                      className="w-full flex-1 px-3 py-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      style={{ backgroundColor: 'white', border: dobError ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                      type="text"
                      value={dob}
                      onChange={(e) => {
                        const formatted = formatDOB(e.target.value)
                        setDob(formatted)
                        if (formatted.replace(/\D/g, '').length === 8) {
                          setDobError(validateDOB(formatted) ? "" : "Data inválida")
                        } else {
                          setDobError("")
                        }
                      }}
                      maxLength={10}
                    />
                  </div>
                  {dobError && <p className="text-xs text-red-600 mt-1">{dobError}</p>}
                </div>
              </div>

              {/* Número de telefone */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[15px]/4 font-medium text-gray-800">Número de telefone</span>
                </div>
                <div className="relative flex items-end justify-between">
                  <input
                    inputMode="numeric"
                    name="phone"
                    placeholder="Número de telefone"
                    className="w-full flex-1 px-3 py-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{ backgroundColor: 'white', border: phoneError ? '1px solid #ef4444' : '1px solid #d1d5db' }}
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
                      setPhone(formatted)
                      if (formatted.replace(/\D/g, '').length === 11) {
                        setPhoneError(validatePhone(formatted) ? "" : "Telefone inválido")
                      } else {
                        setPhoneError("")
                      }
                    }}
                    maxLength={15}
                  />
                </div>
                {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
              </div>

              {/* Termos */}
              <div className="text-gray-600 text-xs/normal">
                Ao clicar em "Prosseguir para Pagamento", atesto que li e concordo com os{" "}
                <a href="https://international.pagseguro.com/legal-compliance" style={{textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer">
                  termos de uso
                </a>{" "}
                e com a{" "}
                <a href="https://sobreuol.noticias.uol.com.br/normas-de-seguranca-e-privacidade/" style={{textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer">
                  política de privacidade
                </a>{" "}
                do PagSeguro
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col">
              {pixError ? (
                <div className="text-center py-6">
                  <p className="text-red-600 mb-4">{pixError}</p>
                  <button
                    onClick={() => {
                      setShowPixInline(false)
                      setPixError("")
                      setPixData(null)
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : pixData ? (
                <>
                  {paymentStatus === 'paid' ? (
                    /* Pagamento Confirmado - Layout com Fila */
                    <>
                      <div className="mb-6 p-6">
                        <div className="flex flex-col items-center text-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 Pagamento Confirmado!</h3>
                          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                            Devido a grande demanda da promoção, sua compra será processada e enviada no correio do jogo em <span className="font-bold text-red-600">5-7 dias úteis</span>.
                          </p>
                          
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4 w-full">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-semibold text-blue-900 mb-1">
                                  ⏰ Prazo de Entrega
                                </p>
                                <p className="text-xs text-blue-800 leading-relaxed">
                                  Seus {itemType === "recharge" ? config.coinName.toLowerCase() : "itens"} serão enviados automaticamente para a conta vinculada ao ID informado dentro do prazo de 5-7 dias úteis.
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed">
                            Você receberá uma notificação assim que {itemType === "recharge" ? `seus ${config.coinName.toLowerCase()} estiverem disponíveis` : "seus itens estiverem disponíveis"} na sua conta! 🎮
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Aguardando Pagamento - Layout Completo */
                    <>
                      {/* Título */}
                      <div className="text-center text-lg font-medium text-gray-800 mb-4">Pague com Pix</div>
                      
                      {/* QR Code */}
                      <div className="my-3 flex h-[150px] w-full items-center justify-center">
                        {qrCodeImage ? (
                          <img 
                            src={qrCodeImage} 
                            alt="QR Code Pix" 
                            width="150" 
                            height="150" 
                            className="rounded-lg"
                          />
                        ) : (
                          <div className="w-[150px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-sm">Gerando QR Code...</span>
                          </div>
                        )}
                      </div>


                      {/* Código PIX */}
                      <div className="mb-4 mt-3 select-all break-words rounded-md bg-gray-100 p-4 text-sm text-gray-800">
                        {pixData.code}
                      </div>

                      {/* Botão Copiar */}
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(pixData.code)
                            setIsCopied(true)
                            setTimeout(() => setIsCopied(false), 2000)
                          } catch (error) {
                            // Fallback para dispositivos que não suportam clipboard API
                            const textArea = document.createElement('textarea')
                            textArea.value = pixData.code
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                            setIsCopied(true)
                            setTimeout(() => setIsCopied(false), 2000)
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-red-500 text-white hover:bg-red-600 px-4 py-2 mb-4 h-11 text-base font-bold w-full"
                      >
                        {isCopied ? 'Copiado!' : 'Copiar Código'}
                      </button>

                      {/* Botão de Teste (apenas com param secreto) */}
                      {testMode && (
                        <button
                          onClick={handleTestConversion}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 mb-6 h-11 text-base font-bold w-full"
                        >
                          🧪 Testar Conversão Google Ads
                        </button>
                      )}

                      {/* Timer/Alerta */}
                      <div role="alert" className="relative rounded-lg border p-4 bg-blue-50 border-blue-200 text-left w-full mb-4">
                        <div className="flex items-start gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600">
                            <path d="M5 22h14"></path>
                            <path d="M5 2h14"></path>
                            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
                          </svg>
                          <div>
                            <h5 className="mb-1 font-medium leading-none tracking-tight text-blue-800">Aguardando pagamento</h5>
                            <div className="text-sm text-blue-700">
                              {timerActive ? (
                                <>Você tem <span className="font-bold text-red-600">{formatTime(timeLeft)}</span> para pagar. Após o pagamento, os {config.coinName.toLowerCase()} podem levar alguns minutos para serem creditados.</>
                              ) : timeLeft === 0 ? (
                                <span className="text-red-600 font-medium">Tempo expirado. Gere um novo PIX para continuar.</span>
                              ) : (
                                `Você tem tempo para pagar. Após o pagamento, os ${config.coinName.toLowerCase()} podem levar alguns minutos para serem creditados.`
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instruções de pagamento */}
                      <div className="text-gray-500 text-sm space-y-4">
                        <p className="font-semibold">Para realizar o pagamento siga os passos abaixo:</p>
                        <ol className="list-decimal list-inside space-y-2 pl-2">
                          <li>Abra o app ou o site da sua instituição financeira e seleciona o Pix.</li>
                          <li>Utilize as informações acima para realizar o pagamento.</li>
                          <li>Revise as informações e pronto!</li>
                        </ol>
                                                <p>Você receberá seus {config.coinName.toLowerCase()} após recebermos a confirmação do pagamento. Isso ocorre geralmente em alguns minutos após a realização do pagamento na sua instituição financeira.</p>
                        <p>Em caso de dúvidas entre em contato com o suporte.</p>
                      </div>

                      {/* 🧪 BOTÃO DE TESTE - REMOVER EM PRODUÇÃO */}
                      {process.env.NODE_ENV === 'development' && (
                        <button
                          onClick={() => {
                            console.log('🧪 [TESTE] Simulando pagamento aprovado...')
                            setPaymentStatus('paid')
                            setTimerActive(false)
                            setTimeout(() => {
                              setShowSuccessModal(true)
                            }, 2000)
                          }}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-lg mt-4"
                        >
                          🧪 TESTE: Simular Pagamento Aprovado
                        </button>
                      )}
                    </>
                  )}

                  {/* Status de Expirado */}
                  {paymentStatus === 'expired' && (
                    <>
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">⏰ Tempo Expirado</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          O tempo para pagamento expirou. Gere um novo PIX para continuar.
                        </p>
                      </div>

                      {/* Botão Gerar Novo PIX */}
                      <button
                        onClick={() => {
                          setShowPixInline(false)
                          setPixData(null)
                          setIsCopied(false)
                          setQrCodeImage("")
                          setTimerActive(false)
                          setTimeLeft(15 * 60)
                          setPaymentStatus('pending')
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors px-4 py-2 h-11 text-base font-bold w-full bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Gerar Novo PIX
                      </button>
                    </>
                  )}

                  {/* Botão Voltar - Apenas para pending */}
                  {paymentStatus === 'pending' && timeLeft > 0 && (
                    <button
                      onClick={() => {
                        setShowPixInline(false)
                        setPixData(null)
                        setIsCopied(false)
                        setQrCodeImage("")
                        setTimerActive(false)
                        setTimeLeft(15 * 60)
                        setPaymentStatus('pending')
                      }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors px-4 py-2 h-11 text-base font-bold w-full bg-gray-500 text-white hover:bg-gray-600 mt-4"
                    >
                      Voltar
                    </button>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        {!pixData && (
          <>
            <div className="text-gray-500 text-xs/normal mb-4">
              Ao clicar em "Prosseguir para Pagamento", atesto que li e concordo com os termos de uso e com a política de privacidade.
            </div>
            <button
              onClick={handleProceedToPayment}
              disabled={isProcessingPayment || !fullName || !email || !cpf || !dob || !phone || !!cpfError || !!phoneError || !!dobError}
              className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg ${
                isProcessingPayment 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isProcessingPayment ? 'Processando...' : 'Prosseguir para Pagamento'}
            </button>
          </>
        )}
      </div>

      {/* Modal de Promoção */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-6 pb-0">
              <h2 className="font-semibold text-center text-xl mb-2">Promoção Especial</h2>
              <p className="text-center text-sm text-gray-600 pt-2">
                Aproveite estas ofertas exclusivas para turbinar ainda mais sua conta!
              </p>
            </div>

            {/* Items List */}
            <div className="p-6 py-4 space-y-2 overflow-y-auto flex-1">
              {promoItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => togglePromoItem(item.id)}
                  className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                      {/* Tag HOT para os 3 Jimg */}
                      {item.name.includes('Jimg') && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl">
                          HOT
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        <span className="line-through">R$ {item.oldPrice.toFixed(2).replace('.', ',')}</span>
                        <span className="text-red-600 font-bold ml-1.5">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div
                    className={`h-4 w-4 shrink-0 rounded-sm border transition-colors ${
                      selectedPromos.includes(item.id)
                        ? 'bg-red-600 border-red-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedPromos.includes(item.id) && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 flex flex-col gap-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <div className="flex justify-between items-center font-bold text-lg text-gray-800">
                <span>Total:</span>
                <span>R$ {(paymentStatus === 'paid' ? getPromoTotal() : getFinalPrice() + getPromoTotal()).toFixed(2).replace('.', ',')}</span>
              </div>
              <button
                onClick={() => {
                  console.log('🔘 [BOTÃO] Clicou em Gerar Novo PIX')
                  console.log('🔘 [BOTÃO] isProcessingPayment:', isProcessingPayment)
                  console.log('🔘 [BOTÃO] paymentStatus:', paymentStatus)
                  console.log('🔘 [BOTÃO] selectedPromos:', selectedPromos)
                  handleFinalizeOrder()
                }}
                disabled={isProcessingPayment}
                className={`w-full h-12 text-lg font-bold rounded-md transition-colors ${
                  isProcessingPayment
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isProcessingPayment 
                  ? 'Gerando PIX...' 
                  : paymentStatus === 'paid' 
                    ? 'Gerar Novo PIX' 
                    : 'Finalizar Pedido'
                }
              </button>
              <button
                onClick={() => {
                  setShowPromoModal(false)
                  setSelectedPromos([])
                  // Se já pagou e não quer order bump, apenas fecha o modal
                  if (paymentStatus !== 'paid') {
                    handleFinalizeOrder()
                  }
                }}
                className="w-full h-10 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Não, obrigado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white text-gray-600 border-t border-gray-200">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-3 p-4 text-center text-xs md:items-start max-md:pb-5">
            <div className="flex flex-col items-center gap-3 leading-none md:w-full md:flex-row md:justify-between">
              <div className="md:text-start text-gray-800">© 2025 Garena Online. Todos os direitos reservados.</div>
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <a href="#" className="transition-opacity hover:opacity-100 hover:text-gray-900">FAQ</a>
                <div className="h-3 w-px bg-gray-300"></div>
                <a href="/termos-recargajogo" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-100 hover:text-gray-900">Termos e Condições</a>
                <div className="h-3 w-px bg-gray-300"></div>
                <a href="/politica-privacidade-recargajogo" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-100 hover:text-gray-900">Política de Privacidade</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Toast
        isVisible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />

      <PendingPaymentModal
        isOpen={showPendingPaymentModal}
        onContinue={handleContinuePendingPayment}
        onStartNew={handleStartNewPayment}
      />

      {/* Modais de Sucesso e Reembolso */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        showOfferButton={!isOrderBumpPurchase}
        onGetOffer={() => {
          console.log('🔘 [BOTÃO] Clicou em Obter oferta no SuccessModal')
          setShowSuccessModal(false)
          setTimeout(() => setShowPromoModal(true), 100) // Pequeno delay para garantir transição suave
          console.log(' [ORDER BUMP] Modal de promoção ativado')
        }}
        onRequestRefund={() => {
          setShowSuccessModal(false)
          if (isOrderBumpPurchase) {
            // Se já comprou o order bump, volta para o início
            window.location.href = '/'
          } else {
            // Se foi a primeira compra, oferece reembolso
            setShowRefundModal(true)
          }
        }}
      />

      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        transactionId={pixData?.transactionId || ''}
      />

      {/* Modal de Erro */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Atenção!
              </h2>
            </div>

            {/* Conteúdo */}
            <div className="p-6 text-center">
              <p className="text-lg text-gray-800 mb-6">
                {errorMessage}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
