import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

const distDirectory = resolve('dist');
const entries = await readdir(distDirectory, { withFileTypes: true });
const configPaths = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const configPath = resolve(distDirectory, entry.name, 'wrangler.json');
  try {
    await access(configPath);
    configPaths.push(configPath);
  } catch {
    // This output directory does not contain Flue's generated Wrangler config.
  }
}

if (configPaths.length !== 1) {
  throw new Error(`Expected one generated Wrangler config, found ${configPaths.length}.`);
}

const configPath = configPaths[0];
const config = JSON.parse(await readFile(configPath, 'utf8'));

config.assets = {
  directory: relative(dirname(configPath), resolve('dist/client')) || '.',
  not_found_handling: 'single-page-application',
  run_worker_first: ['/api/*', '/health'],
};

await writeFile(configPath, `${JSON.stringify(config)}\n`);
