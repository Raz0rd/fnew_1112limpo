export default function ComplianceFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm">
          <p className="mb-2">
            © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_TRADE_NAME || 'DeltaForce'}. Todos os direitos reservados.
          </p>
          <p className="text-xs text-slate-500">
            Plataforma independente de créditos digitais. Não somos afiliados às desenvolvedoras de jogos.
          </p>
        </div>
      </div>
    </footer>
  )
}
