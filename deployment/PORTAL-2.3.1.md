# Portal 2.3.1 — candidato após ensaio com banco real

Inclui as correções e funcionalidades descritas em [2.3.0](PORTAL-2.3.0.md), com preservação da versão aprovada durante a revisão de anúncios.

O candidato 2.3.0 não foi instalado: o ensaio isolado identificou que retiraria duas empresas já publicadas cujos anúncios estão em revisão. A 2.3.1 acrescenta `core.0017_advertisement_published_snapshot`, preservando o perfil público e as datas da última versão aprovada enquanto o novo conteúdo aguarda análise. Uma revisão de anúncio pausado/encerrado não republica o perfil. Anúncios futuros/expirados continuam obedecendo às datas aprovadas.

Migrações aditivas: `0015`, `0016` e `0017`. A migração de transição copia as datas existentes para os campos de versão aprovada nos anúncios publicados/em revisão de empresas ativas. O ensaio deve confirmar que as sete empresas atualmente visíveis continuam visíveis e que valores das colunas antigas não mudam.

Configuração de produção, certificados, credenciais e bancos não são incluídos no pacote. Backup dos arquivos e do banco, ensaio de migrações, comparação dos dados e verificação de checksums precedem a instalação. Após instalar, recarregar apenas a API e verificar as páginas públicas e os fluxos de autenticação. Reversão de código usa o backup de arquivos; não restaurar banco antigo sobre gravações novas de clientes.

Limites de aceite: correção do certificado wildcard depende do acesso administrativo da hospedagem; SMTP/PostgreSQL ainda dependem de configuração; push, marketing externo e APK dependem de homologação em seus destinos. Gateway de pagamento continua fora do escopo ativo.
