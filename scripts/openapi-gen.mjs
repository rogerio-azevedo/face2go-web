#!/usr/bin/env node
/**
 * Gera tipos TypeScript a partir do OpenAPI do backend NestJS.
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const serverRoot = join(root, '../face2go-server');
const outDir = join(root, 'src/types');
const outFile = join(outDir, 'api.generated.ts');
const specFile = join(root, 'openapi.json');
const serverSpecFile = join(serverRoot, 'openapi.json');

async function fetchSpec(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao buscar OpenAPI (${res.status}): ${url}`);
  }
  return res.json();
}

function tryGenerateFromBackend() {
  if (!existsSync(join(serverRoot, 'package.json'))) {
    return false;
  }
  console.log('Gerando openapi.json no backend (pnpm openapi:generate)...');
  execSync('pnpm openapi:generate', {
    cwd: serverRoot,
    stdio: 'inherit',
  });
  return existsSync(serverSpecFile);
}

async function resolveSpecFile() {
  if (process.env.OPENAPI_URL) {
    const spec = await fetchSpec(process.env.OPENAPI_URL);
    writeFileSync(specFile, JSON.stringify(spec, null, 2));
    console.log(`OpenAPI salvo em ${specFile}`);
    return specFile;
  }

  const input = process.env.OPENAPI_INPUT;
  if (input && existsSync(input)) {
    copyFileSync(input, specFile);
    console.log(`OpenAPI copiado de ${input}`);
    return specFile;
  }

  if (existsSync(serverSpecFile)) {
    copyFileSync(serverSpecFile, specFile);
    console.log(`OpenAPI copiado de ${serverSpecFile}`);
    return specFile;
  }

  if (existsSync(specFile)) {
    console.log(`Usando OpenAPI existente em ${specFile}`);
    return specFile;
  }

  if (tryGenerateFromBackend()) {
    copyFileSync(serverSpecFile, specFile);
    console.log(`OpenAPI copiado de ${serverSpecFile}`);
    return specFile;
  }

  console.error(`
Nenhum OpenAPI encontrado. Opções:

  1) Gerar offline (recomendado):
     cd ../face2go-server && pnpm openapi:generate
     cd ../face2go-web && pnpm openapi:gen

  2) Com backend rodando:
     OPENAPI_URL=http://localhost:6200/api/docs-json pnpm openapi:gen
`);
  process.exit(1);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const resolvedSpec = await resolveSpecFile();

  execSync(
    `pnpm exec openapi-typescript "${resolvedSpec}" -o "${outFile}"`,
    { stdio: 'inherit', cwd: root },
  );
  console.log(`Tipos gerados em ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
