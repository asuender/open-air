import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  NewAsset,
  NewDocument,
  NewProject,
  NewRequirement,
} from "./schema.ts";

const sampleDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../data/sample",
);

export function loadSampleAssets(): NewAsset[] {
  return sampleAssetSources.map(({ id, requirement, file }) => ({
    id,
    requirement,
    base64: readFileSync(join(sampleDir, file)).toString("base64"),
  }));
}

export const sampleAssetSources = [
  {
    id: "asset_001",
    requirement: "req_001",
    file: "auth-flow.svg",
  },
  {
    id: "asset_002",
    requirement: "req_002",
    file: "rbac-diagram.svg",
  },
  {
    id: "asset_003",
    requirement: "req_007",
    file: "offline-sync.svg",
  },
] as const;

export const sampleProjects: NewProject[] = [
  { id: "proj_alpha", name: "Alpha Platform" },
  { id: "proj_beta", name: "Beta Mobile App" },
];

export const sampleDocuments: NewDocument[] = [
  {
    id: "doc_alpha_srs",
    name: "Software Requirements Spec",
    project: "proj_alpha",
  },
  { id: "doc_alpha_api", name: "API Contract", project: "proj_alpha" },
  { id: "doc_beta_srs", name: "Mobile SRS", project: "proj_beta" },
];

export const sampleRequirements: NewRequirement[] = [
  {
    id: "req_001",
    level: "must",
    type: "technical",
    text: "The system shall authenticate users via email and password.",
    document: "doc_alpha_srs",
  },
  {
    id: "req_002",
    level: "must",
    type: "technical",
    text: "The system shall support role-based access control for admin and member roles.",
    document: "doc_alpha_srs",
  },
  {
    id: "req_003",
    level: "should",
    type: "non-technical",
    text: "The system should allow users to reset their password via email link.",
    document: "doc_alpha_srs",
  },
  {
    id: "req_004",
    level: "must",
    type: "technical",
    text: "All API endpoints shall return errors in a consistent JSON envelope.",
    document: "doc_alpha_api",
  },
  {
    id: "req_005",
    level: "should",
    type: "technical",
    text: "API responses should include a request correlation id header.",
    document: "doc_alpha_api",
  },
  {
    id: "req_006",
    level: "must",
    type: "technical",
    text: "The app shall work offline for previously loaded requirement lists.",
    document: "doc_beta_srs",
  },
  {
    id: "req_007",
    level: "should",
    type: "technical",
    text: "The app should sync pending edits when connectivity is restored.",
    document: "doc_beta_srs",
  },
  {
    id: "req_008",
    level: "info",
    type: "technical",
    text: "Explore push notification support for requirement status changes.",
    document: "doc_beta_srs",
  },
];
