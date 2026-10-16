Crie a landing page pública do consultório, focada em **um consultório individual** de optometria (sem linguagem de plataforma, sem planos, sem "para optometristas"). Seções: hero com botão "Agendar exame", serviços, sobre o optometrista (foto, nome, registro profissional), depoimentos, horários de atendimento, localização e contato, WhatsApp flutuante e rodapé (nome fantasia, CNPJ, endereço, link da política de privacidade).

Regras:
- Todos os textos, imagens, serviços, horários e contatos vêm dos dados do consultório (spec em docs/03-modelo-dados.md, apenas como regras de negócio). Se não houver conteúdo, use o seed inicial; **nada de texto fixo no código**.
- Exponha à página pública apenas os **campos de divulgação** (endpoint/consulta própria); campos privados, como dados internos e financeiros, nunca saem do servidor.
- Seção sem conteúdo ou marcada como oculta não é renderizada.
- Design limpo, azul e branco, responsivo e mobile-first; imagens otimizadas com `alt`.
- SEO básico: título e descrição vindos dos dados, Open Graph e JSON-LD `LocalBusiness` com nome, endereço, telefone e horários.
- O botão de WhatsApp usa o número e a mensagem inicial configurados.
A edição desse conteúdo pelo painel vem nos prompts 06 e 06b; aqui só a leitura.
