import { db } from "./index";
import { documents, projects, requirements } from "./schema";

async function seed() {
  // Clear in FK-safe order
  await db.delete(requirements);
  await db.delete(documents);
  await db.delete(projects);

  await db.insert(projects).values([
    { id: "proj_alpha", name: "Alpha Platform" },
    { id: "proj_beta", name: "Beta Mobile App" },
  ]);

  await db.insert(documents).values([
    {
      id: "doc_alpha_srs",
      name: "Software Requirements Spec",
      project: "proj_alpha",
    },
    { id: "doc_alpha_api", name: "API Contract", project: "proj_alpha" },
    { id: "doc_beta_srs", name: "Mobile SRS", project: "proj_beta" },
  ]);

  await db.insert(requirements).values([
    {
      id: "req_001",
      type: "must",
      text: "The system shall authenticate users via email and password.",
      document: "doc_alpha_srs",
    },
    {
      id: "req_002",
      type: "must",
      text: "The system shall support role-based access control for admin and member roles.",
      document: "doc_alpha_srs",
    },
    {
      id: "req_003",
      type: "should",
      text: "The system should allow users to reset their password via email link.",
      document: "doc_alpha_srs",
    },
    {
      id: "req_004",
      type: "must",
      text: "All API endpoints shall return errors in a consistent JSON envelope.",
      document: "doc_alpha_api",
    },
    {
      id: "req_005",
      type: "should",
      text: "API responses should include a request correlation id header.",
      document: "doc_alpha_api",
    },
    {
      id: "req_006",
      type: "must",
      text: "The app shall work offline for previously loaded requirement lists.",
      document: "doc_beta_srs",
    },
    {
      id: "req_007",
      type: "should",
      text: "The app should sync pending edits when connectivity is restored.",
      document: "doc_beta_srs",
    },
    {
      id: "req_008",
      type: "",
      text: "Explore push notification support for requirement status changes.",
      document: "doc_beta_srs",
    },
  ]);

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
