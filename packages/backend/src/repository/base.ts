import type { Storage } from "@storagesdk/core";

import type { db as database } from "../db/drizzle.ts";

export abstract class DatabaseRepository {
  db: typeof database;

  constructor(db: typeof database) {
    this.db = db;
  }
}

export abstract class StorageRepository {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }
}
