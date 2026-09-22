# Auditoria de funcionalidades e entrega — 22/09/2026

> **Atualização posterior:** versão 2.3.1 r2 publicada, DEBUG corrigido e eventos ajustados. Consulte [execução e bloqueios atuais](EXECUCAO-2026-09-22.md) e [quadro atualizado](QUADRO-ENTREGA-GCA.xlsm). O texto abaixo registra o diagnóstico inicial, anterior às correções e ao deploy.

**Parecer: entrega integral ainda não aprovada.** O domínio principal e a API respondem, mas os dois subdomínios de clientes apresentam certificado incompatível e a API expõe páginas de depuração. Há funcionalidades locais ainda não publicadas e integrações sem validação real.

Esta revisão preservou as alterações anteriores da branch `dev`. Não houve deploy, modificação de contas ou escrita em dados de produção. Testes de escrita usaram bancos de teste/temporários. O histórico de 10/09 é referência, não comprovação do estado atual.

## Como interpretar os resultados

- **Testado localmente:** passou nos cenários automatizados indicados; não significa cobertura de todas as combinações nem publicação em produção.
- **Parcial:** código e/ou parte do fluxo verificados, com lacunas explícitas.
- **Bloqueado em produção:** falha observada diretamente na hospedagem.
- **Pendente:** falta validação externa, configuração, conteúdo ou conclusão da implementação.

## Inventário funcional

| Área | Funcionalidade | Resultado e limite da verificação |
| --- | --- | --- |
| Portal | Catálogo de empresas publicadas | Testado localmente; API pública respondeu 200 com 7 empresas. |
| Portal | Busca por nome, descrição, bairro e tags; filtros de categoria/bairro | Busca e filtros cobertos parcialmente por navegador; nem todas as combinações têm cenário próprio. |
| Portal | Categorias, ícones e destaques | Listagem/ocultação testadas; produção retornou 8 categorias. |
| Portal | Detalhes de empresa no modal | Testado no navegador: descrição, serviços, especialidades, endereço, horários e contatos. |
| Portal | Página dedicada e prévia por `?subdomain=` | Renderização local testada; HTTPS das duas páginas de produção bloqueado. |
| Portal | Telefone e WhatsApp separados | Testado com API real, inclusive compatibilidade com contato legado. |
| Portal | Links de site, Instagram, e-mail e mapa | Presença/omissão e renderização verificadas; recebimento de mensagens e exatidão dos cadastros não aferidos. |
| Portal | Capa e galeria por URLs, cache e acesso restrito à empresa publicada | Testado na API e no fluxo de cadastro/aprovação com navegador real. |
| Portal | Cadastro público de estabelecimento, capa e contatos | Testado com API real; exige aprovação antes da publicação. |
| Portal | Envio de avaliação, erro, reenvio e moderação | Testado em navegador e API; avaliação pendente não aparece publicamente. |
| Portal | Cupons ativos, validade e cópia de código | Testado localmente, inclusive recusa da área de transferência; produção está sem cupons. |
| Portal | Eventos: título, descrição, local, data e imagem | CRUD da API testado; leitura de código da apresentação; produção está sem eventos. |
| Portal | Botão de interesse e contador de eventos | **Incompleto:** contadores fictícios (124/342/88 e padrões 15/20), estado apenas na memória do navegador, sem persistência/API. Não apresentar como participação real. |
| Portal | Telefones úteis: lista, busca e ligação | CRUD da API e leitura da interface; produção está sem telefones cadastrados. Busca não tem cobertura específica completa. |
| Portal | Copiar telefone útil | Corrigido: sucesso só depois da cópia; falha mostra número para cópia manual. Teste de navegador dedicado. |
| Portal | Carregamento, indisponibilidade e nova tentativa por seção | Testado: falha não reintroduz dados demonstrativos nem apaga seções disponíveis. |
| Portal | Menu e apresentação responsiva | Cenários de navegador em desktop e celular; não equivale a teste em todos os dispositivos. |
| Portal | Rodapé e contato comercial | Código revisado; telefone comercial fixo precisa ser confirmado pelo responsável. Sem envio de mensagem nesta auditoria. |
| Anunciante | Login, sessão, saída e retorno após expiração | Testado com API real e simulação; correção local na fronteira de carregamento das telas. |
| Anunciante | Seis páginas: visão geral, cadastro, estabelecimentos, anúncios, cupons e financeiro | Navegação, URL direta, recarregamento, histórico e retorno após login cobertos no navegador. |
| Anunciante | Editar responsável e dados cadastrais | Salvamento e persistência testados com API real. |
| Anunciante | Editar dados do estabelecimento | Testado com API real; isolamento entre empresas testado na API. |
| Anunciante | Enviar/trocar capa, adicionar/remover fotos e aplicar limites | API valida conteúdo e titularidade; componente local revisado e ajustado para 320 px. Upload completo por esse novo componente ainda requer cenário dedicado. |
| Anunciante | Editar anúncio e encaminhar para análise | API e navegador testados; edição não deve publicar automaticamente. |
| Anunciante | Criar, editar e desativar cupom; datas e vínculo | API e navegador testados; benefícios do plano verificados na API. |
| Anunciante | Consultar cobranças, vencimentos, composição de valores e pagamento registrado | Navegador testado; não realiza pagamento bancário. |
| Anunciante | Proteção de rascunhos, cancelamento, erros e salvamento em andamento | Testado no navegador, incluindo navegação e atualização. |
| Anunciante | Recuperar senha por e-mail e redefinir com token | Cinco testes novos da API e dois de interface. Envio externo pendente: SMTP não encontrado na configuração lida. |
| Anunciante | Visitas e cliques dos últimos 30 dias | API testada para eventos válidos e isolamento; painel local implementado. Sem validação de volume/tráfego real. |
| Administração | Login e controle de equipe/superadministrador | API e navegador testados; usuário anunciante recebe 403 ao consultar administração. |
| Administração | Estabelecimentos: criar, editar, publicar, suspender, desativar e remover conforme vínculos | API e navegador cobrem operações representativas e restrições. |
| Administração | Anunciantes e vínculo com estabelecimentos/conta | API testada. Inspeção remota encontrou perfis de mesmo nome sem empresas; não foram consolidados. |
| Administração | Categorias e tags | API e navegador: criação/edição de categoria, ocultação e preservação de vínculos de tags. |
| Administração | Avaliações: aprovar e retirar publicação | API e navegador testados. |
| Administração | Anúncios: conteúdo, mídia, principal, status, período e destaque | API e navegador cobrem edição/publicação; regras novas de datas e pausa testadas localmente. |
| Administração | Cupons, eventos e telefones úteis: cadastro, edição e exclusão | CRUD e validações representativas testados na API; telas dos módulos carregam em teste de navegador. |
| Administração | Planos e benefícios: imagens, anúncios, cupons, destaque, marketing e página própria | Testes de assinatura/expiração e limites; todas as combinações de benefícios ainda não estão cobertas ponta a ponta. |
| Administração | Assinaturas: vínculos, valor acordado, período, situação e renovação | Recursos existentes testados na API; renovação automática é código local pendente de operação. |
| Administração | Cobranças: emissão manual, desconto/encargos, baixa, reabertura e cancelamento | API e navegador cobrem pagamento/reabertura e validações de valores/datas/vínculos. |
| Administração | Resumo financeiro: aberto, vencido, recebido e próximos vencimentos | Correção local testada para situação `overdue` explícita e exclusão de pagos/cancelados. |
| Administração | Usuários: criar, vincular anunciante, redefinir senha, desativar e proteger superadministrador | Testado na API; equipe comum não pode elevar permissões. |
| Administração | Notificações de cadastro e marcação como lidas | Geração testada na API; ações de leitura não tiveram novo teste de navegador dedicado. |
| Comercial | Publicação programada, pausa e expiração do anúncio principal | Testes locais verificam catálogo, detalhe, imagens, cupons e avaliações, preservando dados internos. Não publicado nesta revisão. |
| Comercial | Cobrança recorrente sem duplicação e preservação do dia-base | Testado localmente com cancelamento, fim e não renovação; agendamento no servidor não comprovado. |
| Comercial | Meta Pixel, Google Analytics e Google Ads | Inicialização/eventos encontrados no código local. Recebimento e atribuição nas plataformas externas não validados. |
| Comercial | Pagamento online PIX/boleto/cartão | Não integrado; permanece em espera conforme histórico. Cadastro de forma de pagamento e baixa manual não equivalem a gateway. |
| Operação | HTTPS do domínio principal e API | Acesso validado por HTTPS, sem desativar verificação de certificado. |
| Operação | HTTPS de `barbearia-alcantara` e `m-espetinhos` | **Bloqueado:** ambos retornam certificado incompatível com o hostname. Persistência/renovação wildcard pendentes. |
| Operação | Produção sem páginas técnicas de depuração | **Bloqueado:** rota inexistente expõe página técnica tanto no domínio público quanto no endereço direto da API. |
| Operação | Backup e integridade | 13 backups periódicos; último em 22/09 às 06:30 UTC; integridade relida como `ok`, metadado registra restauração aprovada. Cópia externa não comprovada. |
| Operação | Banco e migrações | SQLite em produção; PostgreSQL continua pendente conforme decisão anterior. Modelos locais sem migração faltante; migrações 0015/0016 do trabalho local não foram aplicadas remotamente nesta revisão. |
| Operação | Push e aplicativo Android | Registro push testado na API; VAPID presente e uma assinatura ativa na inspeção. Entrega em aparelho, build/distribuição do APK e experiência nativa não homologados. |
| Operação | CI, monitoramento e publicação | Scripts/workflows existem; testes executados localmente. Nenhum novo CI remoto, deploy ou alerta externo foi comprovado nesta rodada. |
| Operação | Desempenho, SEO e compartilhamento | Separação de bundles compilou; teste de carga, paginação sob volume, metadados por empresa e prévias sociais continuam pendentes. |

## Correções locais desta auditoria

1. Removida propriedade de fotos indevida da seção de cupons, que impedia a checagem TypeScript.
2. Fronteiras `Suspense` colocadas dentro de `App`, junto às telas carregadas sob demanda. Os três cenários de autenticação que falhavam passaram após a mudança.
3. Vite deixa de observar artefatos Android; TypeScript exclui builds nativos e resultados de testes. A primeira rodada caiu ao monitorar uma pasta gerada pelo Android no Windows.
4. Formulário de fotos ajustado para não exceder a largura de celulares de 320 px.
5. Cópia de telefone útil passa a tratar erro e só confirmar sucesso após a operação.
6. Adicionados testes de recuperação de senha e cópia de telefone, além de scripts de auditoria somente de leitura.

## Pendências para liberar

| Prioridade | Ação concreta | Critério de aceite |
| --- | --- | --- |
| Bloqueio | Restaurar e persistir certificado wildcard na configuração gerenciada da Cloudez | Principal e ambos os subdomínios abrem com validação TLS; configuração não é substituída; renovação definida. |
| Bloqueio | Desativar `DEBUG` na configuração efetiva e persistente da API | Rotas desconhecidas retornam 404 sem página técnica nos dois domínios, inclusive após reinício/reaplicação da hospedagem. |
| Antes de prometer o recurso | Corrigir/remover apresentação fictícia de interesse em eventos | Nenhum total inventado; regra de persistência definida e testada caso o recurso seja mantido. |
| Antes de disponibilizar recuperação autônoma | Configurar envio de e-mail | Mensagem recebida em conta de teste, link abre no domínio correto, redefine senha e não pode ser reutilizado. |
| Antes de incluir no contrato | Homologar marketing, push e Android | Evidência de recebimento nas plataformas/dispositivo e versão identificada. |
| Entrega do backlog | Revisar pacote, migrações e publicação das alterações locais | Backup, versão própria, instalação, verificação pós-deploy e reversão preparados. Esta auditoria não publicou o backlog. |
| Operação | Finalizar PostgreSQL, backup externo e responsáveis | Configuração/decisão registrada, recuperação comprovada e acessos sob responsabilidade definida. |

Pagamento integrado continua fora da entrega automática até retomada explícita do escopo. Produção com listas vazias de eventos, cupons e telefones requer conteúdo real antes de apresentar essas seções ao cliente.

## Evidências

- [Respostas públicas e falhas TLS](records/2026-09-22/public-audit.json).
- [Configuração remota resumida](records/2026-09-22/runtime-audit.json). O script não obteve o ambiente do processo uWSGI; por isso SMTP/variáveis representam os arquivos lidos. A exposição de DEBUG foi confirmada independentemente por HTTP.
- [Backup atual e integridade](records/2026-09-22/backup-audit.json).
- API: `core/tests.py`, `core/test_management.py`, `core/test_public_portal.py`, `core/test_execution.py`, `core/test_account_recovery.py` e `project/test_settings.py`.
- Navegador: `frontend/e2e/` usa API simulada; `frontend/integration/portal.spec.ts` usa Django real com banco temporário.

Os totais finais de execução estão no arquivo `records/2026-09-22/validation.json`. Resultado aprovado em um teste não substitui as pendências explicitadas neste inventário.
