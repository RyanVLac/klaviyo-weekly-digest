function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v.trim();
}

function getEnvOptional(name: string): string | null {
  const v = process.env[name];
  if (!v || !v.trim()) return null;
  return v.trim();
}

export const config = {
  klaviyoPrivateKey: mustGetEnv("KLAVIYO_PRIVATE_API_KEY"),
  klaviyoRevision: mustGetEnv("KLAVIYO_REVISION"),
  klaviyoApiBase: "https://a.klaviyo.com/api",

  
  openaiApiKey: getEnvOptional("OPENAI_API_KEY"),
  openaiModel: getEnvOptional("OPENAI_MODEL") ?? "gpt-4o-mini",
};
