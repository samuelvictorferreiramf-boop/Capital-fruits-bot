const { createClient } = require("@supabase/supabase-js");
const c = require("./config");

const supabase = createClient(c.supabaseUrl, c.supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

module.exports = supabase;
