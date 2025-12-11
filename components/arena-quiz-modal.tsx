"use client"

import React from 'react'

interface QuizQuestion {
  question: string
  options: {
    text: string
    points: Record<string, number>
  }[]
}

interface QuizProfile {
  title: string
  description: string
  emoji: string
}

interface ArenaQuizModalProps {
  quizStep: 'intro' | 'quiz' | 'result' | 'reward' | 'validation'
  currentQuestion: number
  timeLeft: number
  quizQuestions: QuizQuestion[]
  quizProfiles: Record<string, QuizProfile>
  quizResult: string
  playerId: string
  isLoading: boolean
  loginError: string
  onStartQuiz: () => void
  onQuizAnswer: (index: number) => void
  onAcceptReward: () => void
  onSkipQuiz: () => void
  onLogin: (e: React.FormEvent) => void
  onPlayerIdChange: (value: string) => void
  setShowSocialError: (show: boolean) => void
}

export default function ArenaQuizModal({
  quizStep,
  currentQuestion,
  timeLeft,
  quizQuestions,
  quizProfiles,
  quizResult,
  playerId,
  isLoading,
  loginError,
  onStartQuiz,
  onQuizAnswer,
  onAcceptReward,
  onSkipQuiz,
  onLogin,
  onPlayerIdChange,
  setShowSocialError
}: ArenaQuizModalProps) {
  
  return (
    <div 
      className="fixed inset-0 z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Fundo com gradiente Arena de Fogo */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a0000 25%, #330000 50%, #1a0000 75%, #000000 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* Efeito de fogo animado */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 50% 100%, #b3a29dff 0%, transparent 50%)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
      </div>
      
      {/* Modal Container */}
      <div className="absolute inset-0 grid overflow-auto justify-items-center items-center p-4">
        <div className="w-full max-w-[450px] mx-auto">
          
          {/* TELA DE INTRODUÇÃO */}
          {quizStep === 'intro' && (
            <div className="bg-gradient-to-br from-black via-red-950 to-black rounded-2xl shadow-2xl border-2 border-red-600 overflow-hidden">
              {/* Header */}
              <div className="relative h-32 bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20" />
                <h1 className="relative text-3xl font-black text-white text-center drop-shadow-lg" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                 ARENA DE FOGO 
                </h1>
                <button 
                  onClick={onSkipQuiz}
                  className="absolute top-4 right-4 rounded-full text-white bg-black/40 p-2 hover:bg-black/60 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.83644 6.56341C7.48497 6.21194 6.91512 6.21194 6.56365 6.56341C6.21218 6.91488 6.21218 7.48473 6.56365 7.8362L10.7273 11.9998L6.56366 16.1634C6.21218 16.5149 6.21218 17.0847 6.56366 17.4362C6.91513 17.7877 7.48498 17.7877 7.83645 17.4362L12 13.2726L16.1637 17.4362C16.5151 17.7877 17.085 17.7877 17.4364 17.4362C17.7879 17.0847 17.7879 16.5149 17.4364 16.1634L13.2728 11.9998L17.4364 7.8362C17.7879 7.48473 17.7879 6.91488 17.4364 6.56341C17.085 6.21194 16.5151 6.21194 16.1637 6.56341L12 10.727L7.83644 6.56341Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  DESCUBRA SEU PERFIL DE JOGADOR!
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Responda 5 perguntas rápidas e descubra qual é o seu verdadeiro estilo de jogo.
                </p>
                
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6">
                  <p className="text-yellow-400 font-bold text-lg mb-2">
                    🎁 BENEFÍCIO EXCLUSIVO
                  </p>
                  <p className="text-white text-sm">
                    Ao completar o quiz, você recebe <span className="font-black text-yellow-400">70% DE DESCONTO</span> na sua recarga!
                  </p>
                </div>

                <button
                  onClick={onStartQuiz}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-black text-lg py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-600/50 border-2 border-white/20"
                  style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
                >
                  COMEÇAR AGORA 
                </button>

                <button
                  onClick={onSkipQuiz}
                  className="w-full mt-3 text-gray-400 hover:text-white text-sm py-2 transition-colors"
                >
                  Pular e continuar sem desconto
                </button>
              </div>
            </div>
          )}

          {/* TELA DO QUIZ */}
          {quizStep === 'quiz' && (
            <div className="bg-gradient-to-br from-black via-red-950 to-black rounded-2xl shadow-2xl border-2 border-red-600 overflow-hidden">
              {/* Progress Bar */}
              <div className="h-2 bg-black">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-orange-600 transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>

              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 flex justify-between items-center">
                <div className="text-white font-bold">
                  Pergunta {currentQuestion + 1}/{quizQuestions.length}
                </div>
                <div className="bg-black/40 px-4 py-2 rounded-full text-white font-bold flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                  </svg>
                  {timeLeft}s
                </div>
              </div>

              {/* Pergunta */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  {quizQuestions[currentQuestion].question}
                </h3>

                {/* Opções */}
                <div className="space-y-3">
                  {quizQuestions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => onQuizAnswer(index)}
                      className="w-full bg-gradient-to-r from-red-900/50 to-orange-900/50 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 border-2 border-red-600/30 hover:border-white/50 text-left hover:scale-105"
                    >
                      <span className="text-yellow-400 font-black mr-3">{String.fromCharCode(65 + index)}.</span>
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TELA DE RESULTADO */}
          {quizStep === 'result' && (
            <div className="bg-gradient-to-br from-black via-red-950 to-black rounded-2xl shadow-2xl border-2 border-red-600 overflow-hidden">
              {/* Header com animação */}
              <div className="relative h-40 bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                {/* Efeito de faíscas */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle, #FFD700 1px, transparent 1px)',
                  backgroundSize: '50px 50px',
                  animation: 'sparkle 2s linear infinite'
                }} />
                <div className="relative text-center">
                  <div className="text-7xl mb-2">{quizProfiles[quizResult as keyof typeof quizProfiles].emoji}</div>
                  <h2 className="text-3xl font-black text-white drop-shadow-lg" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                    SEU PERFIL
                  </h2>
                </div>
              </div>

              {/* Resultado */}
              <div className="p-8 text-center">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
                  {quizProfiles[quizResult as keyof typeof quizProfiles].title}
                </h3>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                  {quizProfiles[quizResult as keyof typeof quizProfiles].description}
                </p>

                {/* Benefício */}
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 mb-6 border-2 border-yellow-400 animate-pulse">
                  <div className="text-4xl mb-2">🎁</div>
                  <h4 className="text-2xl font-black text-white mb-2">
                    PARABÉNS!
                  </h4>
                  <p className="text-white font-bold text-lg mb-3">
                    Você desbloqueou
                  </p>
                  <div className="text-5xl font-black text-white mb-3" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                    70% OFF
                  </div>
                  <p className="text-white/90 text-sm">
                    Oferta exclusiva para a Arena de Fogo!
                  </p>
                  <p className="text-yellow-200 text-xs mt-2 font-bold">
                    ⏰ Válido por 24 horas
                  </p>
                </div>

                <button
                  onClick={onAcceptReward}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-black text-xl py-5 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-600/50 border-2 border-white/20 hover:scale-105"
                  style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
                >
                  ATIVAR MINHA OFERTA 🔥
                </button>

                <p className="text-gray-400 text-xs mt-4">
                  #FreeFire #ArenaDeFogoFF #DesafioDeFogo
                </p>
              </div>
            </div>
          )}

          {/* TELA DE VALIDAÇÃO */}
          {quizStep === 'validation' && (
            <div className="bg-gradient-to-br from-black via-red-950 to-black rounded-2xl shadow-2xl border-2 border-red-600 overflow-hidden">
              {/* Header */}
              <div className="relative h-24 bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20" />
                <h2 className="relative text-2xl font-black text-white" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                  🎯 VALIDAR IDENTIDADE
                </h2>
              </div>

              {/* Ícone do jogo */}
              <div className="relative px-6 pt-4">
                <img 
                  className="h-16 w-16 rounded-xl bg-white outline outline-4 outline-red-600 mx-auto" 
                  src="/images/icon.png" 
                  alt="Jogo"
                />
                <div className="text-center mt-3">
                  <div className="text-lg font-bold text-white">Créditos Digitais</div>
                  <div className="text-sm text-gray-400">Valide seu ID para ativar a oferta</div>
                </div>
              </div>

              {/* Formulário */}
              <div className="p-6">
                <form onSubmit={onLogin}>
                  <label className="mb-2 flex items-center gap-1 text-sm font-bold text-white">
                    ID do Jogador
                  </label>
                  <div className="flex mb-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full bg-black/50 border-2 border-red-600/50 px-4 py-3 rounded-l-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                      placeholder="Insira seu ID aqui"
                      value={playerId}
                      onChange={(e) => onPlayerIdChange(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="shrink-0 rounded-r-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 px-6 py-3 font-black text-white transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Validando...' : 'VALIDAR'}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-xs text-red-400 bg-red-900/30 border border-red-600/50 rounded p-2">{loginError}</p>
                  )}
                </form>

                {/* Divisor */}
                <div className="my-4 flex items-center gap-2 text-center text-xs text-gray-500 before:h-px before:grow before:bg-gray-700 after:h-px after:grow after:bg-gray-700">
                  Ou entre com sua conta
                </div>

                {/* Botões de login social */}
                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => setShowSocialError(true)}
                    className="shrink-0 rounded-full p-3 transition-all hover:scale-110 bg-[#006AFC]"
                  >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => setShowSocialError(true)}
                    className="shrink-0 rounded-full p-3 transition-all hover:scale-110 bg-white"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => setShowSocialError(true)}
                    className="shrink-0 rounded-full p-3 transition-all hover:scale-110 bg-black border border-gray-700"
                  >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-6">
                  Ao continuar, você concorda com nossos Termos de Uso
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        @keyframes sparkle {
          0% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
