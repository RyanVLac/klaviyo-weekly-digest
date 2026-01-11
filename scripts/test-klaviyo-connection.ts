import "dotenv/config";
import { config } from "../src/lib/config";

async function main() {
  const res = await fetch(`${config.klaviyoApiBase}/profiles?page[size]=1`, {
    headers: {
      Authorization: `Klaviyo-API-Key ${config.klaviyoPrivateKey}`,
      revision: config.klaviyoRevision,
      Accept: "application/json"
    }
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log(text);

  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
