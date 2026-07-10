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

import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

import stopHookScript from './stopHookScript.js';

const testPort = 39217;
let scriptPath;

beforeEach(() => {
  const scriptDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-stop-hook-script-test-'));
  scriptPath = path.join(scriptDirectory, 'lowdefy-feedback-stop.mjs');
  fs.writeFileSync(scriptPath, stopHookScript({ port: testPort }));
});

afterEach(() => {
  fs.rmSync(path.dirname(scriptPath), { recursive: true, force: true });
});

function runHook(stdinPayload) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
    child.stdin.write(JSON.stringify(stdinPayload));
    child.stdin.end();
  });
}

test('stopHookScript generates a script templated with the given port', () => {
  const script = stopHookScript({ port: testPort });
  expect(script).toContain(`http://localhost:${testPort}/lowdefy-feedback/pending?consume=1`);
  expect(script).toContain('safe to delete');
});

test('stopHookScript exits 0 with no stdout when stop_hook_active is true (loop protection)', async () => {
  const { stdout, exitCode } = await runHook({ stop_hook_active: true });

  expect(exitCode).toEqual(0);
  expect(stdout).toEqual('');
});

test('stopHookScript exits 0 with no stdout when the dev server is unreachable', async () => {
  const { stdout, exitCode } = await runHook({ stop_hook_active: false });

  expect(exitCode).toEqual(0);
  expect(stdout).toEqual('');
});

describe('with a local dev server stub', () => {
  let server;

  beforeEach((done) => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ count: 1, items: [{ text: 'FEEDBACK!' }], formatted: 'FEEDBACK!' }));
    });
    server.listen(testPort, done);
  });

  afterEach((done) => {
    server.close(done);
  });

  test('stopHookScript blocks with the formatted feedback reason when feedback is pending', async () => {
    const { stdout, exitCode } = await runHook({ stop_hook_active: false });

    expect(exitCode).toEqual(0);
    expect(JSON.parse(stdout)).toEqual({ decision: 'block', reason: 'FEEDBACK!' });
  });
});
