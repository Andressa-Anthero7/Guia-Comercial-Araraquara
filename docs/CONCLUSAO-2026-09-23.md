# Fechamento técnico — 23/09/2026

**Versão 2.3.2 publicada na API e no frontend app33. Entrega integral ainda depende dos serviços e homologações abaixo.** Este registro substitui os estados anteriores da auditoria e da retomada.

## Concluído nesta retomada

- Corrigido novamente `DEBUG=True` que havia reaparecido no settings da hospedagem. Backup anterior preservado, configuração passou a respeitar `DJANGO_DEBUG=false` e API reiniciada. Rotas desconhecidas nas duas origens voltaram a 404 sem página técnica. A reaplicação da configuração gerenciada ainda pode desfazer a correção; persistência precisa ser tratada na Cloudez.
- Publicado módulo de e-mails transacionais e migração 0018. Configuração adicionada sem substituir settings da hospedagem. Captura e envio automático desativados; nenhum e-mail enviado. Remetente preparado: `nao-responda@guiacomararaquara.com.br`.
- Publicada tela “Empresa não encontrada”, com endereço consultado e retorno ao catálogo. O teste usa `?subdomain=`; nomes sem DNS/TLS não chegam ao frontend.
- Confirmados HTTPS do principal, API e dois clientes; sete empresas públicas continuam visíveis.
- Confirmada execução automática da rotina de faturas em 23/09 às 09:15 UTC (06:15 em São Paulo): zero contratos processados e zero faturas criadas. A rotina não cobra pagamentos externos.
- Backup periódico de 23/09 às 06:30 UTC íntegro, com restauração de teste registrada. Backup anterior à 2.3.2 copiado para este computador e conferido como íntegro; é cópia externa manual.
- Login, sessão após recarga e saída de anunciante/administração aprovados em desktop e celular. Testes usaram contas temporárias isoladas, já removidas junto com a empresa de teste e sessões restantes. Nenhuma conta de cliente foi redefinida.
- Instalador ajustado para não exigir atribuição de grupo da hospedagem em arquivos públicos e publicar o `index.html` após os assets. Falha anterior à substituição não tenta restaurar um arquivo que não mudou. Dois testes de regressão adicionados.

## Verificação

76 testes Django, 54 cenários de navegador, três integrações com API real e dez testes operacionais passaram localmente e no [CI do GitHub](https://github.com/Andressa-Anthero7/Guia-Comercial-Araraquara/actions/runs/35913682031). TypeScript, build e consistência de migrações aprovados. A primeira chamada de testes usou incorretamente um módulo de testes como settings; foi corrigida para `manage.py test`, que passou.

A [PR #2](https://github.com/Andressa-Anthero7/Guia-Comercial-Araraquara/pull/2) foi integrada em `dev` após aprovação dos testes. Monitor habilitado na branch padrão com agenda a cada meia hora; [primeira execução remota manual aprovada](https://github.com/Andressa-Anthero7/Guia-Comercial-Araraquara/actions/runs/35914023025). Isso comprova a execução do monitor, mas ainda não o recebimento de uma notificação de falha pelo responsável nem a primeira execução agendada.

Em produção: 12 verificações públicas em navegador sem erro JavaScript/transbordamento e quatro combinações de autenticação (dois perfis × dois tamanhos). Conferidos 64 arquivos da API e 20 do frontend. Ensaio e instalação preservaram as colunas/dados anteriores de 21 tabelas de negócio e a configuração protegida; integridade SQLite aprovada. A limpeza posterior retirou somente os registros identificados da auditoria.

Evidências: [HTTP/TLS](records/2026-09-23-release/public.json), [navegador público](records/2026-09-23-release/browser.json), [autenticação](records/2026-09-23-release/authenticated-browser.json), [operação](records/2026-09-23-release/operations.json), [backup](records/2026-09-23-release/backup.json) e [ambiente resumido](records/2026-09-23-release/runtime.json). O processo uWSGI não permitiu ler seu ambiente; DEBUG foi verificado também por HTTP. Credenciais e bancos não são versionados.

## Implantação e recuperação

- Pacote `gca-backoffice-2.3.2.zip`, SHA-256 `e530ed5c3fd1b1f092fb25a9028bc3444c72ac7e42a51d953b31577613377875`.
- Banco anterior: `/home/gca-backend/deploy-backups/release-2.3.2/before-1790193363762032232.sqlite3`; cópia local em `output/backoffice-v2/readiness-20260923/before-2.3.2.sqlite3`.
- API anterior: `/srv/gca-backend.2d4f02a0.configr.cloud/gca-api-2.3.2-7jm369dj`.
- Frontend anterior: `/srv/app33.2d4f02a0.configr.cloud/gca-public-2.3.2-atomic-beu5hp65`.
- Settings antes de corrigir DEBUG: `/home/gca-backend/deploy-backups/debug-fix-20260923-195139`; antes das opções de e-mail: `/home/gca-backend/deploy-backups/email-settings-1790193314846693945`.
- O instalador inicial do frontend encontrou restrição de `chown`; a publicação foi concluída pelo script `deployment/publish_app33_232.py`, conferindo hashes e trocando o índice por último. O pacote original permanece imutável; a correção genérica do instalador está no repositório para a próxima versão.
- Para reversão, recuperar arquivos compatíveis e manter o banco atual. Não sobrescrever dados novos com o backup antigo. A migração de e-mail é aditiva e os envios permanecem desativados.

## Dependências restantes

| Item | Próxima ação necessária |
| --- | --- |
| SMTP | Configurado após este fechamento; 16 mensagens de teste aceitas pelo servidor, com recebimento na caixa de entrada confirmado pelo responsável. [Evidência](records/2026-09-23-release/smtp.json). Eventos/worker seguem desativados; falta ativação e recuperação ponta a ponta em conta controlada de produção. |
| PostgreSQL | Usuário confirmou que ainda não existe instância. Criar banco/acesso; ensaiar transferência, comparar dados e planejar troca com backup. SQLite permanece ativo. |
| Certificados e DEBUG | HTTPS funciona agora. Confirmar com Cloudez persistência das configurações e renovação dos certificados por aliases. |
| Backup externo recorrente | Definir destino, retenção e responsável. A cópia no computador é manual. |
| Monitoramento | Workflow publicado e habilitado em `dev`, primeira execução manual remota aprovada. Conferir primeira execução agendada e recebimento das notificações pelo responsável. |
| Android e push | APK debug 2.3.1 existente; falta aparelho para instalação/recebimento reais. Não é release de loja. |
| Google/Meta | Inicialização e isolamento testados; faltam contas/destinos para comprovar recebimento real. |
| Conteúdo e aceite | Cupons, eventos e telefones úteis continuam sem conteúdo real; confirmar contato comercial, responsáveis e aceite. Duplicidades de anunciantes preservadas, sem fusão automática. |
| Escopo ainda não entregue | SEO/prévias sociais por empresa e carga sob volume não homologados. Pagamentos integrados permanecem em espera conforme decisão anterior. |

Não há fundamento para declarar entrega integral enquanto esses itens permanecerem abertos.
