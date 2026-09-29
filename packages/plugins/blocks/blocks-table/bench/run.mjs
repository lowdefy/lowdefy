/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/*
  `pnpm bench`: builds the package, measures the lazy Table chunk, runs the Playwright bench suite
  (bench/tests/*.bench.js) and writes bench/results/report.json and report.md with each D10
  budget next to the measured value.

  Usage: pnpm bench [playwright test filters...]   (`pnpm bench --chunk`: the chunk measurement only)
  Environment: LOWDEFY_BENCH_PORT (default 3116).
*/

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
// vite ships an exports map only, which the import plugin's node resolver cannot read.
// eslint-disable-next-line import/no-unresolved
import { build } from 'vite';

const benchDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.dirname(benchDir);
const resultsDir = path.join(benchDir, 'results');
const rawDir = path.join(resultsDir, 'raw');

function run(command, args) {
  execFileSync(command, args, { cwd: packageDir, stdio: 'inherit' });
}

function readRaw(name) {
  const file = path.join(rawDir, `${name}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function toKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

// A module's group in the breakdown: the npm package, or the package's own folder
// (`features/<name>`, `core`, `blocks/<Block>`).
function moduleGroup(id) {
  const nodeModules = id.lastIndexOf('node_modules/');
  if (nodeModules >= 0) {
    const parts = id.slice(nodeModules + 'node_modules/'.length).split('/');
    return parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  }
  const parts = path.relative(path.join(packageDir, 'dist'), id).split(path.sep);
  return parts[0] === 'features' || parts[0] === 'blocks' ? parts.slice(0, 2).join('/') : parts[0];
}

// Rendered bytes (before minification) per module group of a chunk, largest first. Not
// gzipped: modules share one gzip dictionary in the chunk, so per-module gzip sizes do not add up.
function breakDown(chunk) {
  const groups = new Map();
  Object.entries(chunk.modules).forEach(([id, info]) => {
    const group = moduleGroup(id);
    groups.set(group, (groups.get(group) ?? 0) + (info.renderedLength ?? info.code?.length ?? 0));
  });
  return [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([group, bytes]) => ({ group, kb: toKb(bytes) }));
}

// The lazy implementation chunk as a Lowdefy page would load it: TanStack and the table code
// counted; React, antd, dayjs and the @lowdefy packages shared with the page and excluded (D10
// budget). The main chunk is what the first mount loads; the others load on demand (optional
// features by config, popovers and editors on first use).
async function measureChunk() {
  const outDir = path.join(resultsDir, 'chunk');
  const result = await build({
    configFile: false,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir,
      emptyOutDir: true,
      minify: true,
      lib: {
        entry: path.join(packageDir, 'dist/blocks/Table/Table.lazy.js'),
        formats: ['es'],
        fileName: 'table',
      },
      rolldownOptions: {
        external: (id) =>
          /^(react|react-dom|antd|dayjs)(\/|$)/.test(id) || id.startsWith('@lowdefy/'),
      },
    },
  });
  const output = (Array.isArray(result) ? result : [result]).flatMap((entry) => entry.output);
  const chunks = output.filter((file) => file.type === 'chunk');
  const byFileName = new Map(chunks.map((file) => [file.fileName, file]));
  // The first mount loads the entry and every chunk it imports statically (modules the entry
  // shares with on-demand chunks are split out into those); the rest load on demand.
  const initial = new Set();
  const visit = (file) => {
    if (initial.has(file)) return;
    initial.add(file);
    file.imports.forEach((name) => byFileName.has(name) && visit(byFileName.get(name)));
  };
  visit(byFileName.get('table.js'));
  const main = {
    code: [...initial].map((file) => file.code).join('\n'),
    modules: Object.assign({}, ...[...initial].map((file) => file.modules)),
  };
  const css = output
    .filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
    .map((file) => Buffer.from(file.source));
  const gzipKb = (code) => toKb(zlib.gzipSync(code).length);
  return {
    jsKb: toKb(Buffer.byteLength(main.code)),
    jsGzipKb: gzipKb(main.code),
    cssGzipKb: gzipKb(Buffer.concat(css)),
    breakdown: breakDown(main),
    initialChunks: initial.size,
    lazyChunks: chunks
      .filter((file) => !initial.has(file))
      .map((file) => ({
        name: file.name,
        kb: toKb(Buffer.byteLength(file.code)),
        gzipKb: gzipKb(file.code),
      }))
      .sort((a, b) => b.gzipKb - a.gzipKb),
  };
}

// What a page with a Table or a TableLight loads for the block beyond React, antd and dayjs: the
// block's code with the shared column core (`@lowdefy/blocks-antd/table`) and the template
// compiler (`@lowdefy/nunjucks`) counted, which the chunk measurement above treats as shared.
// The compiler loads on demand, only for tables whose config uses a template.
async function measureTemplateCost() {
  const entries = [
    { block: 'Table', entry: path.join(packageDir, 'dist/blocks/Table/Table.lazy.js') },
    {
      block: 'TableLight',
      entry: path.join(packageDir, '../blocks-antd/dist/blocks/TableLight/TableLight.js'),
    },
  ];
  const results = [];
  for (const { block, entry } of entries) {
    const result = await build({
      configFile: false,
      logLevel: 'error',
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      build: {
        outDir: path.join(resultsDir, 'template-cost', block),
        emptyOutDir: true,
        minify: true,
        lib: { entry, formats: ['es'], fileName: 'entry' },
        rolldownOptions: {
          external: (id) =>
            /^(react|react-dom|antd|dayjs)(\/|$)/.test(id) ||
            (id.startsWith('@lowdefy/') &&
              !id.startsWith('@lowdefy/nunjucks') &&
              !id.startsWith('@lowdefy/blocks-antd/table')),
        },
      },
    });
    const chunks = (Array.isArray(result) ? result : [result])
      .flatMap((item) => item.output)
      .filter((file) => file.type === 'chunk');
    const byFileName = new Map(chunks.map((file) => [file.fileName, file]));
    const initial = new Set();
    const visit = (file) => {
      if (initial.has(file)) return;
      initial.add(file);
      file.imports.forEach((name) => byFileName.has(name) && visit(byFileName.get(name)));
    };
    visit(byFileName.get('entry.js'));
    const hasNunjucks = (file) => Object.keys(file.modules).some((id) => id.includes('nunjucks'));
    const templateChunk = chunks.find((file) => !initial.has(file) && hasNunjucks(file));
    results.push({
      block,
      mainGzipKb: toKb(zlib.gzipSync([...initial].map((file) => file.code).join('\n')).length),
      templatesInMain: [...initial].some(hasNunjucks),
      templateChunkGzipKb: templateChunk ? toKb(zlib.gzipSync(templateChunk.code).length) : null,
    });
  }
  return results;
}

function check(value, budget, compare = (a, b) => a <= b) {
  if (value === null || value === undefined) return 'not run';
  return compare(value, budget) ? 'met' : 'MISSED';
}

function statusOf(met) {
  return met ? 'met' : 'MISSED';
}

function buildRows({ chunk, templateCost }) {
  const rows = [];
  const scroll = (strategy, scenario) => readRaw(`scroll-${strategy}-${scenario}`);
  ['translated', 'positioned'].forEach((strategy) => {
    const idle = scroll(strategy, 'idle');
    ['wheel-slow', 'wheel-fast', 'wheel-horizontal', 'programmatic-3000'].forEach((scenario) => {
      const result = scroll(strategy, scenario);
      if (!result) return;
      rows.push({
        scenario: `Scroll 100k x 50, ${scenario} (${strategy})`,
        budget: 'p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms, 0 long tasks',
        measured: `p50 ${result.p50} / p95 ${result.p95} / p99 ${result.p99} ms (idle p95 ${
          idle?.p95 ?? '?'
        }), ${result.longTasks} long tasks, ${result.mainThreadMsPerFrame} ms main thread/frame, ${
          result.reactCommits
        } commits (max ${result.reactMaxCommitMs} ms), ${result.domNodes} nodes${
          result.blankPercent === undefined ? '' : `, blank ${result.blankPercent}%`
        }`,
        status:
          result.p95 <= Math.max(16.7, (idle?.p95 ?? 16.7) + 1) &&
          result.p99 <= 33 &&
          result.longTasks === 0 &&
          (result.blankPercent ?? 0) < 1
            ? 'met'
            : 'MISSED',
      });
    });
    const throttled = scroll(strategy, 'wheel-fast-cpu4x');
    if (throttled) {
      rows.push({
        scenario: `Scroll 100k x 50 at 4x CPU throttle (${strategy})`,
        budget: '>= 30 fps sustained',
        measured: `${throttled.fps} fps, p99 ${throttled.p99} ms, max ${throttled.max} ms, ${throttled.mainThreadMsPerFrame} ms main thread/frame`,
        status: check(throttled.fps, 30, (a, b) => a >= b),
      });
    }
  });
  [10, 50].forEach((cols) => {
    ['wheel-fast', 'programmatic-3000', 'programmatic-3000-cpu4x'].forEach((scenario) => {
      const result = readRaw(`scroll-wrap-${cols}-${scenario}`);
      if (!result) return;
      rows.push({
        scenario: `Scroll 100k x ${cols} with wrapped rows, ${scenario}`,
        budget: result.throttle > 1 ? '>= 30 fps sustained' : 'p99 <= 33 ms, 0 long tasks',
        measured: `${result.fps} fps, p95 ${result.p95} / p99 ${result.p99} ms, ${result.longTasks} long tasks, ${result.mainThreadMsPerFrame} ms main thread/frame, ${result.reactMsPerCommit} ms per commit (${result.reactCommits} commits)`,
        status:
          result.throttle > 1
            ? check(result.fps, 30, (a, b) => a >= b)
            : statusOf(result.p99 <= 33 && result.longTasks === 0),
      });
    });
  });
  [
    ['number', 50],
    ['text', 150],
  ].forEach(([kind, budget]) => {
    const result = readRaw(`sort-100k-${kind}`);
    if (!result) return;
    rows.push({
      scenario: `Sort 100k (${kind})`,
      budget: `<= ${budget} ms main-thread blocking; INP <= 100 ms`,
      measured: `longest task ${result.coldLongestTaskMs || '< 50'} ms, sort render ${
        result.coldMaxCommitMs
      } ms, INP ${result.coldInpMs} ms, click to sorted paint ${
        result.coldClickToPaintMs
      } ms (toggle: ${result.warmClickToPaintMs} ms), keys ${result.sortKeysMs} ms`,
      status:
        Math.max(result.coldLongestTaskMs, result.coldMaxCommitMs) <= budget &&
        result.coldInpMs <= 100
          ? 'met'
          : 'MISSED',
    });
  });
  ['tag-6-groups', 'text-8-groups', 'text-100k-groups'].forEach((kind) => {
    const result = readRaw(`group-100k-${kind}`);
    if (!result) return;
    rows.push({
      scenario: `Group by one column 100k (${kind})`,
      budget: '<= 150 ms main-thread blocking',
      measured: `longest task ${result.groupLongestTaskMs || '< 50'} ms, group render ${
        result.groupMaxCommitMs
      } ms, call to grouped paint ${result.groupCallToPaintMs} ms; collapse all ${
        result.collapseMaxCommitMs
      } ms, expand all ${result.expandMaxCommitMs} ms render`,
      status: statusOf(Math.max(result.groupLongestTaskMs, result.groupMaxCommitMs) <= 150),
    });
  });
  ['tag', 'number', 'text', 'nested', 'sorted-text'].forEach((name) => {
    const result = readRaw(`filter-100k-${name}`);
    if (!result) return;
    const microMs = result.filterMs === undefined ? '' : `, row test alone ${result.filterMs} ms`;
    rows.push({
      scenario: `Filter 100k (${name})`,
      budget: '<= 50 ms main-thread blocking',
      measured: `longest task ${result.apply.longestTaskMs || '< 50'} ms, filter render ${
        result.apply.maxCommitMs
      } ms, call to filtered paint ${result.apply.callToPaintMs} ms${microMs}`,
      status: statusOf(Math.max(result.apply.longestTaskMs, result.apply.maxCommitMs) <= 50),
    });
  });
  const search = readRaw('filter-100k-search');
  if (search) {
    rows.push({
      scenario: 'Search 100k x 50 (first, then narrowed)',
      budget: '<= 50 ms main-thread blocking',
      measured: `first: longest task ${search.cold.longestTaskMs || '< 50'} ms, render ${
        search.cold.maxCommitMs
      } ms, call to paint ${search.cold.callToPaintMs} ms; narrowed: longest task ${
        search.warm.longestTaskMs || '< 50'
      } ms, call to paint ${search.warm.callToPaintMs} ms`,
      status: statusOf(
        Math.max(search.cold.longestTaskMs, search.cold.maxCommitMs, search.warm.longestTaskMs) <=
          50
      ),
    });
  }
  [
    [1000, 10, null],
    [10000, 20, 300],
    [100000, 50, 800],
  ].forEach(([rowCount, cols, budget]) => {
    const result = readRaw(`initial-render-${rowCount}x${cols}`);
    if (!result) return;
    rows.push({
      scenario: `First render ${rowCount} x ${cols}`,
      budget: budget ? `< ${budget} ms scripting, <= 3,000 nodes` : 'reference',
      measured: `${result.commitMs} ms render+commit, ${result.taskMs} ms main-thread task time, ${result.domNodes} nodes, heap ${result.heapMb} MB (data included)`,
      status: budget ? statusOf(result.taskMs <= budget && result.domNodes <= 3000) : 'reference',
    });
  });
  const resize = readRaw('resize-drag');
  if (resize) {
    rows.push({
      scenario: 'Column resize drag (120 moves)',
      budget: '60 fps, 0 body commits per frame',
      measured: `${resize.fps} fps, p95 ${resize.p95} ms, body renders during drag ${resize.duringDrag.body}, row renders ${resize.duringDrag.rows}, setValue ${resize.duringDrag.setValue}; after pointerup setValue ${resize.afterPointerUp.setValue}`,
      status:
        resize.fps >= 59 && resize.duringDrag.body === 0 && resize.duringDrag.rows === 0
          ? 'met'
          : 'MISSED',
    });
  }
  const update = readRaw('row-update');
  if (update) {
    rows.push({
      scenario: 'Update 1 row of 100k',
      budget: '<= 5 ms, exactly 1 row re-rendered',
      measured: `${update.commitMs} ms render+commit (React ${update.reactRenderMs} ms), ${update.rowsRendered} row re-rendered`,
      status: update.commitMs <= 5 && update.rowsRendered === 1 ? 'met' : 'MISSED',
    });
  }
  const memory = readRaw('memory-leak');
  if (memory) {
    rows.push({
      scenario: '60 s scroll, forced GC',
      budget: 'heap growth < 5%',
      measured: `${memory.heapBeforeMb} MB -> ${memory.heapAfterMb} MB (${memory.growthPercent}%)`,
      status: check(memory.growthPercent, 5, (a, b) => a < b),
    });
  }
  rows.push({
    scenario: 'Block chunk (Table.lazy + TanStack, antd/React/@lowdefy shared)',
    budget: '<= 60 kB gzip main chunk (D10: 80 kB)',
    measured: `${chunk.jsGzipKb} kB gzip JS (${chunk.jsKb} kB min, ${chunk.initialChunks} files), ${
      chunk.cssGzipKb
    } kB gzip CSS; ${chunk.lazyChunks.length} on-demand chunks, ${toKb(
      chunk.lazyChunks.reduce((sum, file) => sum + file.gzipKb * 1024, 0)
    )} kB gzip`,
    status: check(chunk.jsGzipKb, 60),
  });
  templateCost.forEach(({ block, mainGzipKb, templatesInMain, templateChunkGzipKb }) => {
    rows.push({
      scenario: `${block} page cost (shared column core and template compiler counted)`,
      budget: 'template compiler on demand',
      measured: `${mainGzipKb} kB gzip on first mount; template compiler ${
        templatesInMain ? 'in it' : `on demand (${templateChunkGzipKb} kB gzip)`
      }`,
      status: statusOf(!templatesInMain),
    });
  });
  ['wheel-fast', 'programmatic-3000', 'wheel-fast-cpu4x'].forEach((scenario) => {
    const result = readRaw(`server-scroll-${scenario}`);
    if (!result) return;
    const throttled = result.throttle > 1;
    rows.push({
      scenario: `Server-mode scroll 100k x 50, ${scenario} (skeleton rows while blocks load)`,
      budget: throttled
        ? '>= 30 fps sustained'
        : 'p95 <= 16.7 ms (idle floor + 1 ms), p99 <= 33 ms',
      measured: `p50 ${result.p50} / p95 ${result.p95} / p99 ${result.p99} ms, ${result.fps} fps, ${result.longTasks} long tasks, skeleton rows on screen in ${result.skeletonFramesPercent}% of frames`,
      status: throttled ? check(result.fps, 30, (a, b) => a >= b) : check(result.p99, 33),
    });
  });
  return rows;
}

function toMarkdown({ chunk, rows, machine }) {
  const lines = [
    '# Table bench report',
    '',
    `Machine: ${machine.cpu} (${machine.cores} cores), ${machine.memoryGb} GB, ${machine.platform}, Node ${machine.node}. Chromium headless, 1440x900, DPR 1.`,
    '',
    '| Scenario | Budget | Measured | Status |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.scenario} | ${row.budget} | ${row.measured} | ${row.status} |`),
    '',
    `## Main chunk by module group (kB of rendered code before minification)`,
    '',
    '| Group | kB |',
    '| --- | --- |',
    ...chunk.breakdown.slice(0, 20).map(({ group, kb }) => `| ${group} | ${kb} |`),
    '',
    '## On-demand chunks',
    '',
    '| Chunk | kB min | kB gzip |',
    '| --- | --- | --- |',
    ...chunk.lazyChunks.map(({ name, kb, gzipKb }) => `| ${name} | ${kb} | ${gzipKb} |`),
    '',
  ];
  return lines.join('\n');
}

async function main() {
  fs.rmSync(rawDir, { recursive: true, force: true });
  run('pnpm', ['build']);
  const chunk = await measureChunk();
  const templateCost = await measureTemplateCost();
  const filters = process.argv.slice(2);
  // `pnpm bench --chunk` measures the chunk only.
  const chunkOnly = filters.includes('--chunk');
  if (!chunkOnly) {
    run('npx', ['playwright', 'test', '--config', 'bench/playwright.config.mjs', ...filters]);
  }
  const machine = {
    cpu: os.cpus()[0]?.model ?? 'unknown',
    cores: os.cpus().length,
    memoryGb: Math.round(os.totalmem() / 1073741824),
    platform: `${os.platform()} ${os.release()}`,
    node: process.version,
  };
  const rows = buildRows({ chunk, templateCost });
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(
    path.join(resultsDir, 'report.json'),
    JSON.stringify(
      { machine, chunk, templateCost, rows, generatedAt: new Date().toISOString() },
      null,
      2
    )
  );
  fs.writeFileSync(path.join(resultsDir, 'report.md'), toMarkdown({ chunk, rows, machine }));
  process.stdout.write(`\n${toMarkdown({ chunk, rows, machine })}`);
}

main();
