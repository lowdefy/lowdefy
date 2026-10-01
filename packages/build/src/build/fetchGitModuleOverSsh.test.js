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

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import fetchGitModuleOverSsh from './fetchGitModuleOverSsh.js';

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

let tmpDir;
let remoteDir;
let remoteUrl;
let commitSha;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-git-module-test-'));
  remoteDir = path.join(tmpDir, 'remote');
  fs.mkdirSync(path.join(remoteDir, 'modules', 'cx'), { recursive: true });
  fs.writeFileSync(path.join(remoteDir, 'modules', 'cx', 'module.lowdefy.yaml'), 'name: cx\n');
  git(remoteDir, ['init', '--quiet', '--initial-branch=main']);
  git(remoteDir, ['config', 'user.email', 'test@example.com']);
  git(remoteDir, ['config', 'user.name', 'Test']);
  git(remoteDir, ['config', 'uploadpack.allowReachableSHA1InWant', 'true']);
  git(remoteDir, ['add', '.']);
  git(remoteDir, ['commit', '--quiet', '-m', 'Add module']);
  git(remoteDir, ['tag', '-a', 'v1.0.0', '-m', 'v1.0.0']);
  commitSha = git(remoteDir, ['rev-parse', 'HEAD']);
  remoteUrl = `file://${remoteDir}`;
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function destDirFor(name) {
  return path.join(tmpDir, 'cache', name);
}

test('fetchGitModuleOverSsh extracts a branch into destDir without git metadata', async () => {
  const destDir = destDirFor('branch');

  await fetchGitModuleOverSsh({ remoteUrl, ref: 'main', destDir, sshKey: 'unused' });

  expect(fs.readFileSync(path.join(destDir, 'modules', 'cx', 'module.lowdefy.yaml'), 'utf8')).toBe(
    'name: cx\n'
  );
  expect(fs.existsSync(path.join(destDir, '.git'))).toBe(false);
});

test('fetchGitModuleOverSsh extracts an annotated tag', async () => {
  const destDir = destDirFor('tag');

  await fetchGitModuleOverSsh({ remoteUrl, ref: 'v1.0.0', destDir, sshKey: 'unused' });

  expect(fs.existsSync(path.join(destDir, 'modules', 'cx', 'module.lowdefy.yaml'))).toBe(true);
});

test('fetchGitModuleOverSsh extracts a full commit SHA', async () => {
  const destDir = destDirFor('sha');

  await fetchGitModuleOverSsh({ remoteUrl, ref: commitSha, destDir, sshKey: 'unused' });

  expect(fs.existsSync(path.join(destDir, 'modules', 'cx', 'module.lowdefy.yaml'))).toBe(true);
});

test('fetchGitModuleOverSsh throws when the ref does not exist', async () => {
  const destDir = destDirFor('missing');

  await expect(
    fetchGitModuleOverSsh({ remoteUrl, ref: 'no-such-branch', destDir, sshKey: 'unused' })
  ).rejects.toThrow('no-such-branch');
});

test('fetchGitModuleOverSsh connects with only the given key, pinned GitHub host keys and no prompts', async () => {
  const binDir = path.join(tmpDir, 'bin');
  const outDir = path.join(tmpDir, 'ssh-out');
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });
  // Stands in for ssh: records what git passes it, then fails the connection.
  fs.writeFileSync(
    path.join(binDir, 'ssh'),
    `#!/bin/sh
echo "$@" > "${outDir}/args"
while [ $# -gt 0 ]; do
  case "$1" in
    -i) cp "$2" "${outDir}/key"; ls -l "$2" > "${outDir}/key-mode"; echo "$2" > "${outDir}/key-path" ;;
    -o) case "$2" in UserKnownHostsFile=*) cp "\${2#UserKnownHostsFile=}" "${outDir}/known_hosts" ;; esac ;;
  esac
  shift
done
exit 1
`,
    { mode: 0o755 }
  );
  const pathEnv = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${pathEnv}`;

  try {
    await expect(
      fetchGitModuleOverSsh({
        remoteUrl: 'git@github.com:acme/private-modules.git',
        ref: 'main',
        destDir: destDirFor('ssh'),
        sshKey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
      })
    ).rejects.toThrow();
  } finally {
    process.env.PATH = pathEnv;
  }

  const args = fs.readFileSync(path.join(outDir, 'args'), 'utf8');
  expect(args).toMatch(/^-F none -i \S+ /);
  expect(args).toContain('-o IdentitiesOnly=yes');
  expect(args).toContain('-o BatchMode=yes');
  expect(args).toContain('-o StrictHostKeyChecking=yes');
  expect(args).toContain('git@github.com');
  expect(fs.readFileSync(path.join(outDir, 'key'), 'utf8')).toBe(
    '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----\n'
  );
  expect(fs.readFileSync(path.join(outDir, 'key-mode'), 'utf8')).toMatch(/^-rw-------/);
  expect(fs.readFileSync(path.join(outDir, 'known_hosts'), 'utf8')).toContain(
    'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl'
  );
  const keyPath = fs.readFileSync(path.join(outDir, 'key-path'), 'utf8').trim();
  expect(fs.existsSync(keyPath)).toBe(false);
});
