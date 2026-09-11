# Regressão do certificado dos subdomínios

**HTTPS restaurado e verificado em 10/09/2026 às 20h15 (America/Sao_Paulo).** O usuário executou o script preparado no terminal root; backup criado em `/root/gca-wildcard-04asxs5m`. A verificação externa confirmou HTTP 200, validação TLS e redirecionamento HTTP para HTTPS no domínio principal, M Espetinhos e Alcântara Barbearia, todos apresentando novamente o wildcard serial `05E9D91DE49234991E704B62B9D63E68F55E`, válido até 08/12/2026 às 21:53:08 UTC. Não houve nova emissão. Evidência: `wildcard-restored-verification.json`. O monitor externo também passou nas verificações da API e da ausência de página técnica de depuração. A persistência na configuração gerenciada pela Cloudez, a autoria da substituição e a renovação automática continuam pendentes.

Verificação em 10/09/2026, aproximadamente 19h36–19h37 (America/Sao_Paulo).

## Evidências

- Em 09/09/2026 às 21h44, o teste registrado em `../2026-09-09/production-verification.json` confirmou HTTPS válido para M Espetinhos e Alcântara Barbearia. O certificado cobria `*.guiacomararaquara.com.br` e `guiacomararaquara.com.br`, serial `05E9D91DE49234991E704B62B9D63E68F55E`, vencimento 08/12/2026 às 21:53:08 UTC.
- A consulta atual ao domínio principal e a `m-espetinhos.guiacomararaquara.com.br`, ambos resolvendo para `45.79.2.160`, recebeu o certificado serial `0547F4DEA377BAA8A133AADC277995F0E889`, emitido em 29/07/2026 e com vencimento em 27/10/2026 às 13:18:40 UTC.
- Seus nomes são apenas `dev.guiacomararaquara.com.br`, `guiacomararaquara.com.br`, `www.dev.guiacomararaquara.com.br` e `www.guiacomararaquara.com.br`. Não há wildcard. A conexão com validação TLS para M Espetinhos falha por incompatibilidade de nome.
- O `server.conf` ainda contém `*.guiacomararaquara.com.br` em `server_name`, inclui `domain_ssl.conf` e não foi modificado desde 09/09 às 16h53.
- O arquivo `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/etc/nginx/domain_ssl.conf` apresenta criação e modificação em **10/09/2026 às 15:43:02 -0300**. Pertence a `www-data`, modo 0400, e não pode ser lido pela conta SSH disponível.

## Conclusão e limites

A correção de ontem estava confirmada. O servidor passou a apresentar um certificado anterior, sem cobertura dos subdomínios das empresas. Isso explica a falha HTTPS atual. O horário do arquivo indica alteração posterior da configuração SSL, mas não prova o horário exato de início da falha nem identifica o autor/processo responsável. Uma reaplicação da configuração gerenciada pela hospedagem é hipótese, ainda sem confirmação por logs do painel.

Nesta sessão não houve escrita em configurações Nginx ou certificados. As intervenções operacionais foram a correção de `DEBUG=True` da API (19h16, com backup e recarga apenas do uWSGI) e a instalação de backup diário do SQLite (primeira cópia às 19h21, restaurada em banco isolado e conferida). As novas funcionalidades permanecem locais, sem publicação.

## Ação pendente

Reaplicar o certificado wildcard correto na configuração persistente da aplicação 415008 pela Cloudez, verificar HTTPS nas páginas de empresas e investigar o evento das 15h43 no histórico da hospedagem. Não alterar permissões dos arquivos protegidos para contornar o acesso. A automação de renovação permanece separada: o certificado wildcard registrado ontem não estava vencido.

## Investigação de autoria, 19h38–19h40

- A instalação manual de ontem, preservada em `output/wildcard-diagnostics/install-wildcard-host.sh`, apontava `domain_ssl.conf` para `/etc/letsencrypt/live/guiacomararaquara-wildcard/fullchain.pem` e `privkey.pem`, com backup e teste do Nginx. O script foi lido, não executado nesta investigação.
- O arquivo `server.conf` contém aviso explícito de que é gerado e mantido pela Cloudez. Isso identifica o mecanismo de gestão da configuração, mas não identifica o evento específico.
- O arquivo `authorized_keys` da conta do site tem modificação em **15:43:06.995804 -0300**, aproximadamente quatro segundos após a recriação da configuração SSL. Foram consultados apenas metadados, sem leitura de chaves. A coincidência reforça a hipótese de reaplicação de configurações do servidor.
- O log legível de pacotes registra `2026-09-10 15:42:26 startup packages configure`; a linha não identifica Cloudez, alteração de certificado ou atualização efetiva de pacote.
- Não houve eventos relevantes no log Nginx da aplicação no intervalo 15h40–15h46. O journal acessível não retorna entradas nesse intervalo e avisa que os registros do sistema e de outros usuários não estão disponíveis à conta.
- `auth.log`, `syslog`, log global do Nginx e logs do Let's Encrypt não são legíveis pela conta atual. O sudo permitido se limita a recarga de serviços e ajuste de permissões via `cez`; não autoriza leitura administrativa. Não foi usado para contornar essa restrição.
- As rotinas legíveis de cron e a lista de timers não identificaram uma execução Cloudez às 15h43. O último timer do Certbot foi às 04h23, não às 15h43; isso não exclui uma chamada fora do timer.

**Resultado:** há indícios de reaplicação da configuração gerenciada pela hospedagem, mas não há prova suficiente para atribuir a alteração à Cloudez, a um operador ou a um comando específico. A confirmação exige o histórico administrativo da aplicação/servidor. Nenhuma configuração remota foi alterada durante esta investigação.

## Recuperação preparada após solicitação do usuário

O acesso SSH root foi recusado com ambas as identidades conhecidas do projeto. Preparado `deployment/restore_wildcard.py` e instalado, sem execução administrativa, em `/home/guia_comercial_araraquara/gca-restore-wildcard-20260910.py`, SHA256 `566cd70a1d68a1272ebca47b0420418e0f18d4afdf21aa7b5ad5005233a83c20`.

O script verifica presença do certificado anterior, validade mínima de sete dias, cobertura wildcard e do domínio principal, correspondência da chave e configuração inicial do Nginx. Com `--apply`, salva backup em `/root`, altera somente as duas diretivas de certificado, testa e solicita recarga. Em falha de teste/recarga, restaura a configuração anterior. Configuração ambígua ou arquivo convertido em link simbólico interrompem a operação. Nenhuma chave privada é impressa ou copiada. Validadas sintaxe e transformação da configuração, incluindo rejeição de diretivas duplicadas/ausentes; a aplicação real depende do terminal root do usuário.

Comando preparado para o terminal root da Cloudez:

```bash
python3 /home/guia_comercial_araraquara/gca-restore-wildcard-20260910.py --apply
```

Na preparação ainda não havia ocorrido restauração ou nova emissão. A execução posterior pelo usuário e a verificação externa estão registradas no início deste documento. A persistência da configuração na Cloudez e a autoria da alteração continuam pendentes.

### Solicitação preparada para o suporte (não enviada)

Na aplicação 415008, servidor `ip-45-79-2-160.cloudezapp.io`, confirmar qual tarefa/processo/usuário recriou `etc/nginx/domain_ssl.conf` em 10/09/2026 às 15:43:02 -0300 e atualizou `authorized_keys` às 15:43:06. O HTTPS estava validado em 09/09 às 21h44 com o wildcard serial `05E9D91DE49234991E704B62B9D63E68F55E`; agora é servido o certificado anterior serial `0547F4DEA377BAA8A133AADC277995F0E889`, sem cobertura de `*.guiacomararaquara.com.br`. Verificar reaplicação automática de configurações e orientar a persistência do certificado wildcard para que não seja novamente substituído. Preservar os logs do intervalo 15h40–15h46.
