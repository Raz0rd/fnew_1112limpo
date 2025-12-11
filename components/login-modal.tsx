'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, Shield, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onSuccess }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'login' | 'terms'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    console.log('[LoginModal] 🚀 Modal montado! isOpen:', isOpen);
  }, [isOpen]);

  console.log('[LoginModal] Render - isOpen:', isOpen, 'mounted:', mounted);

  if (!mounted) return null;

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = 'Nome completo é obrigatório (mínimo 3 caracteres)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Email válido é obrigatório';
    }

    const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Telefone válido é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validateLogin()) return;

    setLoading(true);
    
    // Simular validação
    setTimeout(() => {
      // Salvar dados do usuário
      localStorage.setItem('user_data', JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        loginAt: new Date().toISOString()
      }));
      
      setLoading(false);
      setStep('terms');
    }, 800);
  };

  const handleAcceptTerms = () => {
    if (!termsAccepted) {
      alert('Você precisa aceitar os termos para continuar');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      // Marcar como logado
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('terms_accepted', 'true');
      localStorage.setItem('terms_accepted_at', new Date().toISOString());
      
      setLoading(false);
      onSuccess();
    }, 500);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  console.log('[LoginModal] 🎨 Renderizando modal via Portal!');

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center" 
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex'
      }}
    >
      {/* Backdrop com blur */}
      <div 
        className="absolute inset-0" 
        style={{ 
          zIndex: 99998,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }} 
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4" 
        style={{ 
          zIndex: 99999,
          position: 'relative',
          margin: '0 1rem'
        }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">
                  {step === 'login' ? 'Acesso Seguro' : 'Termos de Uso'}
                </h2>
                <p className="text-sm text-purple-100">
                  {step === 'login' ? 'Faça login para continuar' : 'Leia e aceite para prosseguir'}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {step === 'login' ? (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-6">
                  Para acessar nossas ofertas exclusivas, precisamos validar suas informações.
                </p>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setErrors({ ...errors, name: '' });
                    }}
                    placeholder="Seu nome completo"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setErrors({ ...errors, email: '' });
                    }}
                    placeholder="seu@email.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData({ ...formData, phone: formatted });
                      setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Info de segurança */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-900">
                      <p className="font-semibold mb-1">Seus dados estão seguros</p>
                      <p className="text-xs text-purple-700">
                        Utilizamos criptografia para proteger suas informações pessoais.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botão */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Continuar
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Termos */}
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-3">
                  <h3 className="font-bold text-gray-900">Termos de Uso e Políticas</h3>
                  
                  <p><strong>1. Aceitação dos Termos</strong></p>
                  <p>Ao utilizar nosso serviço, você concorda com estes termos de uso.</p>
                  
                  <p><strong>2. Descrição do Serviço</strong></p>
                  <p>Oferecemos serviço de recarga de diamantes para Free Fire de forma rápida e segura.</p>
                  
                  <p><strong>3. Política de Pagamento</strong></p>
                  <p>Os pagamentos são processados via PIX. Após confirmação, a recarga é enviada automaticamente.</p>
                  
                  <p><strong>4. Prazo de Entrega</strong></p>
                  <p>As recargas são entregues em até 5 minutos após confirmação do pagamento.</p>
                  
                  <p><strong>5. Política de Reembolso</strong></p>
                  <p>Reembolsos são permitidos apenas em casos de erro no processamento. Entre em contato com o suporte.</p>
                  
                  <p><strong>6. Dados Pessoais</strong></p>
                  <p>Seus dados são protegidos conforme a LGPD. Não compartilhamos informações com terceiros sem autorização.</p>
                  
                  <p><strong>7. Responsabilidades</strong></p>
                  <p>Você é responsável por fornecer informações corretas de ID e servidor do Free Fire.</p>
                  
                  <p><strong>8. Suporte</strong></p>
                  <p>Em caso de dúvidas, entre em contato através dos nossos canais de suporte.</p>
                </div>

                {/* Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-700">
                    Eu li e aceito os <strong>Termos de Uso</strong> e estou ciente da{' '}
                    <strong>Política de Privacidade</strong>
                  </span>
                </label>

                {/* Botão */}
                <button
                  onClick={handleAcceptTerms}
                  disabled={loading || !termsAccepted}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      🎁 Pegar Minha Oferta
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
