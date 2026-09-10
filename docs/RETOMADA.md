# Ponto de retomada — Guia Comercial Araraquara

**Atualização após o retorno em 10/09/2026:** o usuário pediu revisão da planilha de pendências. A [planilha de execução](https://docs.google.com/spreadsheets/d/1InSVtuHH8RaZj3IZ8l0mQwY1moeqS3xgnOzQTgAFKeo/edit), aba `Plano de Acao`, foi atualizada e relida: 34 itens, sendo 10 concluídos e 24 abertos. Consulte o [registro da revisão da planilha](REVISAO-PLANILHA-2026-09-10.md). Esta tarefa atualizou o acompanhamento; não implementou as pendências. O texto abaixo preserva o ponto de pausa da manhã e as evidências das entregas.

Atualizado em **10/09/2026, às 09:26, America/Sao_Paulo**. O usuário pediu para salvar o ponto atual e pausar para atender um cliente. Aguardar seu retorno antes de iniciar novas melhorias.

## Onde paramos

A versão **2.0.3 está publicada e verificada em produção**. A última tarefa concluída corrigiu a sessão da Área do Anunciante quando aberta pelo domínio público. O próximo contato deve começar pela experiência do usuário ao entrar no painel; ele ainda não confirmou pessoalmente o resultado após a correção, embora os testes em produção tenham passado.

O usuário aprovou o novo visual das landing pages e pediu acesso a uma empresa cadastrada para conhecer o painel. Foi liberada a Sol Centro Técnico Automotivo. Depois ele relatou “Sua sessao expirou ou voce nao tem permissao” em `https://guiacomararaquara.com.br/anunciante/`; a causa foi reproduzida e corrigida na 2.0.3.

## Entregas concluídas nesta sessão

1. **2.0.1 — publicada às 08:27:** telefone comercial separado de WhatsApp, preservação dos contatos antigos, capa do cadastro público salva, galeria pública por URLs e tratamento de carregamento/falhas da API sem dados de demonstração. Migração `core.0014_business_phone` aplicada com backup.
2. **2.0.2 — publicada às 08:57:** landing pages reformuladas conforme o modal, com componente compartilhado `BusinessProfile`, descrição, serviços, especialidades, fotos, contatos completos, endereço, mapa, cupons e avaliações. Campos opcionais aparecem conforme o cadastro. Avaliações continuam sujeitas à moderação.
3. **Acesso do anunciante — liberado às 09:10:** conta comum vinculada ao perfil existente da Sol, sem privilégios administrativos.
4. **2.0.3 — publicada às 09:23:** áreas `/anunciante` e `/backoffice` abertas fora do servidor de autenticação são encaminhadas antes de autenticar. Sessão expirada no carregamento/atualização do painel retorna ao login, permitindo novo acesso.

## Acesso e conteúdo da conta liberada

- Entrada pública: <https://guiacomararaquara.com.br/anunciante/>.
- Destino autenticado: <https://webapp415078.ip-45-79-2-160.cloudezapp.io/anunciante/>.
- Usuário: `sol.automotivo`; a senha já foi entregue ao usuário na conversa e não deve ser copiada para arquivos do projeto.
- Conta ID **4**, anunciante ID **9**, estabelecimento ID **8**.
- Conteúdo atual: **1 estabelecimento e 1 anúncio**; cupons, assinaturas e cobranças vazios conforme o cadastro.
- Seis abas: Visão geral, Cadastro, Estabelecimentos, Anúncios, Cupons e Financeiro.
- Confirmados em produção: login pelo domínio público, seis abas, edição aberta sem salvar, sessão após recarregar, volta ao login após remover cookies de um contexto isolado e novo login. Backoffice recusado com HTTP 403 para essa conta.

A falha anterior não exigiu redefinição de senha: a autenticação pelo domínio público retornava 200, mas as chamadas seguintes à API em outro domínio usavam `credentials: omit`, retornando 401. O encaminhamento para o mesmo domínio da autenticação resolveu esse fluxo. Cookies, CSRF, CORS e permissões de produção foram preservados.

## Validação e estado local

- Código em `C:\Users\andre\vscode\gca`, branch `dev`, base do Git `3662e129340c750427ad0a66f7bd2fa8fff39484`.
- As alterações de toda a sessão estão salvas no disco, com arquivos modificados e novos ainda **sem commit/push**. Preservar o estado de trabalho ao retomar.
- Versão em `frontend/package.json`, lockfile e `frontend/src/version.ts`: **2.0.3**.
- Verificações da última entrega: TypeScript e build passaram; **29 testes de navegador com API simulada e 3 com Django real** passaram. O teste real de autenticação foi reexecutado isoladamente após corrigir sua espera pela resposta HTTP do login; os dois demais já haviam passado.
- Na entrega 2.0.1 também passaram 45 testes Django e 6 do instalador. Não foram reexecutados nas mudanças posteriores de interface; o código de produção do backend foi comparado e confirmado igual antes dessas instalações.
- Bundle atual: `index-DF71In71.js`, CSS `index-DxuiNxW8.css`. Permanece o aviso conhecido de tamanho do JavaScript: 1.231,69 kB; gzip 266,91 kB.
- Pacote atual: `output/backoffice-v2/gca-backoffice-2.0.3.zip`, SHA256 `a9d3ed9240440e8405d67e692101643215ce2927c4ac75ccb3055639a2aaa59f`.
- Não sobrescrever os pacotes publicados ao preparar futuras versões.

## Pendências para conversar na retomada

Pendências registradas, ainda não executadas. Aguardar o retorno do usuário; na retomada, considerar sua experiência com o painel e as prioridades já autorizadas na conversa.

- Área do anunciante: envio/troca de fotos na interface, recuperação de senha, acompanhamento de visitas/cliques e pagamento integrado ainda não estão disponíveis.
- Revisão anterior: janela de publicação dos anúncios, execução das integrações de marketing e correção do endpoint de resumo financeiro para cobranças explicitamente vencidas.
- Automações comerciais: renovação de assinaturas/cobranças e aplicação completa dos benefícios dos planos.
- Operação: automatizar renovação do certificado wildcard antes de 08/12/2026, confirmar rotina de backups e restauração, validar push/Android conforme a prioridade do produto.
- Outros pontos registrados: metadados específicos por empresa, tamanho do bundle e conteúdo fixo de demonstração no rodapé.
- Na seleção da conta foram observados vários perfis de anunciante com o mesmo nome da sorveteria, alguns sem empresas vinculadas. Isso não foi investigado nem alterado; não excluir nem consolidar cadastros automaticamente.

## Referências e operação

- [Revisão original e pendências](REVISAO-2026-09-10.md).
- [Publicação 2.0.1](../deployment/records/2026-09-10/production-deployment.md).
- [Publicação das landing pages 2.0.2](../deployment/records/2026-09-10/landingpages-2.0.2/production-deployment.md).
- [Conta de anunciante liberada](../deployment/records/2026-09-10/advertiser-access-sol.md).
- [Correção de sessão 2.0.3 e backups](../deployment/records/2026-09-10/authentication-2.0.3/production-deployment.md).
- [Verificação autenticada em produção](../deployment/records/2026-09-10/authentication-2.0.3/authentication-verification.json).

Produção: API **415078**, conta `gca-backend`, raiz `/srv/gca-backend.2d4f02a0.configr.cloud/www`; site **415008**, conta `guia_comercial_araraquara`, raiz `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/www`. Host `ip-45-79-2-160.cloudezapp.io`. Identidades SSH locais: `C:\Users\andre\.ssh\cloudez_gca_backend` e `C:\Users\andre\.ssh\cloudez_guia_comercial_araraquara`; não ler nem copiar as chaves para o repositório.

Python da API: `/srv/gca-backend.2d4f02a0.configr.cloud/.virtualenv/3.12/bin/python`. Scripts operacionais da última publicação: `output/backoffice-v2/release-2.0.3/` localmente e `~/releases/backoffice-2.0.3-a9d3ed92/` em cada conta remota. A comparação antes/depois da última instalação preservou os registros das 20 tabelas da aplicação e a configuração de produção.
