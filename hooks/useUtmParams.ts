"use client"

import { useEffect, useState } from 'react'

export const useUtmParams = () => {
  const [utmParams, setUtmParams] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      
      // Capturar todos os parâmetros UTM e relacionados (Google Ads + UTMify + MCC)
      const utmParameters = [
        // UTMs básicos
        'utm_source',
        'utm_medium', 
        'utm_campaign',
        'utm_content',
        'utm_term',
        // Google Ads Click IDs
        'gclid',
        'gbraid',
        'wbraid',
        // Google Ads parâmetros adicionais
        'keyword',
        'device',
        'network',
        'gad_source',
        'gad_campaignid',
        // MCC (múltiplas contas Google Ads)
        'ctax',
        // Outros tracking
        'fbclid',
        'ttclid',
        'src',
        'sck',
        'xcod',
        'msclkid'
      ]

      const params = new URLSearchParams()
      
      utmParameters.forEach(param => {
        const value = urlParams.get(param)
        if (value) {
          params.set(param, value)
        }
      })

      const utmString = params.toString()
      setUtmParams(utmString)
      
      // Armazenar no localStorage E sessionStorage para persistir
      if (utmString) {
        localStorage.setItem('utmParams', utmString)
        
        // IMPORTANTE: Salvar cada parâmetro individualmente no sessionStorage
        // para o checkout conseguir recuperar
        utmParameters.forEach(param => {
          const value = urlParams.get(param)
          if (value) {
            sessionStorage.setItem(`utm_${param}`, value)
          }
        })
        
        console.log('✅ [UTM] Parâmetros salvos:', utmString)
      }
    }
  }, [])

  useEffect(() => {
    // Recuperar do localStorage se não houver na URL
    if (typeof window !== 'undefined' && !utmParams) {
      const stored = localStorage.getItem('utmParams')
      if (stored) {
        setUtmParams(stored)
      }
    }
  }, [utmParams])

  // Função para adicionar UTM params a uma URL
  const addUtmToUrl = (url: string): string => {
    if (!utmParams) return url
    
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${utmParams}`
  }

  // Função para criar objeto de parâmetros para router.push
  const getUtmObject = (): Record<string, string> => {
    if (!utmParams) return {}
    
    const params = new URLSearchParams(utmParams)
    const obj: Record<string, string> = {}
    
    params.forEach((value, key) => {
      obj[key] = value
    })
    
    return obj
  }

  return {
    utmParams,
    addUtmToUrl,
    getUtmObject
  }
}
