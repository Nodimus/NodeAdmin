# PWA e Mobile

## Regra de ouro
A versão desktop (≥ 1024px) **não pode ser alterada**. Mobile e PWA são camadas adicionais.

## Mobile (< 1024px)
- Landing: menu hambúrguer, hero em coluna, botão "Agendar exame" fixo no rodapé.
- Admin: sidebar vira barra inferior (Agenda, Pacientes, Atendimento, Financeiro, Mais).
- Tabelas viram cards; calendário vira visão de dia.
- Alvos de toque ≥ 44px, safe area do iPhone, inputs com tipo correto.

## PWA
- `manifest.webmanifest`: nome "Vinnes Admin", ícones 192/512 e maskable, display standalone, start_url `/admin`.
- Service worker (vite-plugin-pwa): app shell em cache, network-first para dados.
- Página offline, banner "Instalar app" só no mobile, aviso de nova versão.
- Firestore com persistência offline (IndexedDB) e indicador online/offline.
- Push via FCM após login no admin; no iPhone exige app instalado na tela inicial.

## Testes
360px, 390px, 768px; Lighthouse PWA; comparação visual do desktop antes/depois em 1280px.
