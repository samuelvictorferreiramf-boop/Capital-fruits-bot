const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

const admin = (cmd) => cmd.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const commands = [
  admin(new SlashCommandBuilder().setName("enviar-embed").setDescription("Envia o anúncio de um produto em um canal")
    .addChannelOption(o => o.setName("canal").setDescription("Canal onde o embed será publicado").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(o => o.setName("produto").setDescription("Pesquise e selecione um produto ativo").setAutocomplete(true).setRequired(true))),
  admin(new SlashCommandBuilder().setName("painel").setDescription("Mostra o resumo da loja")),
  admin(new SlashCommandBuilder().setName("produtos").setDescription("Lista os produtos cadastrados")),
  admin(new SlashCommandBuilder()
    .setName("adicionar-produto")
    .setDescription("Cadastra um produto na loja")
    .addStringOption(o => o.setName("nome").setDescription("Nome do produto").setRequired(true))
    .addNumberOption(o => o.setName("preco").setDescription("Preço em reais").setMinValue(0).setRequired(true))
    .addStringOption(o => o.setName("descricao").setDescription("Descrição do produto").setRequired(true))
    .addIntegerOption(o => o.setName("estoque").setDescription("Quantidade em estoque").setMinValue(0).setRequired(true))),
  admin(new SlashCommandBuilder()
    .setName("editar-produto")
    .setDescription("Edita um produto pelo ID")
    .addStringOption(o => o.setName("id").setDescription("UUID do produto").setRequired(true))
    .addStringOption(o => o.setName("nome").setDescription("Novo nome"))
    .addNumberOption(o => o.setName("preco").setDescription("Novo preço em reais").setMinValue(0))
    .addStringOption(o => o.setName("descricao").setDescription("Nova descrição"))
    .addIntegerOption(o => o.setName("estoque").setDescription("Novo estoque").setMinValue(0))),
  admin(new SlashCommandBuilder().setName("anunciar").setDescription("Publica um anúncio").addStringOption(o => o.setName("texto").setDescription("Texto do anúncio").setRequired(true))),
  admin(new SlashCommandBuilder().setName("aprovar").setDescription("Marca um pedido como aprovado (revisão administrativa)").addStringOption(o => o.setName("pedido").setDescription("ID do pedido").setRequired(true))),
  admin(new SlashCommandBuilder().setName("conectar").setDescription("Testa a conexão real com o Supabase")),
  admin(new SlashCommandBuilder().setName("delivery").setDescription("Consulta um pedido para entrega manual").addStringOption(o => o.setName("pedido").setDescription("ID do pedido").setRequired(true))),
  new SlashCommandBuilder().setName("gerar-pix").setDescription("Geração de Pix desativada").addStringOption(o => o.setName("produto").setDescription("ID do produto").setRequired(true)).addIntegerOption(o => o.setName("quantidade").setDescription("Quantidade").setMinValue(1).setMaxValue(10).setRequired(true)),
  admin(new SlashCommandBuilder().setName("lock").setDescription("Bloqueia o envio de mensagens neste canal")),
  admin(new SlashCommandBuilder().setName("unlock").setDescription("Libera o envio de mensagens neste canal")),
  admin(new SlashCommandBuilder().setName("nuke").setDescription("Desativado: evita apagar canais e histórico em massa")),
  admin(new SlashCommandBuilder().setName("painel-bot").setDescription("Mostra o estado real do bot e do Supabase")),
  admin(new SlashCommandBuilder().setName("painel-vendas").setDescription("Mostra resumo dos pedidos")),
  new SlashCommandBuilder().setName("perfil").setDescription("Mostra seu perfil de cliente"),
  admin(new SlashCommandBuilder().setName("perms").setDescription("Consulta permissões administrativas").addUserOption(o => o.setName("usuario").setDescription("Usuário").setRequired(true))),
  admin(new SlashCommandBuilder().setName("rank-produtos").setDescription("Mostra ranking de produtos")),
  admin(new SlashCommandBuilder().setName("say").setDescription("Envia uma mensagem como o bot").addStringOption(o => o.setName("texto").setDescription("Mensagem").setRequired(true))),
  admin(new SlashCommandBuilder().setName("set").setDescription("Configura uma opção simples da loja").addStringOption(o => o.setName("chave").setDescription("Nome da configuração").setRequired(true)).addStringOption(o => o.setName("valor").setDescription("Valor").setRequired(true))),
  admin(new SlashCommandBuilder().setName("setdono").setDescription("Define o dono autorizado do bot").addUserOption(o => o.setName("usuario").setDescription("Dono").setRequired(true))),
  admin(new SlashCommandBuilder().setName("status").setDescription("Mostra o status do bot"))
];

module.exports = commands.map(c => c.toJSON());
