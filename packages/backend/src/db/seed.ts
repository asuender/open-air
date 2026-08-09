import { pathToFileURL } from "node:url";
import { db as defaultDb } from "./index.ts";
import {
  loadSampleAssets,
  sampleDocuments,
  sampleProjects,
  sampleRequirements,
} from "./sample-data.ts";
import { assets, documents, projects, requirements } from "./schema.ts";

type Db = typeof defaultDb;

export async function seed(db: Db) {
  // Clear in FK-safe order
  await db.delete(assets);
  await db.delete(requirements);
  await db.delete(documents);
  await db.delete(projects);

  await db.insert(projects).values(sampleProjects);
  await db.insert(documents).values(sampleDocuments);
  await db.insert(requirements).values(sampleRequirements);
  await db.insert(assets).values(loadSampleAssets());
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  seed(defaultDb).catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
