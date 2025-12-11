/**
 * Configuração de múltiplas tags do Google Ads
 * 
 * Permite configurar várias tags e labels de conversão
 * para disparar em diferentes eventos (compra, lead, etc)
 */

export interface GoogleAdsConversion {
  id: string // ID único para identificar
  name: string // Nome descritivo
  adsId: string // AW-XXXXXXXXXX
  label: string // Label da conversão
  enabled: boolean // Se está ativo
  events?: string[] // Eventos que disparam (ex: ['purchase', 'lead'])
}

/**
 * Carregar configurações de conversões do .env
 * 
 * Formato no .env:
 * NEXT_PUBLIC_GOOGLE_ADS_CONVERSIONS=[
 *   {"id":"main","name":"Conversão Principal","adsId":"AW-123","label":"abc","enabled":true},
 *   {"id":"backup","name":"Conversão Backup","adsId":"AW-456","label":"def","enabled":true}
 * ]
 * 
 * OU usar variáveis individuais (compatibilidade):
 * NEXT_PUBLIC_GOOGLE_ADS_ID=AW-123
 * NEXT_PUBLIC_GTAG_CONVERSION_COMPRA=abc
 */
export function getGoogleAdsConversions(): GoogleAdsConversion[] {
  const conversions: GoogleAdsConversion[] = []

  // Método 1: JSON no .env (novo)
  const conversionsJson = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSIONS
  if (conversionsJson) {
    try {
      const parsed = JSON.parse(conversionsJson)
      if (Array.isArray(parsed)) {
        conversions.push(...parsed.filter((c: any) => c.enabled))
        console.log(`✅ [Google Ads] ${conversions.length} conversões carregadas do JSON`)
        return conversions
      }
    } catch (error) {
      console.error('❌ [Google Ads] Erro ao parsear NEXT_PUBLIC_GOOGLE_ADS_CONVERSIONS:', error)
    }
  }

  // Método 2: Variáveis individuais (compatibilidade)
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  const label = process.env.NEXT_PUBLIC_GTAG_CONVERSION_COMPRA
  const enabled = process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === 'true'

  if (adsId && label && enabled) {
    conversions.push({
      id: 'main',
      name: 'Conversão Principal',
      adsId,
      label,
      enabled: true,
      events: ['purchase']
    })
    console.log(`✅ [Google Ads] 1 conversão carregada das variáveis individuais`)
  }

  // Método 3: Múltiplas conversões individuais (ex: _1, _2, _3)
  for (let i = 1; i <= 10; i++) {
    const adsIdKey = `NEXT_PUBLIC_GOOGLE_ADS_ID_${i}` as keyof typeof process.env
    const labelKey = `NEXT_PUBLIC_GTAG_CONVERSION_COMPRA_${i}` as keyof typeof process.env
    const enabledKey = `NEXT_PUBLIC_GOOGLE_ADS_ENABLED_${i}` as keyof typeof process.env
    const nameKey = `NEXT_PUBLIC_GOOGLE_ADS_NAME_${i}` as keyof typeof process.env

    const adsIdValue = process.env[adsIdKey]
    const labelValue = process.env[labelKey]
    const enabledValue = process.env[enabledKey] === 'true'
    const nameValue = process.env[nameKey] || `Conversão ${i}`

    if (adsIdValue && labelValue && enabledValue) {
      conversions.push({
        id: `conversion_${i}`,
        name: nameValue,
        adsId: adsIdValue,
        label: labelValue,
        enabled: true,
        events: ['purchase']
      })
    }
  }

  if (conversions.length > 0) {
    console.log(`✅ [Google Ads] ${conversions.length} conversão(ões) configurada(s)`)
  } else {
    console.warn('⚠️ [Google Ads] Nenhuma conversão configurada')
  }

  return conversions
}

/**
 * Verificar se Google Ads está habilitado
 */
export function isGoogleAdsEnabled(): boolean {
  const conversions = getGoogleAdsConversions()
  return conversions.length > 0
}

/**
 * Obter conversões para um evento específico
 */
export function getConversionsForEvent(event: string): GoogleAdsConversion[] {
  const conversions = getGoogleAdsConversions()
  return conversions.filter(c => 
    !c.events || c.events.length === 0 || c.events.includes(event)
  )
}
