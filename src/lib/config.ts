function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v.trim();
}

export const config = {
  klaviyoPrivateKey: mustGetEnv("KLAVIYO_PRIVATE_API_KEY"),
  klaviyoRevision: mustGetEnv("KLAVIYO_REVISION"),
  klaviyoApiBase: "https://a.klaviyo.com/api",
};
