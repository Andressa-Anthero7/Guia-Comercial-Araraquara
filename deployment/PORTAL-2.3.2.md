# Portal 2.3.2

Inclui os e-mails transacionais implementados e a tela de empresa não encontrada com endereço consultado e retorno ao catálogo. A migração 0018 cria a fila de e-mails; captura e envio automático permanecem desativados. SMTP ainda precisa ser provisionado e homologado antes da ativação.

## Implantação

Instalar API e frontend app33, preservando settings, ambiente, clientes, certificados e configuração do proxy. Ensaiar a migração em cópia do banco e comparar todas as colunas existentes antes de instalar. Usar backup de arquivos e banco. Não substituir o banco ativo por uma cópia antiga para reverter arquivos.

O settings efetivo deve conter as opções descritas em `docs/EMAILS-TRANSACIONAIS.md`. Esta versão não cria serviço SMTP nem PostgreSQL. Nenhuma mensagem é enviada durante a migração.

## Validação

76 testes Django, 54 cenários de navegador e 3 integrações com API real passaram em 23/09 antes do empacotamento. Verificações finais de implantação e limitações ficam em `docs/CONCLUSAO-2026-09-23.md`.
