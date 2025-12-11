import { getBaseUrl } from './get-base-url'

export const companyConfig = {
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || '58.819.548 FATIMA APARECIDA SANTOS DE OLIVEIRA',
  tradeName: process.env.NEXT_PUBLIC_COMPANY_TRADE_NAME || 'DeltaForce',
  cnpj: process.env.NEXT_PUBLIC_COMPANY_CNPJ || '58.819.548/0001-48',
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'afreenisiam876543@gmail.com',
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '(11) 8465-2222',
  phoneRaw: process.env.NEXT_PUBLIC_COMPANY_PHONE_RAW || '11984652222',
  website: process.env.NEXT_PUBLIC_COMPANY_WEBSITE || getBaseUrl(),
  address: {
    street: process.env.NEXT_PUBLIC_COMPANY_ADDRESS_STREET || 'R Xisto, 153 - Casa 1',
    neighborhood: process.env.NEXT_PUBLIC_COMPANY_ADDRESS_NEIGHBORHOOD || 'Parque Primavera',
    city: process.env.NEXT_PUBLIC_COMPANY_ADDRESS_CITY || 'Guarulhos',
    state: process.env.NEXT_PUBLIC_COMPANY_ADDRESS_STATE || 'SP',
    zipCode: process.env.NEXT_PUBLIC_COMPANY_ADDRESS_ZIP || '07.145-090'
  }
}
