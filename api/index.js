// Placeholder committed to git so Vercel's Functions detection recognizes
// /api as a serverless function *before* the build runs. The actual build
// command (see vercel.json) overwrites this file with the real bundled
// Express app (esbuild server/_core/serverless.ts -> api/index.js) as part
// of every deploy — this content never runs in production.
export default function handler(req, res) {
  res.statusCode = 500;
  res.end("norshell: build did not overwrite this placeholder function");
}
