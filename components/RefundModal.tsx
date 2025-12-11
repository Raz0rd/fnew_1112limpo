'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string
}

const BANCOS = [
  'Banco do Brasil',
  'Bradesco',
  'Caixa Econômica Federal',
  'Itaú',
  'Santander',
  'Nubank',
  'Inter',
  'C6 Bank',
  'PagBank',
  'Mercado Pago',
  'Picpay',
  'Neon',
  'Next',
  'Banco Original',
  'Safra',
  'Sicoob',
  'Sicredi',
  'Banrisul',
  'BTG Pactual',
  'Outro'
]

const TIPOS_CONTA = [
  'Conta Corrente',
  'Conta Poupança',
  'Conta Salário',
  'Conta Digital'
]

export default function RefundModal({ isOpen, onClose, transactionId }: RefundModalProps) {
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    telefone: '',
    email: '',
    idJogador: '',
    banco: '',
    agencia: '',
    digitoAgencia: '',
    conta: '',
    digitoConta: '',
    tipoConta: '',
    chavePix: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setFormData(prev => ({ ...prev, cpf: formatted }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, telefone: formatted }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Enviar para API de reembolso
      const response = await fetch('/api/refund-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          transactionId
        })
      })

      if (response.ok) {
        setSubmitSuccess(true)
        setTimeout(() => {
          onClose()
        }, 3000)
      } else {
        alert('Erro ao enviar solicitação. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao enviar reembolso:', error)
      alert('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Solicitação Enviada!
          </h3>
          <p className="text-gray-600">
            Sua solicitação de reembolso foi recebida e será processada em até 5-7 dias úteis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-2xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10 border-b-2 border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 text-center pr-8">
            SOLICITAÇÃO DE REEMBOLSO
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <p className="text-gray-600 text-center mb-6">
            Por favor, preencha os dados abaixo para processarmos o seu reembolso.
          </p>

          {/* CPF */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              required
              maxLength={14}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Seu nome completo"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Telefone e Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número para Contato
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="(00) 90000-0000"
                required
                maxLength={15}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email para Contato
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* ID Jogador */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ID do Jogador Free Fire
            </label>
            <input
              type="text"
              name="idJogador"
              value={formData.idJogador}
              onChange={handleChange}
              placeholder="Seu ID no Free Fire"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Banco */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Banco
            </label>
            <select
              name="banco"
              value={formData.banco}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors bg-white"
            >
              <option value="">Selecione um banco</option>
              {BANCOS.map(banco => (
                <option key={banco} value={banco}>{banco}</option>
              ))}
            </select>
          </div>

          {/* Agência */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agência
              </label>
              <input
                type="text"
                name="agencia"
                value={formData.agencia}
                onChange={handleChange}
                placeholder="0001"
                required
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dígito
              </label>
              <input
                type="text"
                name="digitoAgencia"
                value={formData.digitoAgencia}
                onChange={handleChange}
                placeholder="X"
                maxLength={1}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Conta e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Conta
              </label>
              <input
                type="text"
                name="conta"
                value={formData.conta}
                onChange={handleChange}
                placeholder="Número da conta"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dígito
              </label>
              <input
                type="text"
                name="digitoConta"
                value={formData.digitoConta}
                onChange={handleChange}
                placeholder="9"
                required
                maxLength={2}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Conta
              </label>
              <select
                name="tipoConta"
                value={formData.tipoConta}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors bg-white"
              >
                <option value="">Tipo de conta</option>
                {TIPOS_CONTA.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chave PIX */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chave PIX
            </label>
            <input
              type="text"
              name="chavePix"
              value={formData.chavePix}
              onChange={handleChange}
              placeholder="Sua chave PIX"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'ENVIANDO...' : 'SOLICITAR UM REEMBOLSO'}
          </button>
        </form>
      </div>
    </div>
  )
}
