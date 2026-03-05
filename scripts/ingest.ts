import { runIngestion } from "../apps/web/lib/ingest";

async function main() {
  const inserted = await runIngestion();
  console.log(`Ingest complete. Inserted ${inserted} new events.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
