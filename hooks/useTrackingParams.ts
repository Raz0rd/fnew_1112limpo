import { useState, useEffect } from 'react'

export interface TrackingParameters {
  src: string | null
  sck: string | null
  utm_source: string | null
  utm_campaign: string | null
  utm_medium: string | null
  utm_content: string | null
  utm_term: string | null
  xcod: string | null
  keyword: string | null
  device: string | null
  network: string | null
  gclid: string | null
  gad_source: string | null
  gad_campaignid: string | null
  gbraid: string | null
  wbraid: string | null
  fbclid: string | null
  ctax: string | null // Google Ads Customer ID (para MCC)
}

export interface CustomerData {
  name: string
  email: string
  phone: string
  document: string
  country: string
  ip: string
}

export interface ProductData {
  id: string
  name: string
  planId: string | null
  planName: string | null
  quantity: number
  priceInCents: number
}

export interface OrderData {
  orderId: string
  platform: string
  paymentMethod: string
  status: 'waiting_payment' | 'paid' | 'refunded'
  createdAt: string
  approvedDate: string | null
  refundedAt: string | null
  paidAt?: string | null
  customer: CustomerData
  products: ProductData[]
  trackingParameters: TrackingParameters
  commission: {
    totalPriceInCents: number
    gatewayFeeInCents: number
    userCommissionInCents: number
    currency: string
  }
  isTest: boolean
}

export const useTrackingParams = () => {
  const [trackingParams, setTrackingParams] = useState<TrackingParameters>({
    src: null,
    sck: null,
    utm_source: null,
    utm_campaign: null,
    utm_medium: null,
    utm_content: null,
    utm_term: null,
    xcod: null,
    keyword: null,
    device: null,
    network: null,
    gclid: null,
    gad_source: null,
    gad_campaignid: null,
    gbraid: null,
    wbraid: null,
    fbclid: null,
    ctax: null,
  })

  const [userIP, setUserIP] = useState<string>('')

  useEffect(() => {
    // Capturar parâmetros da URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      
      const params: TrackingParameters = {
        src: urlParams.get('src'),
        sck: urlParams.get('sck'),
        utm_source: urlParams.get('utm_source'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_medium: urlParams.get('utm_medium'),
        utm_content: urlParams.get('utm_content'),
        utm_term: urlParams.get('utm_term'),
        xcod: urlParams.get('xcod'),
        keyword: urlParams.get('keyword'),
        device: urlParams.get('device'),
        network: urlParams.get('network'),
        gclid: urlParams.get('gclid'),
        gad_source: urlParams.get('gad_source'),
        gad_campaignid: urlParams.get('gad_campaignid'),
        gbraid: urlParams.get('gbraid'),
        wbraid: urlParams.get('wbraid'),
        fbclid: urlParams.get('fbclid'),
        ctax: urlParams.get('ctax'),
      }

      setTrackingParams(params)

      // Armazenar no localStorage para persistir durante a sessão
      localStorage.setItem('trackingParams', JSON.stringify(params))

      //console.log('[v0] Tracking parameters captured:', params)
    }
  }, [])

  useEffect(() => {
    // Recuperar parâmetros do localStorage se disponível
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trackingParams')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setTrackingParams(parsed)
        } catch (error) {
          //console.error('[v0] Error parsing stored tracking params:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    // Capturar IP do usuário
    const fetchUserIP = async () => {
      try {
        const response = await fetch('/api/get-user-ip')
        if (response.ok) {
          const data = await response.json()
          setUserIP(data.ip)
        } else {
          setUserIP('unknown')
        }
      } catch (error) {
        //console.error('[v0] Error fetching user IP:', error)
        setUserIP('unknown')
      }
    }

    fetchUserIP()
  }, [])

  return {
    trackingParams,
    userIP
  }
}
