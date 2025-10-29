# Regras de Bons Costumes no Desenvolvimento

Este documento define os princípios fundamentais que devem ser seguidos durante todo o processo de desenvolvimento do projeto.  
Essas regras existem para garantir organização, qualidade, clareza e colaboração entre os membros da equipe.  
Nenhuma delas deve ser ignorada ou violada.

---

## 1. Não realizar push direto na branch main
A branch `main` representa o código estável e pronto para produção.  
Nenhuma modificação deve ser enviada diretamente para ela.  
Qualquer atualização da `main` deve ocorrer apenas por meio de merge da branch `dev`, após revisão e testes completos.

---

## 2. Utilizar branches específicas para cada funcionalidade
Cada nova funcionalidade, correção ou ajuste deve ser desenvolvida em uma branch própria, criada a partir da `dev`.  
Isso evita conflitos e facilita a rastreabilidade do código.

Padrão sugerido para nomenclatura:
```
feature/nome-da-funcionalidade
bugfix/descricao-do-bug
hotfix/descricao-do-hotfix
```

---

## 3. Utilizar a branch dev como ambiente de integração
A branch `dev` é o local onde todas as funcionalidades são integradas e testadas antes de chegarem à `main`.  
Nenhum código deve ser enviado diretamente para a `main`.  
Somente quando a `dev` estiver estável e validada é que pode ocorrer o merge para a `main`.

---

## 4. Desenvolvimento em dupla
As tarefas devem ser realizadas em duplas, com papéis definidos:
- Um membro é responsável pela implementação.
- O outro é responsável pela revisão e aceite do código.

Nenhum código deve ser integrado sem revisão de outro membro da dupla.

---

## 5. Uso obrigatório de Pull Requests
Toda integração deve ser feita por meio de Pull Requests (PRs).  
O PR deve conter uma descrição clara do que foi feito, incluir testes e evidências (como prints, quando necessário) e ser aprovado por outro membro antes de ser integrado.  
Não é permitido realizar merge sem revisão.

---

## 6. Mensagens de commit descritivas
As mensagens de commit devem ser claras e objetivas.  
Evite termos genéricos como "update" ou "fix".  
Utilize um padrão descritivo que explique a intenção da alteração.

Exemplos:
```
feat: adiciona cálculo de dados no dashboard
fix: corrige bug de exibição de dados de estoque
refactor: reorganiza componentes de interface
```

---

## 7. Limpeza do código antes de abrir Pull Request
Antes de abrir um Pull Request, o código deve ser revisado internamente pelo autor.  
Devem ser removidos:
- Comentários desnecessários.
- Códigos de teste, prints ou logs temporários.
- Trechos não utilizados ou duplicados.

O objetivo é manter o repositório limpo, legível e profissional.

---

## 8. Testes antes da integração
Todo código deve ser testado localmente antes de ser integrado à `dev`.  
A dupla responsável deve garantir que:
- O sistema funciona corretamente.
- Nenhuma funcionalidade anterior foi comprometida.
- O comportamento da aplicação permanece consistente.

---

## 9. A branch main representa o ambiente de produção
A `main` deve sempre refletir o estado atual do sistema em produção.  
Somente versões validadas e testadas podem ser mergeadas nela.  
Cada merge da `dev` para a `main` deve gerar uma nova tag de versão, conforme o padrão de versionamento semântico:
```
v1.0.0, v1.1.0, v1.2.0, ...
```

---

## 10. Responsabilidade compartilhada
Cada integrante da equipe é responsável por:
- Cumprir todas as regras aqui descritas.
- Garantir a qualidade do próprio código.
- Realizar revisões com atenção e seriedade.
- Manter comunicação clara com os demais membros.

A qualidade do projeto depende da disciplina de todos.

---

## 11. Consequências de violação
A violação deliberada dessas regras compromete a integridade do projeto e o fluxo de trabalho da equipe.  
Qualquer quebra de processo deve ser registrada e discutida em reunião, para que as causas sejam compreendidas e corrigidas.

---

## 12. Atualizações deste documento
Este documento deve ser revisado sempre que novas práticas forem acordadas pela equipe.  
Todas as alterações devem ser registradas e aprovadas coletivamente.

---

Documento criado para orientar o desenvolvimento colaborativo e garantir um processo de trabalho estável, seguro e profissional.
