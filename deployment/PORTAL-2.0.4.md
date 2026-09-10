# Portal 2.0.4 — capa menor nas páginas das empresas

Publicada em 10/09/2026 às 20h26, America/Sao_Paulo.

A capa das páginas dedicadas passa de altura mínima de 384 para 256 pixels em telas a partir de 640 pixels, e de 288 para 224 pixels nas menores. O conteúdo pode aumentar a altura necessária para acomodar nomes e endereços longos. A apresentação do modal não mudou.

Build preparado a partir da versão publicada 2.0.3, commit `0ecdab0fd59dd57a1b9f5ebddf5894f2658da863`, com somente o ajuste de altura e a versão. As funcionalidades do backlog em desenvolvimento não fazem parte desta entrega.

TypeScript, build e verificação visual no navegador passaram. Na página M Espetinhos em produção, foram confirmadas alturas de 256 pixels em viewport 1440×1000 e 224 pixels em viewport 390×844, sem rolagem horizontal, com capa carregada, nome e contato visíveis, HTTPS validado e sem erros JavaScript/HTTP observados.

Instalados somente três arquivos estáticos: `index.html`, `assets/index-5Y-jcNlZ.js` e `assets/index-Dcovr0F6.css`. A API serve o HTML diretamente do arquivo; não foi necessário recarregar processos. Código do backend, banco, Nginx e certificados não foram alterados. O aviso conhecido de tamanho do bundle continua.

## Pacote e reversão

- Pacote local: `output/backoffice-v2/cover-2.0.4/gca-cover-2.0.4.zip`.
- SHA256: `b5c6186d9f02ffc2617440ee3ca33fe23d6741b201d004022df0848218f3a218`.
- Backup do site: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.0.4-mwrua9ln`.
- Backup da interface da API: `/srv/gca-backend.2d4f02a0.configr.cloud/www/gca-public-2.0.4-jl1k48uo`.
- Registros remotos: `/home/guia_comercial_araraquara/gca-cover-2.0.4-edlaond_/result.json` e `/home/gca-backend/gca-cover-2.0.4-ma4yozd1/result.json`.

Para reverter, restaurar o `index.html` do respectivo backup; os assets anteriores foram preservados. Evidências em `records/2026-09-10/cover-2.0.4-browser.json` e capturas locais em `output/backoffice-v2/cover-2.0.4/`.
