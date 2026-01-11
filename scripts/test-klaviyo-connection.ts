import "dotenv/config";
import { klaviyoFetchJson } from "../src/lib/klaviyo/client";

async function main() {
  const data = await klaviyoFetchJson<any>("/profiles?page[size]=1");
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
