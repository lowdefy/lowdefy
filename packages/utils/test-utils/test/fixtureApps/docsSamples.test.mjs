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

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterEach, expect, test } from 'vitest';

import copyFixtureApp from './copyFixtureApp.mjs';
import fixtureApps, { repositoryRoot } from './fixtureApps.mjs';

// The code samples of the user docs page on endpoint tests (packages/docs/testing/endpoint-tests.md)
// run here as an app would run them, against a build of apps/journey-fixture: the page is read,
// not copied, so a sample that stops working fails this suite. The page keeps to these rules:
// - A `js` sample that calls openTestApp is a whole test file, and its first line is a comment
//   with its path. Every other `js` sample belongs to the file before it.
// - A `yaml` sample starts with a comment naming a file of apps/journey-fixture, and matches it.
// - The `json` sample holds the script an app runs, and the `bash` sample the snapshot command.

const execFileAsync = promisify(execFile);

const pagePath = path.join(repositoryRoot, 'packages/docs/testing/endpoint-tests.md');
const packageDirectory = path.resolve(import.meta.dirname, '../..');
const buildStep = 'lowdefy build --no-client-build && ';

const copies = [];

function readSamples() {
  const page = fs.readFileSync(pagePath, 'utf8');
  return [...page.matchAll(/^```(\w+)\n([\s\S]*?)^```$/gm)].map(([, language, code]) => ({
    language,
    code,
  }));
}

// The test files of the page: each whole file, with the samples that follow it added to it.
function readTestFiles({ samples }) {
  const files = [];
  samples
    .filter(({ language }) => language === 'js')
    .forEach(({ code }) => {
      if (!code.includes('openTestApp(')) {
        files.at(-1).code += `\n${code}`;
        return;
      }
      const [, filePath] = code.match(/^\/\/ (tests\/endpoints\/\S+\.test\.mjs)\n/) ?? [];
      files.push({ filePath, code });
    });
  return files;
}

// Config and data set lines, without comments and blank lines.
function readLines(text) {
  return text.split('\n').filter((line) => line.trim() !== '' && !line.trim().startsWith('#'));
}

// A command of the page as arguments for this Node: `node --test 'a/**/*.mjs'`.
function readNodeArguments(command) {
  const [executable, ...args] = command
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/^'(.*)'$/, '$1'));
  expect(executable).toEqual('node');
  return args;
}

// The copied app as an app developer has it: the build where `lowdefy build` writes it, and
// @lowdefy/test-utils installed, so the samples run unchanged from the config directory.
function copyApp() {
  const copy = copyFixtureApp({ app: fixtureApps.journeyFixture });
  copies.push(copy);
  const { configDirectory, serverDirectory } = copy;
  fs.mkdirSync(path.join(configDirectory, '.lowdefy'));
  fs.symlinkSync(serverDirectory, path.join(configDirectory, '.lowdefy', 'server'), 'dir');
  fs.mkdirSync(path.join(configDirectory, 'node_modules', '@lowdefy'), { recursive: true });
  fs.symlinkSync(
    packageDirectory,
    path.join(configDirectory, 'node_modules', '@lowdefy', 'test-utils'),
    'dir'
  );
  return copy;
}

async function runNode({ args, configDirectory }) {
  try {
    const { stdout } = await execFileAsync(process.execPath, args, { cwd: configDirectory });
    return stdout;
  } catch (error) {
    throw new Error(`node ${args.join(' ')} failed.\n${error.stdout}\n${error.stderr}`);
  }
}

afterEach(() => {
  copies.splice(0).forEach((copy) => copy.remove());
});

test('every yaml sample on the endpoint tests page matches the file of apps/journey-fixture it names', () => {
  const samples = readSamples().filter(({ language }) => language === 'yaml');
  expect(samples.length).toBeGreaterThan(0);
  samples.forEach(({ code }) => {
    const [, filePath] = code.match(/^# (\S+\.yaml)\n/) ?? [];
    expect(filePath, `A yaml sample names no file:\n${code}`).toBeDefined();
    const appFile = fs.readFileSync(
      path.join(fixtureApps.journeyFixture.configDirectory, filePath),
      'utf8'
    );
    expect(readLines(code), filePath).toEqual(readLines(appFile));
  });
});

test('every js sample on the endpoint tests page passes under the script the page gives an app', async () => {
  const samples = readSamples();
  const testFiles = readTestFiles({ samples });
  const { configDirectory } = copyApp();
  testFiles.forEach(({ code, filePath }) => {
    expect(filePath, `A test file sample names no path:\n${code}`).toBeDefined();
    const target = path.join(configDirectory, filePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, code);
  });

  // The snapshot of the access table is written once, by the command the page gives.
  const [snapshotCommand] = samples.filter(({ language }) => language === 'bash');
  const snapshotArgs = readNodeArguments(snapshotCommand.code);
  const snapshotPath = path.join(configDirectory, `${snapshotArgs.at(-1)}.snapshot`);
  await runNode({ args: snapshotArgs, configDirectory });
  const snapshot = fs.readFileSync(snapshotPath, 'utf8');
  expect(snapshot).toContain('"auditor_only"');
  expect(snapshot).toContain('"member": "deny"');

  // The script without its build step: the global setup has built the app.
  const [scripts] = samples.filter(({ language }) => language === 'json');
  const script = JSON.parse(scripts.code).scripts['test:endpoints'];
  expect(script.startsWith(buildStep)).toBe(true);
  const output = await runNode({
    args: readNodeArguments(script.slice(buildStep.length)),
    configDirectory,
  });

  const testCount = testFiles
    .map(({ code }) => code.match(/^test\(/gm).length)
    .reduce((sum, count) => sum + count, 0);
  expect(testFiles.length).toEqual(2);
  expect(testCount).toBeGreaterThan(8);
  expect(output).toMatch(new RegExp(`pass ${testCount}\\b`));
  expect(output).toMatch(/fail 0\b/);
  // The second run compared the table with the snapshot and left it as written.
  expect(fs.readFileSync(snapshotPath, 'utf8')).toEqual(snapshot);
});
