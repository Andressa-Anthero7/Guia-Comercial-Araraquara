# Revisão da planilha de execução — 10/09/2026

A pedido do usuário, a planilha existente foi revisada e atualizada em seu próprio arquivo.

- Planilha: [Plano de Execucao - Guia Comercial Araraquara](https://docs.google.com/spreadsheets/d/1InSVtuHH8RaZj3IZ8l0mQwY1moeqS3xgnOzQTgAFKeo/edit).
- Aba: `Plano de Acao`; sheetId `598402828`.
- Dados: `A4:M37`; cabeçalho/filtro: `A3:M37`.
- Resultado: **34 itens — 10 concluídos, 4 em andamento, 3 em validação, 4 bloqueados e 13 não iniciados**.
- Atualizadas as 15 entregas existentes e acrescentados 19 itens (5 entregas concluídas e 14 pendências).
- Subdomínios e portal do anunciante passaram a concluídos. Acesso administrativo permanece em validação para confirmar responsável e guarda/entrega da credencial; não criar outra conta automaticamente.
- Mantidos em aberto banco/backups, validação de push, contas/recuperação de senha e deploy automático porque os critérios completos ainda não foram comprovados.
- Referências, observações datadas e próximas ações atualizadas por item; não foram inventados prazos nem responsáveis.
- A planilha de status de agosto foi preservada.

A revisão utilizou os registros de publicação 2.0.0–2.0.3, `docs/RETOMADA.md`, `docs/REVISAO-2026-09-10.md`, o estado do Git e leitura do código. Não houve nova auditoria remota nem execução de testes nesta tarefa; resultados de testes citados são os registrados nas entregas.

A gravação foi relida pela API de células: todos os valores, validações e formatos previstos conferidos. Filtro estendido e três linhas congeladas preservadas. Textos longos com quebra de linha e altura ajustada. Verificação visual limitada aos metadados nativos, sem navegador autenticado.

## Índice atualizado

| ID | Entrega | Status |
| --- | --- | --- |
| 01 | Publicar portal e backoffice | Concluido |
| 02 | Configurar banco, segredos e backups | Em andamento |
| 03 | Provisionar acesso administrativo | Em validacao |
| 04 | Ativar subdominios de empresas | Concluido |
| 05 | Validar fluxo completo em producao | Em validacao |
| 06 | Integrar recebimento de pagamentos | Bloqueado |
| 07 | Migrar imagens para object storage | Bloqueado |
| 08 | Substituir mapa simulado por mapa real | Concluido |
| 09 | Criar portal web do anunciante | Concluido |
| 10 | Completar contas e permissoes | Em andamento |
| 11 | Criar testes de interface e ponta a ponta | Concluido |
| 12 | Automatizar CI/CD e deploy | Em andamento |
| 13 | Adicionar monitoramento e alertas | Bloqueado |
| 14 | Trocar dados e imagens de demonstracao | Em andamento |
| 15 | Gerar e validar APK atualizado | Bloqueado |
| 16 | Separar telefone comercial e WhatsApp | Concluido |
| 17 | Persistir capa e publicar galeria | Concluido |
| 18 | Tratar falhas da API no portal público | Concluido |
| 19 | Reformular páginas públicas das empresas | Concluido |
| 20 | Corrigir sessão do anunciante pelo domínio público | Concluido |
| 21 | Aplicar datas e pausa dos anúncios | Nao iniciado |
| 22 | Executar integrações de marketing | Nao iniciado |
| 23 | Corrigir resumo financeiro de cobranças vencidas | Nao iniciado |
| 24 | Automatizar renovação de assinaturas e cobranças | Nao iniciado |
| 25 | Aplicar benefícios e limites dos planos | Nao iniciado |
| 26 | Enviar e trocar fotos no painel do anunciante | Nao iniciado |
| 27 | Exibir visitas e cliques ao anunciante | Nao iniciado |
| 28 | Automatizar renovação do certificado wildcard | Nao iniciado |
| 29 | Preparar busca e compartilhamento por empresa | Nao iniciado |
| 30 | Reduzir tamanho do JavaScript inicial | Nao iniciado |
| 31 | Paginar consultas administrativas na API | Nao iniciado |
| 32 | Registrar entregas 2.0.1–2.0.3 no Git | Nao iniciado |
| 33 | Investigar perfis repetidos de anunciante | Nao iniciado |
| 34 | Validar experiência do painel com o usuário | Em validacao |

As prioridades técnicas sugeridas na revisão são os itens 21 (datas/pausa de anúncios), 23 (resumo financeiro) e 32 (commit/push e CI). A revisão da planilha não executou essas pendências.

O certificado (item 28) tem vencimento **registrado**, sem nova consulta, em 08/12/2026 às 21:53:08 UTC; a renovação deve ser preparada com antecedência.

