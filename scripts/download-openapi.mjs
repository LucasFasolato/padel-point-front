import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_URL = 'http://localhost:3000/docs-json';
const backendOpenApiUrl = process.env.BACKEND_OPENAPI_URL ?? DEFAULT_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.join(repoRoot, 'src', 'api', 'openapi.json');

async function downloadOpenApi() {
  const response = await fetch(backendOpenApiUrl, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download OpenAPI from ${backendOpenApiUrl} (${response.status} ${response.statusText})`
    );
  }

  const json = await response.json();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

  console.log(`Saved OpenAPI spec to ${path.relative(repoRoot, outputPath)}`);
}

downloadOpenApi().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
