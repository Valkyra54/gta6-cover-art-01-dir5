// "Two for the Road" — Duo Sunset entry for make.fun gta6-cover-art-01.
// Node 22, standard library only. This program hands the entry in: it copies
// app/ and screenshots/ from beside this file into the output directory and
// writes /output/dossier.json with the kit's vendored buildDossier helper.
// Running it twice writes identical bytes. Outside the grader, the
// MAKEFUN_OUTPUT_DIR environment variable stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const target = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from an empty output directory so a second run cannot leave stale
// files behind and both runs write the same bytes.
if (!existsSync(join(repoRoot, 'app'))) {
  throw new Error(`no app/ folder beside main.ts (looked in ${repoRoot})`);
}
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(join(repoRoot, 'app'), join(target, 'app'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(target, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in app/ or 48 MiB of app files in all,
// or a path under app/ over 1000 bytes).
const dossier = buildDossier(target, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(target, 'dossier.json'), dossier);
