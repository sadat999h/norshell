import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "./app";

// Source for the Vercel serverless function. This file is bundled by
// esbuild (see vercel.json's buildCommand) into a single self-contained
// api/index.js — Node's native ESM loader can't resolve extensionless
// relative imports across multiple files, so everything under server/*
// needs to end up in one bundled output rather than being deployed as
// separate .ts/.js files.
const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
