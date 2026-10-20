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
 * Give every publishable package the npm trusted publisher the release workflow needs.
 *
 * The release workflow publishes through OIDC only, so a package with no trusted publisher
 * for `release.yaml` cannot be published from CI: the release fails on it with
 * `E404 Not Found - PUT` after every other package is already live. A package's first
 * publish happens by hand in `pnpm release:experimental`, which runs this script afterwards,
 * so a new package gets its trusted publisher the moment it first exists on npm.
 *
 * - A package with a `latest` dist-tag was released from CI, so it already has one and is
 *   not checked (`npm trust list` is one call per package and needs 2FA).
 * - Any other package is checked with `npm trust list`, and given one with
 *   `npm trust github` when it has none.
 *
 * Needs npm 11.15 or later and a person logged in to npm with 2FA. Tick "skip 2FA for
 * 5 minutes" on the first prompt to cover the rest of the batch.
 *
 * The publishable set is the one `scripts/verify-published.mjs` checks.
 */

import { spawnSync } from 'node:child_process';

import getPublishablePackages from './lib/getPublishablePackages.mjs';

const MIN_NPM_VERSION = [11, 15, 0];
// npm's advice for configuring trust in bulk, to avoid rate limiting.
const PAUSE_BETWEEN_CALLS_MS = 2000;
// A package published moments ago can lag in the registry.
const LOOKUP_RETRIES = 5;
const LOOKUP_RETRY_DELAY_MS = 5000;
const REGISTRY = (process.env.npm_config_registry ?? 'https://registry.npmjs.org').replace(
  /\/$/,
  ''
);
const TRUST_GITHUB_ARGS = [
  '--repo',
  'lowdefy/lowdefy',
  '--file',
  'release.yaml',
  '--env',
  'publish',
  '--allow-publish',
  '--allow-stage-publish',
  '--yes',
];

let lastTrustCallAt = 0;

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function npm(args, { stdio }) {
  return spawnSync('npm', args, { encoding: 'utf8', stdio });
}

function isOlderThan(version, minimum) {
  const parts = version.split('.').map(Number);
  for (let i = 0; i < minimum.length; i += 1) {
    if (parts[i] !== minimum[i]) return parts[i] < minimum[i];
  }
  return false;
}

function checkNpm() {
  const version = npm(['--version'], { stdio: ['ignore', 'pipe', 'inherit'] }).stdout.trim();
  if (isOlderThan(version, MIN_NPM_VERSION)) {
    fail(
      `npm ${version} has no \`npm trust\`. Upgrade to npm ${MIN_NPM_VERSION.join(
        '.'
      )} or later with \`npm install -g npm@latest\`.`
    );
  }
  if (npm(['whoami'], { stdio: ['ignore', 'ignore', 'ignore'] }).status !== 0) {
    fail('Not logged in to npm. Log in with `npm login`, then run this script again.');
  }
}

async function getDistTags({ name }) {
  for (let attempt = 1; attempt <= LOOKUP_RETRIES; attempt += 1) {
    const response = await fetch(`${REGISTRY}/-/package/${name}/dist-tags`, { cache: 'no-store' });
    if (response.status === 200) {
      return response.json();
    }
    if (attempt < LOOKUP_RETRIES) {
      await wait(LOOKUP_RETRY_DELAY_MS);
    }
  }
  return null;
}

async function npmTrust(args, { stdio }) {
  const sinceLastCall = Date.now() - lastTrustCallAt;
  if (sinceLastCall < PAUSE_BETWEEN_CALLS_MS) {
    await wait(PAUSE_BETWEEN_CALLS_MS - sinceLastCall);
  }
  const result = npm(['trust', ...args], { stdio });
  lastTrustCallAt = Date.now();
  return result;
}

function readNpmErrorCode(stdout) {
  try {
    return JSON.parse(stdout).error?.code ?? null;
  } catch {
    return null;
  }
}

async function hasTrustedPublisher({ name }) {
  const list = () => npmTrust(['list', name, '--json'], { stdio: ['inherit', 'pipe', 'inherit'] });
  let result = await list();
  if (result.status !== 0 && readNpmErrorCode(result.stdout) === 'EOTP') {
    // npm only prompts for 2FA when stdout is a terminal, so authenticate once with the
    // output shown, then read the list again as JSON.
    console.log(
      'npm needs 2FA to read trusted publishers. Authenticate, and tick "skip 2FA for 5 minutes".'
    );
    await npmTrust(['list', name], { stdio: 'inherit' });
    result = await list();
    if (readNpmErrorCode(result.stdout) === 'EOTP') {
      throw new Error(
        'npm still needs 2FA for every call. Run the script again and tick "skip 2FA for 5 minutes" when npm asks.'
      );
    }
  }
  if (result.status !== 0) {
    throw new Error(`\`npm trust list ${name}\` failed:\n${result.stdout}`);
  }
  // With --json npm prints nothing for a package with no trust configurations.
  return result.stdout.trim() !== '';
}

async function setTrustedPublisher({ name }) {
  const result = await npmTrust(['github', name, ...TRUST_GITHUB_ARGS], { stdio: 'inherit' });
  return result.status === 0;
}

checkNpm();

const released = [];
const alreadySet = [];
const set = [];
const notOnNpm = [];
const failed = [];

async function ensureTrustedPublisher(pkg) {
  const distTags = await getDistTags(pkg);
  if (distTags === null) {
    notOnNpm.push(pkg);
    return;
  }
  if (distTags.latest) {
    released.push(pkg);
    return;
  }
  if (await hasTrustedPublisher(pkg)) {
    alreadySet.push(pkg);
    return;
  }
  console.log(`\nSetting trusted publisher on ${pkg.name}...`);
  if (await setTrustedPublisher(pkg)) {
    set.push(pkg);
  } else {
    failed.push(pkg);
  }
}

for (const pkg of getPublishablePackages()) {
  // A registry or npm failure on one package should not hide what the rest of the batch did.
  try {
    await ensureTrustedPublisher(pkg);
  } catch (error) {
    console.error(`\n${pkg.name}: ${error.message}`);
    failed.push(pkg);
  }
}

console.log(`\n${released.length} package(s) released from CI already have a trusted publisher.`);
if (alreadySet.length > 0) {
  console.log('Already had a trusted publisher:');
  alreadySet.forEach((pkg) => console.log(`  ${pkg.name}`));
}
if (set.length > 0) {
  console.log('Trusted publisher set:');
  set.forEach((pkg) => console.log(`  ${pkg.name}`));
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
if (notOnNpm.length > 0 || failed.length > 0) {
  fail('Run `node scripts/ensure-trusted-publishers.mjs` again once fixed.');
}
