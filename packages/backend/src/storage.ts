import { fs } from "@storagesdk/adapters/fs";
import { Storage } from "@storagesdk/core";

export const storage = new Storage({
  adapter: fs({ root: "./data/storage", folder: "local" }),
});
