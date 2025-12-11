'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { loadTrackingScripts } from '@/lib/tracking';

export default function HeadManager() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [headContent, setHeadContent] = useState({
    metaTags: '',
    trackingScripts: ''
  });

  // Desabilitar tracking no modo de desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    setMounted(true);
  }, [isDevelopment]);

  useEffect(() => {
    if (!mounted) return;

    // Carregar configurações do localStorage
    const loadHeadContent = () => {
      try {
        if (typeof window !== 'undefined') {
          const metaTags = localStorage.getItem('head_meta_tags') || '';
          const trackingScripts = localStorage.getItem('head_tracking_scripts') || '';
          
          setHeadContent({
            metaTags,
            trackingScripts
          });

          // Carregar scripts de rastreamento do Ratoeira ADS apenas se habilitado e não estiver em desenvolvimento
          const ratoeiraEnabled = process.env.NEXT_PUBLIC_RATOEIRA_ENABLED === 'true';
          if (ratoeiraEnabled && !isDevelopment) {
            loadTrackingScripts();
          }
        }
      } catch (error) {
        //console.error('Erro ao carregar configurações do cabeçalho:', error);
      }
    };

    loadHeadContent();
  }, [mounted, isDevelopment]);

  // Scripts do Ratoeira ADS (adicionados diretamente no head) - apenas se habilitado
  const ratoeiraEnabled = process.env.NEXT_PUBLIC_RATOEIRA_ENABLED === 'true' && !isDevelopment;
  const ratoeiraScripts = ratoeiraEnabled ? (
    <>
      <script 
        key="ratoeira-main"
        src="https://cdn.fortittutitrackin.site/code/7289/7289-01530a2b-3c0c-4a69-bd7e-c97d74d11b4b.min.js" 
        defer 
        async
      />
      <script 
        key="ratoeira-base"
        src="https://cdn.fortittutitrackin.site/code/base.min.js" 
        defer 
        async
      />
    </>
  ) : null;

  // Scripts UTMify - Injeção Direta no DOM (TODAS AS PÁGINAS)
  const utmifyPixelId = process.env.NEXT_PUBLIC_PIXELID_UTMFY;
  
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    // Desabilitar no desenvolvimento
    if (isDevelopment) {
      return;
    }
    
    // Verificar se Pixel ID está configurado
    if (!utmifyPixelId) {
      return;
    }

    // Verificar se já foi injetado (evitar duplicação)
    if (document.getElementById('utmify-pixel-init')) {
      return;
    }

    // 1. Injetar script de inicialização do Pixel Google
    const pixelInitScript = document.createElement('script');
    pixelInitScript.id = 'utmify-pixel-init';
    pixelInitScript.innerHTML = `
      window.googlePixelId = "${utmifyPixelId}";
      if (!document.getElementById("utmify-google-pixel")) {
        var a = document.createElement("script");
        a.id = "utmify-google-pixel";
        a.setAttribute("async", "");
        a.setAttribute("defer", "");
        a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-google.js");
        document.head.appendChild(a);
      }
    `;
    document.head.appendChild(pixelInitScript);

    // 2. Injetar script de UTMs (verificar se já existe)
    if (!document.getElementById('utmify-utms-script')) {
      const utmsScript = document.createElement('script');
      utmsScript.id = 'utmify-utms-script';
      utmsScript.src = 'https://cdn.utmify.com.br/scripts/utms/latest.js';
      utmsScript.setAttribute('data-utmify-prevent-xcod-sck', '');
      utmsScript.setAttribute('data-utmify-prevent-subids', '');
      utmsScript.async = true;
      utmsScript.defer = true;
      document.head.appendChild(utmsScript);
    }
  }, [mounted, utmifyPixelId, isDevelopment]); // Removido pathname para evitar recargas desnecessárias

  // Google Ads Conversion Tracking - Injeção Direta no DOM
  const googleAdsEnabled = process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === 'true';
  const googleAdsIds = process.env.NEXT_PUBLIC_GOOGLE_ADS_IDS || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const adsIndividual = process.env.NEXT_PUBLIC_ADS_INDIVIDUAL === 'true';
  
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !googleAdsEnabled || !googleAdsIds) return;

    // Desabilitar no desenvolvimento
    if (isDevelopment) {
      return;
    }

    // Carregar Google Tag APENAS na página inicial (/) e sucesso (/success)
    const allowedPages = ['/', '/success'];
    if (!allowedPages.includes(pathname)) {
      return;
    }

    // Remover scripts antigos se existirem
    const oldGtagScript = document.getElementById('google-gtag-script');
    const oldGtagInit = document.getElementById('google-gtag-init');
    const oldGtagFunctions = document.getElementById('google-gtag-functions');
    
    if (oldGtagScript) oldGtagScript.remove();
    if (oldGtagInit) oldGtagInit.remove();
    if (oldGtagFunctions) oldGtagFunctions.remove();

    // Separar múltiplas tags (suporta vírgula ou apenas uma tag)
    const adsIdArray = googleAdsIds.split(',').map(id => id.trim()).filter(id => id);
    const primaryAdsId = adsIdArray[0]; // Primeira tag para carregar o script

    // 1. Injetar script do Google Tag Manager (usando primeira tag)
    const gtagScript = document.createElement('script');
    gtagScript.id = 'google-gtag-script';
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${primaryAdsId}`;
    gtagScript.async = true;
    document.head.appendChild(gtagScript);

    // 2. Injetar inicialização do gtag com TODAS as tags
    const gtagInit = document.createElement('script');
    gtagInit.id = 'google-gtag-init';
    gtagInit.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      ${adsIdArray.map(id => `gtag('config', '${id}');`).join('\n      ')}
    `;
    document.head.appendChild(gtagInit);

    // 3. Se ADS_INDIVIDUAL=true, injetar funções gtag_report_conversion
    if (adsIndividual) {
      // Pegar labels de conversão do .env
      const conversionLabelCompra = process.env.NEXT_PUBLIC_GTAG_CONVERSION_COMPRA || 'S9KKCL7Qo6obEMa9u7JB';
      const conversionIdCompra = `${primaryAdsId}/${conversionLabelCompra}`;
      
      const gtagFunctions = document.createElement('script');
      gtagFunctions.id = 'google-gtag-functions';
      gtagFunctions.innerHTML = `
        // Função para conversão: Compra (Pagamento confirmado)
        window.gtag_report_conversion_purchase = function(transactionId, value) {
          gtag('event', 'conversion', {
            'send_to': '${conversionIdCompra}',
            'value': value || 1.0,
            'currency': 'BRL',
            'transaction_id': transactionId || ''
          });
          return false;
        };
      `;
      document.head.appendChild(gtagFunctions);
    }

    // Cleanup
    return () => {
      const gtag = document.getElementById('google-gtag-script');
      const init = document.getElementById('google-gtag-init');
      const funcs = document.getElementById('google-gtag-functions');
      
      if (gtag) gtag.remove();
      if (init) init.remove();
      if (funcs) funcs.remove();
    };
  }, [mounted, pathname, googleAdsEnabled, googleAdsIds, adsIndividual, isDevelopment]);

  // Injetar Meta Tags SEO no DOM
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // Remover meta tags antigas se existirem
    const oldMetas = document.querySelectorAll('meta[data-seo="true"]');
    oldMetas.forEach(meta => meta.remove());

    // Meta tags genéricas (anti-scraping)
    const metaTags = [
      { 
        name: 'description', 
        content: 'Plataforma de eventos e promoções digitais. Participe de campanhas exclusivas e ganhe benefícios.' 
      },
      { 
        name: 'keywords', 
        content: 'eventos, promoções, campanhas, benefícios, plataforma digital' 
      }
    ];

    metaTags.forEach(({ name, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', name);
      meta.setAttribute('content', content);
      meta.setAttribute('data-seo', 'true');
      document.head.appendChild(meta);
    });

    // Cleanup
    return () => {
      const metas = document.querySelectorAll('meta[data-seo="true"]');
      metas.forEach(meta => meta.remove());
    };
  }, [mounted]);

  return (
    <Head>
      {/* Meta Tags Padrão */}
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      
      {/* Meta Tags Dinâmicas */}
      {headContent.metaTags && (
        <div dangerouslySetInnerHTML={{ __html: headContent.metaTags }} />
      )}
      
      {/* Scripts de Rastreamento do Ratoeira ADS */}
      {ratoeiraScripts}
      
      {/* Scripts UTMify - Injetados via useEffect diretamente no DOM */}
      
      {/* Outros Scripts de Rastreamento - Desabilitado no desenvolvimento */}
      {!isDevelopment && headContent.trackingScripts && (
        <div dangerouslySetInnerHTML={{ __html: headContent.trackingScripts }} />
      )}
    </Head>
  );
}
