# Segurança e Permissões

## Papéis padrão
| Permissão | Admin | Optometrista | Recepção | Financeiro |
|---|---|---|---|---|
| usuarios.* / papeis.* | ✔ | – | – | – |
| empresa.editar | ✔ | – | – | – |
| agenda.* | ✔ | ✔ | ✔ | ler |
| pacientes.ler/editar | ✔ | ✔ | ✔ | ler |
| atendimento.* | ✔ | ✔ | – | – |
| receitas.* | ✔ | ✔ | – | – |
| financeiro.* | ✔ | – | – | ✔ |
| relatorios.ler | todos | clínicos | agenda | financeiros |
| auditoria.ler | ✔ | – | – | – |

Formato das chaves: `modulo.acao` (ler, criar, editar, excluir, imprimir).

## Regras do Firestore (esqueleto)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function logado() { return request.auth != null; }
    function perm(p) { return logado() && request.auth.token.permissoes != null && request.auth.token.permissoes[p] == true; }

    match /agendamentos/{id} {
      allow create: if true; // validar campos e status == 'pendente' na regra final
      allow read, update, delete: if perm('agenda.ler');
    }
    match /pacientes/{id} { allow read: if perm('pacientes.ler'); allow write: if perm('pacientes.editar'); }
    match /receitas/{id} { allow read, write: if perm('receitas.ler'); }
    match /contasPagar/{id} { allow read, write: if perm('financeiro.ler'); }
    match /contasReceber/{id} { allow read, write: if perm('financeiro.ler'); }
    match /usuarios/{id} { allow read: if logado(); allow write: if false; } // escrita só via Cloud Function
    match /papeis/{id} { allow read: if logado(); allow write: if perm('papeis.editar'); }
    match /empresa/{id} { allow read: if true; allow write: if perm('empresa.editar'); }
    match /auditoria/{id} { allow read: if perm('auditoria.ler'); allow write: if false; }
  }
}
```
Ajuste fino: separar campos públicos da empresa (nome, endereço, serviços) dos privados.

## Boas práticas
- Nunca excluir usuário: desativar.
- Impedir que o último admin seja desativado ou rebaixado.
- Auditar emissão, cancelamento e reimpressão de receitas.
