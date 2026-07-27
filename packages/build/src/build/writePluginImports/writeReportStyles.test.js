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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

import writeReportStyles from './writeReportStyles.js';

// A real Tailwind compile — the artifact's value is the CSS it contains, so
// mocking the compiler would test nothing. Content files and public/styles.css
// are read from disk, so each test gets a throwaway app directory.
let configDirectory;

function createContext() {
  return {
    directories: {
      config: configDirectory,
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
      server: path.join(configDirectory, '.lowdefy', 'server'),
    },
    writeBuildArtifact: jest.fn(),
  };
}

function writePageContent(pageId, content) {
  const contentDirectory = path.join(
    configDirectory,
    '.lowdefy',
    'server',
    'lowdefy-build',
    'tailwind'
  );
  fs.mkdirSync(contentDirectory, { recursive: true });
  fs.writeFileSync(path.join(contentDirectory, `${pageId}.html`), content);
}

function writeUserStyles(content) {
  fs.mkdirSync(path.join(configDirectory, 'public'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'public', 'styles.css'), content);
}

// The theme artifact writeTheme leaves in the build directory, which is where
// the app's own Tailwind tokens are read from.
function writeTheme(theme) {
  const buildDirectory = path.join(configDirectory, '.lowdefy', 'server', 'build');
  fs.mkdirSync(buildDirectory, { recursive: true });
  fs.writeFileSync(path.join(buildDirectory, 'theme.json'), JSON.stringify(theme));
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-report-styles-'));
  fs.mkdirSync(path.join(configDirectory, '.lowdefy', 'server'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('writeReportStyles compiles utilities used in page content', async () => {
  writePageContent('home', '<div class="flex flex-col p-4">Report</div>');
  const context = createContext();

  await writeReportStyles({ context });

  const [filePath, css] = context.writeBuildArtifact.mock.calls[0];
  expect(filePath).toBe('reports/styles.css');
  expect(css).toContain('.flex {');
  expect(css).toContain('.flex-col {');
  expect(css).toContain('.p-4 {');
});

test('writeReportStyles does not compile utilities that are not used', async () => {
  writePageContent('home', '<div class="flex">Report</div>');
  const context = createContext();

  await writeReportStyles({ context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('.flex {');
  expect(css).not.toContain('.grid {');
});

test('writeReportStyles includes rules from public/styles.css', async () => {
  writePageContent('home', '<span class="secondary">Report</span>');
  writeUserStyles('.secondary { color: #8c8c8c; }');
  const context = createContext();

  await writeReportStyles({ context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('.secondary');
  expect(css).toContain('#8c8c8c');
});

test('writeReportStyles omits public/styles.css when the file does not exist', async () => {
  writePageContent('home', '<span class="secondary">Report</span>');
  const context = createContext();

  await writeReportStyles({ context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).not.toContain('.secondary');
});

test('writeReportStyles emits no antd token bridge variables', async () => {
  writePageContent('home', '<div class="bg-primary text-text-secondary rounded p-4">Report</div>');
  writeUserStyles('.secondary { color: #8c8c8c; }');
  const context = createContext();

  await writeReportStyles({ context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).not.toContain('--ant-');
});

test("writeReportStyles emits the app's own theme tokens", async () => {
  writePageContent('home', '<div class="bg-brand text-lg">Report</div>');
  writeTheme({ tailwind: { color: { brand: '#722ed1' } } });
  const context = createContext();

  await writeReportStyles({ context });

  // `@theme inline` substitutes the token's value into the utility instead of
  // emitting a custom property, so the colour appears in the rule itself.
  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('.bg-brand {');
  expect(css).toContain('#722ed1');
});

test('writeReportStyles drops theme tokens that resolve to antd runtime variables', async () => {
  writePageContent('home', '<div class="bg-primary bg-brand">Report</div>');
  writeTheme({
    tailwind: { color: { primary: 'var(--ant-color-primary)', brand: '#722ed1' } },
  });
  const context = createContext();

  await writeReportStyles({ context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).not.toContain('--ant-');
  expect(css).not.toContain('.bg-primary {');
  expect(css).toContain('.bg-brand {');
});

test('writeReportStyles compiles without a theme artifact', async () => {
  writePageContent('home', '<div class="p-4">Report</div>');
  const context = createContext();

  await writeReportStyles({ context });

  expect(context.writeBuildArtifact.mock.calls[0][1]).toContain('.p-4 {');
});

test('writeReportStyles scans content of every page', async () => {
  writePageContent('home', '<div class="p-4">Home</div>');
  writePageContent('summary', '<div class="gap-2">Summary</div>');
  const context = createContext();

  await writeReportStyles({ context });

  const css = context.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('.p-4 {');
  expect(css).toContain('.gap-2 {');
});

test('writeReportStyles writes a valid artifact when no content uses Tailwind', async () => {
  const context = createContext();

  await writeReportStyles({ context });

  const [filePath, css] = context.writeBuildArtifact.mock.calls[0];
  expect(filePath).toBe('reports/styles.css');
  expect(css).toContain('/* Generated by Lowdefy build */');
  expect(css).toContain('tailwindcss v4');
  // Theme variables and preflight only — no utility classes to generate.
  expect(css.length).toBeLessThan(10000);
  expect(css).not.toContain('.flex {');
});

test('writeReportStyles recompiles changed page content on a dev rebuild', async () => {
  writePageContent('home', '<div class="p-4">Report</div>');
  const first = createContext();
  await writeReportStyles({ context: first });
  expect(first.writeBuildArtifact.mock.calls[0][1]).not.toContain('.gap-8 {');

  writePageContent('home', '<div class="p-4 gap-8">Report</div>');
  const second = createContext();
  await writeReportStyles({ context: second });

  const css = second.writeBuildArtifact.mock.calls[0][1];
  expect(css).toContain('.p-4 {');
  expect(css).toContain('.gap-8 {');
});
