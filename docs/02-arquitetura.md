# Arquitetura

## Camadas
- **UI** (pages/components) → **hooks** → **services** → Firebase SDK
- **Cloud Functions** para operações privilegiadas: criar/desativar usuário no Auth, definir custom claims, lembretes, push.

## Rotas
Públicas: `/`, `/agendar/confirmacao`
Privadas (`/admin`): `/admin` (dashboard), `/admin/agenda`, `/admin/pacientes`, `/admin/atendimento/:id`, `/admin/receitas`, `/admin/financeiro/receber`, `/admin/financeiro/pagar`, `/admin/relatorios`, `/admin/usuarios`, `/admin/papeis`, `/admin/empresa`

## Autenticação e autorização
- Firebase Auth e-mail/senha.
- Cada usuário tem `papelId`; custom claims guardam `papelId` e `permissoes` resumidas.
- Guard de rota `<RequirePermission perm="pacientes.ler">`.

## Fluxo de criação de usuário
Admin preenche formulário → chama Cloud Function `criarUsuario` → cria no Auth + documento em `usuarios` + claims → envia e-mail de definição de senha.

## Ambientes
`dev` e `prod` (dois projetos Firebase). Variáveis em `.env`.
