require("dotenv").config();

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
};

module.exports = {
  discordToken: required("DISCORD_TOKEN"),
  clientId: required("DISCORD_CLIENT_ID"),
  guildId: process.env.DISCORD_GUILD_ID || "",
  ownerId: process.env.BOT_OWNER_ID || "",
  supabaseUrl: required("SUPABASE_URL"),
  supabaseKey: required("SUPABASE_SERVICE_ROLE_KEY")
};
