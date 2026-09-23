# Portal 2.3.0 — revisão para entrega

Pacote de correções e funcionalidades previamente salvas, revisadas em 22/09/2026.

- Carregamento separado das telas com preservação da sessão; formulário de fotos responsivo; erros de cópia de telefone tratados.
- Fotos do anunciante, métricas, benefícios por assinatura, publicação por datas/pausa e resumo financeiro com vencidos explícitos.
- Recuperação de senha com token de uso único, SMTP TLS/SSL e link no domínio do Guia. Envio depende de configuração SMTP.
- Eventos podem ser salvos neste navegador, sem contagem fictícia de interessados.
- Cobrança recorrente disponível por `run_billing.py`, sem integração de gateway de pagamento.

Migrações: `core.0015_businessdailymetric` e `core.0016_advertisingsubscription_billing_anchor_day_and_more`. São aditivas: nova tabela de métricas, dia-base de cobrança e chave única de recorrência. Não apagam dados existentes.

Preparação: conferir checksums; executar candidato contra cópia do banco; comparar dados legados; manter backup do banco e de todos os arquivos alterados. Configuração de produção e certificados ficam fora do pacote. O DEBUG foi corrigido separadamente e deve permanecer desligado.

Publicação só deve ocorrer após testes e ensaio do candidato. Depois conferir versão, login, páginas públicas, permissões e registros preservados. Em falha, restaurar os arquivos do backup; as migrações aditivas são compatíveis com o código anterior. Não restaurar um banco antigo sobre novas gravações de clientes sem análise.

Limites externos: wildcard protegido pela hospedagem; PostgreSQL e SMTP ainda dependem de disponibilidade; marketing precisa de recebimento comprovado nas plataformas; push/Android de dispositivo. Esta versão não equivale ao aceite integral do cliente.
