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

let tmpDir;
let gitEnv;
let remoteDir;
let remoteUrl;
let commitSha;

// Builds the test repository without the developer's git config, which may sign commits and tags.
function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: gitEnv }).trim();
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-git-module-test-'));
  const emptyConfigFile = path.join(tmpDir, 'gitconfig');
  fs.writeFileSync(emptyConfigFile, '');
  gitEnv = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([name]) => !name.toUpperCase().startsWith('GIT_'))
    ),
    GIT_CONFIG_GLOBAL: emptyConfigFile,
    GIT_CONFIG_NOSYSTEM: '1',
  };
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
  expect(fs.readdirSync(destDir)).toEqual(['modules']);
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

test('fetchGitModuleOverSsh throws a clear error for an abbreviated commit SHA without fetching', async () => {
  const destDir = destDirFor('short-sha');

  await expect(
    fetchGitModuleOverSsh({ remoteUrl, ref: commitSha.slice(0, 7), destDir, sshKey: 'unused' })
  ).rejects.toThrow(
    `"${commitSha.slice(
      0,
      7
    )}" looks like an abbreviated commit SHA, which git cannot fetch. Use a tag, a branch or the full 40-character commit SHA.`
  );
  expect(fs.existsSync(destDir)).toBe(false);
});

test('fetchGitModuleOverSsh does not read a ref starting with a dash as a git option', async () => {
  const marker = path.join(tmpDir, 'upload-pack-ran');

  await expect(
    fetchGitModuleOverSsh({
      remoteUrl,
      ref: `--upload-pack=touch ${marker}`,
      destDir: destDirFor('dash-ref'),
      sshKey: 'unused',
    })
  ).rejects.toThrow();
  expect(fs.existsSync(marker)).toBe(false);
});

test('fetchGitModuleOverSsh ignores GIT_* variables and global git config', async () => {
  const destDir = destDirFor('isolated');
  const otherRepo = path.join(tmpDir, 'other-repo');
  git(tmpDir, ['init', '--quiet', otherRepo]);
  const rewriteConfigFile = path.join(tmpDir, 'rewrite-gitconfig');
  fs.writeFileSync(
    rewriteConfigFile,
    `[url "file://${path.join(tmpDir, 'no-such-remote')}"]\n\tinsteadOf = ${remoteUrl}\n`
  );
  const env = process.env;
  process.env = {
    ...env,
    GIT_DIR: path.join(otherRepo, '.git'),
    GIT_CONFIG_GLOBAL: rewriteConfigFile,
  };

  try {
    await fetchGitModuleOverSsh({ remoteUrl, ref: 'main', destDir, sshKey: 'unused' });
  } finally {
    process.env = env;
  }

  expect(fs.existsSync(path.join(destDir, 'modules', 'cx', 'module.lowdefy.yaml'))).toBe(true);
  expect(fs.existsSync(path.join(otherRepo, '.git', 'FETCH_HEAD'))).toBe(false);
});

// Runs a fetch against a stand-in for ssh that records what git passes it, then fails the
// connection. Returns the directory holding the recorded files.
async function captureSshInvocation({ name, sshKey }) {
  const binDir = path.join(tmpDir, name, 'bin');
  const outDir = path.join(tmpDir, name, 'ssh-out');
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });
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
        destDir: destDirFor(name),
        sshKey,
      })
    ).rejects.toThrow();
  } finally {
    process.env.PATH = pathEnv;
  }
  return outDir;
}

test('fetchGitModuleOverSsh connects with only the given key, pinned GitHub host keys and no prompts', async () => {
  const outDir = await captureSshInvocation({
    name: 'ssh',
    sshKey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
  });

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

test.each([
  [
    'literal \\n escapes',
    '-----BEGIN OPENSSH PRIVATE KEY-----\\nkey\\n-----END OPENSSH PRIVATE KEY-----',
  ],
  [
    'CRLF line endings',
    '-----BEGIN OPENSSH PRIVATE KEY-----\r\nkey\r\n-----END OPENSSH PRIVATE KEY-----\r\n',
  ],
  [
    'surrounding whitespace',
    '  \n-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----\n\n ',
  ],
])('fetchGitModuleOverSsh writes a key with %s as a well-formed key file', async (name, sshKey) => {
  const outDir = await captureSshInvocation({
    name: `key-${name.replaceAll(/\W+/g, '-')}`,
    sshKey,
  });

  expect(fs.readFileSync(path.join(outDir, 'key'), 'utf8')).toBe(
    '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----\n'
  );
});
