# Capital Fruits — atualização do painel e produtos

Esta versão inclui:
- `/painel`: quantidade de produtos e pedidos.
- `/produtos`: lista os produtos cadastrados.
- `/adicionar-produto`: cadastra nome, preço, descrição e estoque.
- `/editar-produto`: altera campos de um produto usando seu UUID.

## Variáveis de ambiente necessárias na hospedagem
- DISCORD_TOKEN
- DISCORD_CLIENT_ID
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- DISCORD_GUILD_ID (opcional; recomendado para registro rápido)
- BOT_OWNER_ID (opcional)

Não coloque tokens ou chaves neste ZIP. Configure-os somente nas variáveis de ambiente da hospedagem.
A chave SUPABASE_SERVICE_ROLE_KEY deve permanecer somente no servidor.

## Importante
- Pagamentos Pix permanecem desativados.
- `/aprovar` e `/delivery` continuam sendo respostas informativas; não fazem atualização real de pedidos.
- O painel depende de a tabela `orders` existir e estar acessível.
- Os comandos de produtos usam as colunas: id, name, description, price, stock_quantity, is_active, created_at e updated_at.

- `/enviar-embed`: seleciona um canal de texto e pesquisa um produto ativo pelo autocomplete; publica um embed com nome, descrição, preço e estoque.
- O botão de pagamento fica desativado até a integração com um provedor ser configurada. Nenhuma cobrança Pix é criada por este comando.


## Atualização
- /enviar-embed publica produto ativo; botão de pagamento desativado.
- /painel-bot e /status mostram Discord, latência e teste do Supabase.
- /conectar testa acesso à tabela products.
- /delivery consulta pedido pelo ID, sem alterar status.
- /aprovar permanece manual.
- /gerar-pix permanece desativado; nenhuma cobrança é criada.


## Correção de estabilidade do autocomplete

O autocomplete de `/enviar-embed` agora usa um cache local de produtos, atualizado em segundo plano a cada 60 segundos. Assim, uma falha temporária de DNS/rede do Supabase não bloqueia a resposta do Discord nem derruba o processo. Se o Supabase estiver indisponível na inicialização, o bot continua online; as sugestões voltam quando a conexão for restabelecida. Os comandos que precisam do banco continuam informando falha quando o serviço não estiver acessível.
