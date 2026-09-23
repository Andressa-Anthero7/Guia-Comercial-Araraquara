# Operação de subdomínios — 23/09/2026

Decisão do responsável: operar com aliases explícitos e certificado com nomes individuais no `app33`, enquanto discute certificado wildcard e sua renovação com o suporte da Cloudez. Nenhuma mensagem foi enviada ao suporte pelo agente.

## Estado verificado

- Frontend: `/srv/app33.2d4f02a0.configr.cloud/www`, no servidor `45.79.2.160`. API e banco mantidos na aplicação existente.
- Domínio principal, `www`, `barbearia-alcantara` e `m-espetinhos`: testes externos da sessão confirmaram TLS válido e HTTP 200 após a reemissão.
- Certificado emitido em 23/09/2026 às 18:26:39 UTC, válido até 22/12/2026 às 18:26:38 UTC.
- Nomes cobertos: `guiacomararaquara.com.br`, `www.guiacomararaquara.com.br`, `barbearia-alcantara.guiacomararaquara.com.br`, `www.barbearia-alcantara.guiacomararaquara.com.br`, `m-espetinhos.guiacomararaquara.com.br` e `www.m-espetinhos.guiacomararaquara.com.br`. Não é wildcard; as variantes `www` dos clientes constam no certificado, mas não tiveram teste HTTP individual registrado.
- Estes resultados substituem o bloqueio de HTTPS desses dois clientes registrado em 22/09. Não equivalem a homologação de login nem a aceite integral das demais funcionalidades.

## Inclusão de um cliente

1. No sistema, definir o plano/benefício de página personalizada, preencher o subdomínio e confirmar a publicação. A classificação como pago não comprova recebimento financeiro.
2. Na aplicação `app33` da Cloudez, adicionar o endereço completo aos aliases.
3. Conferir o DNS público. Nos testes desta sessão, salvar o alias criou o apontamento para o servidor. Verificar o resultado para cada inclusão, sem presumir sucesso automático.
4. Acumular as inclusões quando possível e programar uma janela para reemissão: o procedimento observado foi desativar e reativar HTTPS no painel, preservando todos os aliases desejados. Durante o processo, os endereços da aplicação ficaram com certificado incompatível.
5. Após o painel concluir, testar a validação TLS e a resposta HTTP do domínio principal, do novo cliente e dos clientes anteriores. O cadeado do painel não substitui essa verificação.

A liberação do benefício no sistema não automatiza as etapas da hospedagem. Não reemitir repetidamente se houver falha; consultar o estado da solicitação e o suporte.

## Pendências e limites

- Discutir com a Cloudez emissão, persistência e renovação de certificado cobrindo o domínio principal e `*.guiacomararaquara.com.br`, além do DNS wildcard. Renovação automática ainda não foi comprovada.
- Nomes incorretos sem DNS não chegam à aplicação. Mesmo com DNS wildcard, HTTPS exige cobertura válida para exibir o fallback sem aviso de segurança.
- O fallback já existente foi melhorado localmente para “Empresa não encontrada”, com nome consultado e link para o guia. Publicada e validada em desktop/celular na 2.3.2; consulte o [fechamento](CONCLUSAO-2026-09-23.md).
- A exclusão da aplicação antiga não foi executada pelo agente nem validada como segura. O funcionamento atual não comprova independência dos arquivos de certificado ou da renovação em relação à aplicação antiga.
