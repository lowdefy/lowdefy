#!/usr/bin/env node

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

/**
 * Give every new publishable package the npm trusted publisher the release workflow needs.
 *
 * The release workflow publishes through OIDC only, so a package with no trusted publisher
 * for `release.yaml` cannot be published from CI: the release fails on it with
 * `E404 Not Found - PUT` after every other package is already live. A package's first
 * publish happens by hand in `pnpm release:experimental`, which runs this script afterwards,
 * so a new package gets its trusted publisher the moment it first exists on npm.
 *
 * - A package that is in the latest `v*` release tag was published from CI, which only
 *   works through its trusted publisher, so it is not checked. The release workflow tags a
 *   commit only after every package is live. Reading this from git needs no npm calls.
 * - Every other package is new. It is checked with `npm trust list`, and given the trusted
 *   publisher with `npm trust github` when it has none.
 *
 * Needs npm 11.15 or later and a person logged in to npm with 2FA, but only when there are
 * new packages. Tick "skip 2FA for 5 minutes" on the first prompt to cover the rest of the
 * batch.
 *
 * The publishable set is the one `scripts/verify-published.mjs` checks.
 */

import { spawnSync } from 'node:child_process';

import getPublishablePackages from './lib/getPublishablePackages.mjs';

const MIN_NPM_VERSION = [11, 15, 0];
// npm's advice for configuring trust in bulk, to avoid rate limiting.
const PAUSE_BETWEEN_CALLS_MS = 2000;
// A package published moments ago can lag in the registry.
const NOT_FOUND_RETRIES = 5;
const NOT_FOUND_RETRY_DELAY_MS = 5000;
const RELEASE_TRUST = {
  repository: 'lowdefy/lowdefy',
  file: 'release.yaml',
  environment: 'publish',
};
const TRUST_GITHUB_ARGS = [
  '--repo',
  RELEASE_TRUST.repository,
  '--file',
  RELEASE_TRUST.file,
  '--env',
  RELEASE_TRUST.environment,
  '--allow-publish',
  '--allow-stage-publish',
  '--yes',
];

let lastTrustCallAt = 0;

function fail({ message }) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function wait({ ms }) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function git({ args }) {
  return spawnSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function npm({ args, stdio }) {
  return spawnSync('npm', args, { encoding: 'utf8', stdio });
}

function getLatestReleaseTag() {
  // Sorted by version, not ancestry: experimentals are released from branches that don't
  // contain the release commits on main. A stale local tag only means more packages are
  // checked.
  const result = git({ args: ['tag', '--list', 'v*', '--sort=-v:refname'] });
  if (result.status !== 0) {
    fail({ message: `\`git tag --list\` failed:\n${result.stderr}` });
  }
  const [tag] = result.stdout.split('\n').filter(Boolean);
  if (!tag) {
    fail({ message: 'No `v*` release tag found. Fetch the tags with `git fetch --tags`.' });
  }
  return tag;
}

function isInRelease({ pkg, tag }) {
  const result = git({ args: ['show', `${tag}:${pkg.path}/package.json`] });
  // A missing file means the package did not exist at the tag. Compare the name too, since
  // a renamed package is a new npm package in the same directory.
  return result.status === 0 && JSON.parse(result.stdout).name === pkg.name;
}

function isOlderThan({ version, minimum }) {
  // A prerelease such as 11.15.0-pre.1 is compared as 11.15.0.
  const parts = version.split('-')[0].split('.').map(Number);
  for (let i = 0; i < minimum.length; i += 1) {
    if (parts[i] !== minimum[i]) return parts[i] < minimum[i];
  }
  return false;
}

function checkNpm() {
  const result = npm({ args: ['--version'], stdio: ['ignore', 'pipe', 'inherit'] });
  if (result.error) {
    fail({ message: `Could not run npm: ${result.error.message}` });
  }
  if (result.status !== 0) {
    fail({ message: `\`npm --version\` exited with code ${result.status}.` });
  }
  const version = result.stdout.trim();
  if (isOlderThan({ version, minimum: MIN_NPM_VERSION })) {
    fail({
      message: `npm ${version} has no \`npm trust\`. Upgrade to npm ${MIN_NPM_VERSION.join(
        '.'
      )} or later with \`npm install -g npm@latest\`.`,
    });
  }
  if (npm({ args: ['whoami'], stdio: ['ignore', 'ignore', 'ignore'] }).status !== 0) {
    fail({ message: 'Not logged in to npm. Log in with `npm login`, then run this script again.' });
  }
}

async function npmTrust({ args, stdio }) {
  const sinceLastCall = Date.now() - lastTrustCallAt;
  if (sinceLastCall < PAUSE_BETWEEN_CALLS_MS) {
    await wait({ ms: PAUSE_BETWEEN_CALLS_MS - sinceLastCall });
  }
  const result = npm({ args: ['trust', ...args], stdio });
  lastTrustCallAt = Date.now();
  return result;
}

function readNpmErrorCode({ stdout }) {
  try {
    return JSON.parse(stdout).error?.code ?? null;
  } catch {
    return null;
  }
}

function parseTrustConfigs({ stdout }) {
  // With --json npm prints nothing for a package with no trust configurations, and one
  // JSON object per configuration otherwise, not an array.
  const text = stdout.trim();
  if (text === '') return [];
  return JSON.parse(`[${text.replace(/\}\s*\{/g, '},{')}]`);
}

function isReleaseTrust({ config }) {
  return (
    config.type === 'github' &&
    config.repository === RELEASE_TRUST.repository &&
    config.file === RELEASE_TRUST.file &&
    config.environment === RELEASE_TRUST.environment &&
    (config.permissions ?? []).includes('createPackage')
  );
}

async function runTrustList({ name }) {
  const list = () =>
    npmTrust({ args: ['list', name, '--json'], stdio: ['inherit', 'pipe', 'inherit'] });
  const result = await list();
  if (result.status === 0 || readNpmErrorCode(result) !== 'EOTP') {
    return result;
  }
  // npm only prompts for 2FA when stdout is a terminal, so authenticate once with the
  // output shown, then read the list again as JSON.
  console.log(
    'npm needs 2FA to read trusted publishers. Authenticate, and tick "skip 2FA for 5 minutes".'
  );
  await npmTrust({ args: ['list', name], stdio: 'inherit' });
  const retried = await list();
  if (readNpmErrorCode(retried) === 'EOTP') {
    throw new Error(
      'npm still needs 2FA for every call. Run the script again and tick "skip 2FA for 5 minutes" when npm asks.'
    );
  }
  return retried;
}

// Returns null when the package is not on npm.
async function listTrustConfigs({ name }) {
  for (let attempt = 1; attempt <= NOT_FOUND_RETRIES; attempt += 1) {
    const result = await runTrustList({ name });
    if (result.status === 0) {
      return parseTrustConfigs(result);
    }
    if (readNpmErrorCode(result) !== 'E404') {
      throw new Error(`\`npm trust list ${name}\` failed:\n${result.stdout}`);
    }
    if (attempt < NOT_FOUND_RETRIES) {
      await wait({ ms: NOT_FOUND_RETRY_DELAY_MS });
    }
  }
  return null;
}

async function setTrustedPublisher({ name }) {
  const result = await npmTrust({ args: ['github', name, ...TRUST_GITHUB_ARGS], stdio: 'inherit' });
  return result.status === 0;
}

const tag = getLatestReleaseTag();
const packages = getPublishablePackages();
const newPackages = packages.filter((pkg) => !isInRelease({ pkg, tag }));

console.log(
  `${
    packages.length - newPackages.length
  } package(s) were released from CI in ${tag}, so they have a trusted publisher.`
);
if (newPackages.length === 0) {
  console.log(`No new packages since ${tag}.`);
  process.exit(0);
}
console.log(`New since ${tag}: ${newPackages.map((pkg) => pkg.name).join(', ')}`);

checkNpm();

const alreadySet = [];
const set = [];
const otherTrust = [];
const notOnNpm = [];
const failed = [];

async function ensureTrustedPublisher({ pkg }) {
  const configs = await listTrustConfigs(pkg);
  if (configs === null) {
    notOnNpm.push(pkg);
    return;
  }
  if (configs.some((config) => isReleaseTrust({ config }))) {
    alreadySet.push(pkg);
    return;
  }
  if (configs.length > 0) {
    // Revoking someone else's configuration is a call for a person to make.
    otherTrust.push({ pkg, configs });
    return;
  }
  console.log(`\nSetting trusted publisher on ${pkg.name}...`);
  if (await setTrustedPublisher(pkg)) {
    set.push(pkg);
  } else {
    failed.push(pkg);
  }
}

for (const pkg of newPackages) {
  // A registry or npm failure on one package should not hide what the rest of the batch did.
  try {
    await ensureTrustedPublisher({ pkg });
  } catch (error) {
    console.error(`\n${pkg.name}: ${error.message}`);
    failed.push(pkg);
  }
}

console.log('');
if (alreadySet.length > 0) {
  console.log('Already had the trusted publisher:');
  alreadySet.forEach((pkg) => console.log(`  ${pkg.name}`));
}
if (set.length > 0) {
  console.log('Trusted publisher set:');
  set.forEach((pkg) => console.log(`  ${pkg.name}`));
}
if (otherTrust.length > 0) {
  console.error(
    `Have a trusted publisher that is not ${RELEASE_TRUST.file} in ${RELEASE_TRUST.repository} with environment ${RELEASE_TRUST.environment}, so CI cannot publish them. Revoke it with \`npm trust revoke <package> --id <id>\` and run this script again:`
  );
  otherTrust.forEach(({ pkg, configs }) =>
    console.error(`  ${pkg.name}: ${JSON.stringify(configs)}`)
  );
}
if (notOnNpm.length > 0) {
  console.error(
    'Not on npm yet, so no trusted publisher can be set (publish an experimental first):'
  );
  notOnNpm.forEach((pkg) => console.error(`  ${pkg.name}`));
}
if (failed.length > 0) {
  console.error('Failed (see the output above):');
  failed.forEach((pkg) => console.error(`  ${pkg.name}`));
}
if (otherTrust.length > 0 || notOnNpm.length > 0 || failed.length > 0) {
  fail({ message: 'Run `node scripts/ensure-trusted-publishers.mjs` again once fixed.' });
}
