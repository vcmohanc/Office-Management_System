import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import zstd from '@skhaz/zstd';

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);
const zstdCompress = zstd.compress;

const extensionsToCompress = new Set(['.js', '.css', '.html', '.svg', '.json', '.wasm']);
const distPath = path.resolve('dist');

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      if (extensionsToCompress.has(ext)) {
        console.log(`Compressing ${fullPath}...`);
        const data = await fs.readFile(fullPath);
        
        // zstd -19 (max)
        const zstdData = await zstdCompress(data, 19);
        await fs.writeFile(`${fullPath}.zst`, zstdData);
        
        // brotli 11 (max)
        const brData = await brotli(data, {
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
        });
        await fs.writeFile(`${fullPath}.br`, brData);
        
        // gzip 9 (max)
        const gzData = await gzip(data, { level: 9 });
        await fs.writeFile(`${fullPath}.gz`, gzData);
      }
    }
  }
}

async function main() {
  if (!fsSync.existsSync(distPath)) {
    console.error(`Dist directory ${distPath} does not exist`);
    process.exit(1);
  }
  await processDirectory(distPath);
  console.log('Compression complete.');
}

main().catch(console.error);
