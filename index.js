const { Client, GatewayIntentBits, PermissionFlagsBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require("discord.js");
const c = require("./config");
const db = require("./db");
const commands = require("./commands/definitions");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Cache local para o autocomplete responder dentro do prazo do Discord.
// A consulta ao Supabase acontece em segundo plano e falhas não derrubam o bot.
let productCache = [];

async function refreshProductCache() {
  try {
    const { data, error } = await db
      .from("products")
      .select("id,name,price")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(100);

    if (error) throw error;
    productCache = Array.isArray(data) ? data : [];
    console.log(`Cache de produtos atualizado: ${productCache.length}`);
    return true;
  } catch (error) {
    console.error("Não foi possível atualizar o cache de produtos (o bot continuará online):", error.message || error);
    return false;
  }
}

client.once("clientReady", async () => {
  console.log(`Capital Fruits conectado como ${client.user.tag}`);
  try {
    const rest = new REST({ version: "10" }).setToken(c.discordToken);
    const route = c.guildId
      ? Routes.applicationGuildCommands(c.clientId, c.guildId)
      : Routes.applicationCommands(c.clientId);
    await rest.put(route, { body: commands });
    console.log(`Comandos slash registrados: ${commands.length}`);
  } catch (error) {
    console.error("Falha ao registrar comandos slash:", error);
  }

  // Primeira carga e atualizações periódicas protegidas contra falhas de rede.
  await refreshProductCache();
  setInterval(refreshProductCache, 60_000);
});

client.on("error", (error) => {
  console.error("Erro emitido pelo cliente Discord:", error);
});

client.on("interactionCreate", async (i) => {
  if (i.isAutocomplete()) {
    if (i.commandName !== "enviar-embed") return;
    // Nunca aguardar o Supabase aqui: o Discord exige resposta rápida.
    const term = String(i.options.getFocused() || "").toLocaleLowerCase("pt-BR");
    const choices = productCache
      .filter((p) => String(p.name || "").toLocaleLowerCase("pt-BR").includes(term))
      .slice(0, 25)
      .map((p) => ({
        name: `${p.name} — R$ ${Number(p.price).toFixed(2)}`.slice(0, 100),
        value: p.id
      }));

    return i.respond(choices).catch((error) => {
      // Interações expiradas podem ocorrer se o Discord já descartou a solicitação.
      console.warn("Não foi possível responder ao autocomplete:", error.code || error.message || error);
    });
  }
  if (!i.isChatInputCommand()) return;
  const name = i.commandName;

  try {
    if (name === "status" || name === "painel-bot" || name === "conectar") {
      await i.deferReply({ ephemeral: true });
      let dbStatus = "Falha na conexão";
      let dbDetail = "";
      try {
        const check = await db.from("products").select("id", { count: "exact", head: true });
        if (check.error) throw check.error;
        dbStatus = "Conectado";
        dbDetail = `Produtos acessíveis: ${check.count ?? 0}`;
      } catch (e) {
        dbDetail = String(e.message || e).slice(0, 250);
      }
      const heading = name === "conectar" ? "Teste de conexão" : "Painel do bot";
      return i.editReply(
        `**${heading} — Capital Fruits**\nDiscord: **Online**\nSupabase: **${dbStatus}**\n${dbDetail}\n` +
        `Latência: **${client.ws.ping} ms**\nPagamentos Pix: **desativados**`
      );
    }

    if (name === "painel") {
      await i.deferReply({ ephemeral: true });
      const [products, orders] = await Promise.all([
        db.from("products").select("*", { count: "exact", head: true }),
        db.from("orders").select("*", { count: "exact", head: true })
      ]);
      if (products.error) throw products.error;
      if (orders.error) throw orders.error;
      return i.editReply(
        `**Painel Capital Fruits**\n` +
        `Produtos cadastrados: **${products.count || 0}**\n` +
        `Pedidos registrados: **${orders.count || 0}**\n` +
        `Pagamentos: **desativados**`
      );
    }

    if (name === "produtos" || name === "rank-produtos") {
      await i.deferReply({ ephemeral: true });
      const { data, error } = await db
        .from("products")
        .select("id,name,description,price,stock_quantity,is_active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!data || data.length === 0) {
        return i.editReply("Ainda não há produtos cadastrados.");
      }
      const lines = data.map((p, n) =>
        `${n + 1}. **${p.name}** — R$ ${Number(p.price).toFixed(2)} | Estoque: ${p.stock_quantity} | ${p.is_active ? "Ativo" : "Inativo"}\nID: \`${p.id}\``
      );
      return i.editReply(`**Produtos cadastrados**\n${lines.join("\n\n")}`);
    }

    if (name === "adicionar-produto") {
      await i.deferReply({ ephemeral: true });
      const product = {
        name: i.options.getString("nome", true),
        description: i.options.getString("descricao", true),
        price: i.options.getNumber("preco", true),
        stock_quantity: i.options.getInteger("estoque", true),
        is_active: true
      };
      const { data, error } = await db
        .from("products")
        .insert(product)
        .select("id,name")
        .single();
      if (error) throw error;
      return i.editReply(`Produto **${data.name}** cadastrado com sucesso.\nID: \`${data.id}\``);
    }

    if (name === "editar-produto") {
      await i.deferReply({ ephemeral: true });
      const id = i.options.getString("id", true);
      const changes = {};
      const nome = i.options.getString("nome");
      const descricao = i.options.getString("descricao");
      const preco = i.options.getNumber("preco");
      const estoque = i.options.getInteger("estoque");
      if (nome !== null) changes.name = nome;
      if (descricao !== null) changes.description = descricao;
      if (preco !== null) changes.price = preco;
      if (estoque !== null) changes.stock_quantity = estoque;
      if (Object.keys(changes).length === 0) {
        return i.editReply("Informe pelo menos um campo para alterar.");
      }
      changes.updated_at = new Date().toISOString();
      const { data, error } = await db
        .from("products")
        .update(changes)
        .eq("id", id)
        .select("id,name")
        .maybeSingle();
      if (error) throw error;
      if (!data) return i.editReply("Não encontrei produto com esse ID.");
      return i.editReply(`Produto **${data.name}** atualizado com sucesso.`);
    }

    if (name === "enviar-embed") {
      await i.deferReply({ ephemeral: true });
      const channel = i.options.getChannel("canal", true);
      const productId = i.options.getString("produto", true);
      if (!channel.isTextBased() || channel.type !== ChannelType.GuildText) return i.editReply("Selecione um canal de texto do servidor.");
      const { data: product, error } = await db.from("products")
        .select("id,name,description,price,stock_quantity,is_active,image_url")
        .eq("id", productId).maybeSingle();
      if (error) throw error;
      if (!product || !product.is_active) return i.editReply("Produto não encontrado ou inativo. Confira /produtos.");
      const embed = new EmbedBuilder().setColor(0x6D3BC4).setTitle("🍎 CAPITAL FRUITS")
        .setDescription(`**${product.name}**\n${product.description || "Produto disponível na loja."}`)
        .addFields(
          { name: "Preço", value: `R$ ${Number(product.price).toFixed(2)}`, inline: true },
          { name: "Estoque", value: String(product.stock_quantity ?? 0), inline: true },
          { name: "Status", value: "Pagamento em configuração", inline: false }
        ).setFooter({ text: "Capital Fruits • Loja oficial" });
      if (product.image_url) embed.setImage(product.image_url);
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId("cf_payment_not_configured").setLabel("Pagamento em configuração")
        .setStyle(ButtonStyle.Secondary).setDisabled(true));
      await channel.send({ embeds: [embed], components: [row] });
      return i.editReply(`Embed de **${product.name}** enviado em ${channel}. O botão de pagamento ficará desativado até a integração Pix ser configurada.`);
    }

    if (name === "anunciar" || name === "say") {
      return i.reply({
        content: i.options.getString("texto"),
        allowedMentions: { parse: [] }
      });
    }

    if (name === "nuke") {
      return i.reply({
        ephemeral: true,
        content: "Esse comando está desativado para proteger canais e histórico."
      });
    }

    if (name === "lock" || name === "unlock") {
      if (!i.guild || !i.channel) {
        return i.reply({ ephemeral: true, content: "Use este comando em um servidor." });
      }
      const allow = name === "unlock" ? null : false;
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: allow });
      return i.reply({
        ephemeral: true,
        content: name === "lock" ? "Canal bloqueado para @everyone." : "Permissão de envio liberada conforme as permissões do canal."
      });
    }

    if (name === "perfil") {
      const { data, error } = await db
        .from("customers")
        .select("*")
        .eq("discord_user_id", i.user.id)
        .maybeSingle();
      if (error) throw error;
      return i.reply({
        ephemeral: true,
        content: data ? `Perfil: ${data.discord_username || i.user.username}` : "Você ainda não possui compras registradas."
      });
    }

    if (name === "gerar-pix") {
      return i.reply({
        ephemeral: true,
        content: "Os pagamentos estão temporariamente desativados. Nenhuma cobrança foi criada."
      });
    }

    if (name === "painel-vendas") {
      const { count, error } = await db.from("orders").select("*", { count: "exact", head: true });
      if (error) throw error;
      return i.reply({ ephemeral: true, content: `Pedidos registrados: ${count || 0}` });
    }

    if (name === "set") {
      const key = i.options.getString("chave", true);
      const value = i.options.getString("valor", true);
      const { error } = await db
        .from("store_settings")
        .upsert({ key, value: { value } }, { onConflict: "key" });
      if (error) throw error;
      return i.reply({ ephemeral: true, content: `Configuração "${key}" salva.` });
    }

    if (name === "setdono") {
      if (c.ownerId && i.user.id !== c.ownerId) {
        return i.reply({ ephemeral: true, content: "Somente o dono configurado pode usar este comando." });
      }
      const user = i.options.getUser("usuario", true);
      return i.reply({
        ephemeral: true,
        content: `Para definir ${user.tag} como dono, atualize BOT_OWNER_ID nas variáveis de ambiente e reinicie o bot.`
      });
    }

    if (name === "perms") {
      const user = i.options.getUser("usuario", true);
      const member = await i.guild.members.fetch(user.id);
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      return i.reply({
        ephemeral: true,
        content: `${user.tag}: ${isAdmin ? "Administrador do servidor" : "Sem permissão de administrador do servidor"}.`
      });
    }

    if (name === "delivery") {
      await i.deferReply({ ephemeral: true });
      const orderId = i.options.getString("pedido", true);
      const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) return i.editReply("Erro ao consultar pedido. Confira a tabela orders. Nenhum dado foi alterado.");
      if (!order) return i.editReply("Pedido não encontrado. Nenhum dado foi alterado.");
      const keys = [["status","Status"],["total","Total"],["amount","Valor"],["created_at","Criado em"],["customer_id","Cliente"],["product_id","Produto"]];
      const fields = keys.filter(([k]) => order[k] !== undefined && order[k] !== null)
        .map(([k,label]) => `**${label}:** ${String(order[k]).slice(0,180)}`);
      return i.editReply(
        `**Consulta de entrega — Capital Fruits**\nPedido: \`${orderId}\`\n` +
        (fields.length ? fields.join("\n") : "Pedido localizado; sem campos de resumo conhecidos.") +
        "\n\nEntrega continua manual. Este comando não altera status nem confirma pagamento."
      );
    }

    if (name === "aprovar") {
      return i.reply({ ephemeral: true, content: "A aprovação automática continua desativada. Confira o pagamento antes de qualquer entrega. Nenhum pedido foi alterado." });
    }
  } catch (err) {
    console.error(`Erro em /${name}:`, err);
    const msg = "Não foi possível concluir. Confira as configurações e os logs do servidor.";
    if (i.deferred || i.replied) return i.editReply(msg).catch(() => {});
    return i.reply({ ephemeral: true, content: msg }).catch(() => {});
  }
});

client.login(c.discordToken);
