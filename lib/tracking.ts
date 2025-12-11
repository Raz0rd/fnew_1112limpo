// Utilitário para rastreamento de conversões

// Tipos para os parâmetros UTM
type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
  network?: string;
  placement?: string;
  device?: string;
  [key: string]: string | undefined;
};

// Função para extrair parâmetros UTM da URL
export function getUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utmParams: UtmParams = {};
  
  // Parâmetros UTM padrão
  const utmKeys = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'utm_id', 'network', 'placement', 'device', 'gclid', 'fbclid', 'msclkid'
  ];
  
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) utmParams[key] = value;
  });
  
  return utmParams;
}

// Função para enviar evento de conversão para o Ratoeira ADS
export async function sendRatoeiraConversion(
  orderId: string,
  status: 'pending' | 'paid',
  amount: number,
  currency: string = 'BRL'
) {
  try {
    const utmParams = getUtmParams();
    
    // Construir a URL de conversão
    const baseUrl = 'https://s2s.ratoeiraads.com.br/s2s/7289-e6880cba-347d-48e8-beab-840ee469654d';
    const params = new URLSearchParams({
      orderid: orderId,
      status: status === 'paid' ? 'converted' : 'lead',
      amount: amount.toString(),
      cy: currency,
      ...utmParams,
      // Garantir que os subids estejam mapeados corretamente
      subid1: utmParams.utm_source || '',
      subid2: utmParams.utm_medium || '',
      subid3: utmParams.utm_term || '',
      // Adicionar parâmetros adicionais
      utm_id: utmParams.utm_id || '',
      utm_campaign: utmParams.utm_campaign || 'sitesnet',
      utm_content: utmParams.utm_content || '',
      network: utmParams.network || '',
      placement: utmParams.placement || '',
      device: utmParams.device || (navigator.userAgent.match(/mobile/i) ? 'mobile' : 'desktop')
    });
    
    const conversionUrl = `${baseUrl}?${params.toString()}`;
    
    // Enviar o evento de conversão
    const response = await fetch(conversionUrl, {
      method: 'GET',
      mode: 'no-cors', // Importante para evitar problemas de CORS
      cache: 'no-store'
    });
    
    console.log(`[Ratoeira ADS] Evento ${status} enviado para o pedido ${orderId}`);
    return true;
  } catch (error) {
    console.error('[Ratoeira ADS] Erro ao enviar conversão:', error);
    return false;
  }
}

// Função para carregar scripts de rastreamento
export function loadTrackingScripts() {
  if (typeof document === 'undefined') return;
  
  // Verificar se os scripts já foram carregados
  if (document.querySelector('#ratoeira-tracking')) return;
  
  // Script principal do Ratoeira ADS
  const script1 = document.createElement('script');
  script1.id = 'ratoeira-tracking';
  script1.src = 'https://cdn.fortittutitrackin.site/code/7289/7289-01530a2b-3c0c-4a69-bd7e-c97d74d11b4b.min.js';
  script1.defer = true;
  script1.async = true;
  
  // Script base
  const script2 = document.createElement('script');
  script2.src = 'https://cdn.fortittutitrackin.site/code/base.min.js';
  script2.defer = true;
  script2.async = true;
  
  // Adicionar ao head
  document.head.appendChild(script1);
  document.head.appendChild(script2);
  
  console.log('[Ratoeira ADS] Scripts de rastreamento carregados');
}
