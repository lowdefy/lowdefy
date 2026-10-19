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
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import extractTarball from './extractTarball.js';

const execFileAsync = promisify(execFile);

// GitHub's published host keys (the ssh_keys of https://api.github.com/meta). Pinned so a build
// never trusts a host key on first use.
const GITHUB_KNOWN_HOSTS = [
  'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl',
  'github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=',
  'github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=',
].join('\n');

function shellQuote({ value }) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function createSshCommand({ keyFile, knownHostsFile }) {
  // -F none ignores the machine's ssh config, so only the given key is offered.
  return [
    'ssh',
    '-F none',
    `-i ${shellQuote({ value: keyFile })}`,
    '-o IdentitiesOnly=yes',
    '-o BatchMode=yes',
    '-o StrictHostKeyChecking=yes',
    `-o UserKnownHostsFile=${shellQuote({ value: knownHostsFile })}`,
  ].join(' ');
}

// Secret stores and env var UIs mangle multi-line values: literal "\n" escapes, CRLF line endings,
// surrounding whitespace and a dropped final newline, all of which OpenSSH rejects. A PEM key never
// contains a backslash, so unescaping "\n" is safe.
function normalizeSshKey({ sshKey }) {
  return `${sshKey.replaceAll('\\n', '\n').replaceAll('\r\n', '\n').trim()}\n`;
}

// Runs git isolated from the machine's git setup: GIT_* variables (such as GIT_DIR set by a git
// hook running the build) and global or system config (such as a url.insteadOf rewrite that would
// send the fetch over HTTPS and bypass the key) would otherwise apply.
function createGitEnv({ workDir, keyFile, knownHostsFile }) {
  const emptyConfigFile = path.join(workDir, 'gitconfig');
  fs.writeFileSync(emptyConfigFile, '');
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.toUpperCase().startsWith('GIT_'))
  );
  return {
    ...env,
    GIT_CONFIG_GLOBAL: emptyConfigFile,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_SSH_COMMAND: createSshCommand({ keyFile, knownHostsFile }),
    GIT_TERMINAL_PROMPT: '0',
  };
}

async function fetchGitModuleOverSsh({ remoteUrl, ref, destDir, sshKey }) {
  if (/^[0-9a-f]{7,39}$/.test(ref)) {
    throw new Error(
      `"${ref}" looks like an abbreviated commit SHA, which git cannot fetch. Use a tag, a branch or the full 40-character commit SHA.`
    );
  }
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-module-'));
  try {
    const keyFile = path.join(workDir, 'id');
    const knownHostsFile = path.join(workDir, 'known_hosts');
    const gitDir = path.join(workDir, 'repo');
    const archiveFile = path.join(workDir, 'module.tar.gz');

    fs.writeFileSync(keyFile, normalizeSshKey({ sshKey }), { mode: 0o600 });
    fs.writeFileSync(knownHostsFile, `${GITHUB_KNOWN_HOSTS}\n`);

    const env = createGitEnv({ workDir, keyFile, knownHostsFile });
    await execFileAsync('git', ['init', '--quiet', gitDir], { env });
    // "--" stops a ref starting with "-" from being read as a git option.
    await execFileAsync('git', ['fetch', '--quiet', '--depth', '1', '--', remoteUrl, ref], {
      cwd: gitDir,
      env,
    });
    // git archive is what GitHub's tarball endpoint serves, so both fetch routes cache the same
    // files. The prefix gives the archive the single top-level directory extractTarball strips.
    await execFileAsync(
      'git',
      ['archive', '--format=tar.gz', '--prefix=module/', `--output=${archiveFile}`, 'FETCH_HEAD'],
      { cwd: gitDir, env }
    );
    await extractTarball({ body: fs.createReadStream(archiveFile), destDir });
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

export default fetchGitModuleOverSsh;
