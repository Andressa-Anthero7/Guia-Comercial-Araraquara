# Portal e Backoffice 2.0.2

**Publicada em 10/09/2026 às 08:57** nas aplicações 415078 e 415008. Consulte o [registro da publicação](records/2026-09-10/landingpages-2.0.2/production-deployment.md).

As landing pages agora seguem o modal do portal: capa, logomarca, categoria e painel branco com informações da empresa, contatos e mapa. As duas apresentações compartilham o componente `BusinessProfile`, com serviços e produtos, especialidades, galeria sem fotos repetidas, endereço completo, telefone comercial, e-mail, site e Instagram, conforme os dados cadastrados.

A página oferece acesso direto ao WhatsApp e às rotas, cupons com cópia e validade, avaliações publicadas e formulário de avaliação. O envio continua sujeito à moderação. Falhas de envio preservam o texto preenchido; falhas ao copiar um cupom não exibem confirmação de sucesso. Campos opcionais vazios não geram links ou seções vazios.

## Validação

- `npm run lint` e `npm run build` no frontend.
- `npm run test:e2e -- --workers=1`: 27 testes, incluindo paridade entre landing e modal, contatos e mapa com cidade cadastrada, isolamento de cupons e avaliações por empresa, falha e nova tentativa, e telas de 320/390 pixels.
- `npm run test:integration`: 2 testes com Django e banco temporário. Inclui cadastro, aprovação, fotos, contatos distintos e envio real de avaliação pela landing, confirmando que permanece pendente no gerenciador e ausente da consulta pública.
- Conferência visual em desktop e celular.

## Publicação

Gerar o pacote com `python deployment/build_backoffice_release.py`. Destinos: API 415078 e site público 415008. O pacote não inclui banco, credenciais, certificados ou configurações do servidor.

Não há migração nova em relação à 2.0.1. O pacote completo mantém a execução de `migrate core --noinput`, que deve informar que não há migrações pendentes em uma instalação 2.0.1. Usar o instalador com `--check-only` antes da instalação e manter os backups de arquivos e banco. Recarregar somente a aplicação da API.

Conferir as landing pages por subdomínio, o modal do portal, contatos, fotos, mapa, formulário e acesso ao backoffice. Não enviar avaliações de teste em produção: o fluxo de gravação foi validado no banco temporário.

Para retornar à versão anterior, restaurar os arquivos salvos pelo instalador. Esta entrega não requer reversão do banco.
