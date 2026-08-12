import { StorageError } from "@storagesdk/core";

export type StorageErrorCode = StorageError["code"];

export type RepositoryErrorCode =
  | "Internal"
  | "NotFound"
  | "Conflict"
  | "Unauthorized"
  | "BadRequest"
  | "Aborted"
  | "NotSupported";

export class RepositoryError extends Error {
  code: RepositoryErrorCode;

  constructor(opts: { code: RepositoryErrorCode; message: string }) {
    super(opts.message);
    this.name = "RepositoryError";
    this.code = opts.code;
  }
}
