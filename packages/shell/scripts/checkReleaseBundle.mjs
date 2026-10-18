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
  The release check: a customer shell must not carry Lowdefy Dev's developer features, in its
  JavaScript or in its native projects. A shell's release build runs it before a store build.

  For each platform, with LOWDEFY_SHELL_VARIANT=release and the shell config LOWDEFY_SHELL_CONFIG
  names (Lowdefy Dev's shell.dev.json without it):

  1. Bundle: exports the JavaScript bundle and fails when any file of it holds the dev-tab client's
     marker (src/dev/tab/devClientMarker.js) or the native module name of a module the shell leaves
     out (getExcludedModules in shellVariant.js: expo-sensors, react-native-view-shot, and
     expo-camera unless the shell needs the camera).
  2. Prebuild: runs `expo prebuild` in a copy of the shell and fails when
     - Expo autolinking, run with the exclusions the generated Podfile and settings.gradle pass it,
       still links a module the shell leaves out; or
     - the camera permission (NSCameraUsageDescription, android.permission.CAMERA) is asked for by
       a shell that does not need the camera, or the motion permission (expo-sensors) by any.

  With --control it first runs both on the dev variant and fails when the marker, the module names
  or the modules are missing there, which shows the check can see them.

    node scripts/checkReleaseBundle.mjs [--platform ios|android] [--control]
*/

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shellRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const checkShellConfig = require('../checkShellConfig.js');
const { DEV_CLIENT_MARKER, getExcludedModules, shellNeedsCamera } = require('../shellVariant.js');

// The modules Lowdefy Dev links that a release shell may leave out, for the --control run.
const DEV_MODULES = getExcludedModules({ shell: {}, variant: 'release' });

// Copied into each prebuild's temporary project; node_modules is linked, not copied.
const SKIPPED_IN_COPY = new Set(['android', 'coverage', 'dist', 'ios', 'node_modules', '.expo']);

const AUTOLINKING_PLATFORMS = { ios: 'apple', android: 'android' };

function readArgs(argv) {
  const platformIndex = argv.indexOf('--platform');
  return {
    control: argv.includes('--control'),
    platforms: platformIndex === -1 ? ['ios', 'android'] : [argv[platformIndex + 1]],
  };
}

function readShell() {
  const configPath = process.env.LOWDEFY_SHELL_CONFIG
    ? path.resolve(process.env.LOWDEFY_SHELL_CONFIG)
    : path.join(shellRoot, 'shell.dev.json');
  const shell = checkShellConfig({
    configPath,
    shell: JSON.parse(fs.readFileSync(configPath, 'utf8')),
  });
  return { configPath, shell };
}

function variantEnv({ configPath, variant }) {
  const env = { ...process.env, CI: '1', LOWDEFY_SHELL_VARIANT: variant };
  if (process.env.LOWDEFY_SHELL_CONFIG) {
    env.LOWDEFY_SHELL_CONFIG = configPath;
  }
  return env;
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function withTemporaryDirectory(prefix, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    return callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

// The files of the exported bundle that hold each string, as { [string]: [file] }. Hermes bytecode
// keeps string literals as plain bytes, so they are found in .hbc files too.
function findInBundle({ env, platform, strings }) {
  return withTemporaryDirectory(`lowdefy-shell-bundle-${platform}-`, (outputDir) => {
    execFileSync(
      path.join(shellRoot, 'node_modules', '.bin', 'expo'),
      ['export', '--platform', platform, '--output-dir', outputDir, '--clear'],
      { cwd: shellRoot, env, stdio: ['ignore', 'ignore', 'inherit'] }
    );
    const files = listFiles(outputDir).map((file) => ({
      name: path.relative(outputDir, file),
      bytes: fs.readFileSync(file),
    }));
    return Object.fromEntries(
      strings.map((string) => [
        string,
        files.filter(({ bytes }) => bytes.includes(Buffer.from(string))).map(({ name }) => name),
      ])
    );
  });
}

function readList(text) {
  return [...text.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

// The exclusions a generated native project passes to Expo autolinking: [expo modules, react-native
// config]. iOS: the Podfile's `use_expo_modules!(exclude: [...])` and its react-native-config
// command's `--exclude` pairs. Android: settings.gradle's `expoAutolinking.exclude` and the list
// added to `rnConfigCommand`.
function readExclusions({ platform, projectDir }) {
  if (platform === 'ios') {
    const podfile = fs.readFileSync(path.join(projectDir, 'ios', 'Podfile'), 'utf8');
    const expoModules = /use_expo_modules!\(exclude: \[([^\]]*)\]\)/.exec(podfile);
    const reactNative = [...podfile.matchAll(/'--exclude', '([^']+)'/g)].map((match) => match[1]);
    return { expo: expoModules ? readList(expoModules[1]) : [], reactNative };
  }
  const settings = fs.readFileSync(path.join(projectDir, 'android', 'settings.gradle'), 'utf8');
  const expoModules = /expoAutolinking\.exclude = \[([^\]]*)\]/.exec(settings);
  const reactNative = /rnConfigCommand \+ \[([^\]]*)\]/.exec(settings);
  return {
    expo: expoModules ? readList(expoModules[1]) : [],
    reactNative: reactNative ? readList(reactNative[1]).filter((item) => item !== '--exclude') : [],
  };
}

function runAutolinking({ args, exclude, projectDir }) {
  const output = execFileSync(
    process.execPath,
    [
      '--no-warnings',
      '--eval',
      "require('expo/bin/autolinking')",
      'expo-modules-autolinking',
      ...args,
      ...exclude.flatMap((name) => ['--exclude', name]),
    ],
    { cwd: projectDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return JSON.parse(output);
}

// The packages the native build links: Expo modules and react-native-config dependencies.
function readLinkedModules({ platform, projectDir }) {
  const exclusions = readExclusions({ platform, projectDir });
  const resolved = runAutolinking({
    args: ['resolve', '--json', '--platform', AUTOLINKING_PLATFORMS[platform]],
    exclude: exclusions.expo,
    projectDir,
  });
  const reactNative = runAutolinking({
    args: ['react-native-config', '--json', '--platform', platform],
    exclude: exclusions.reactNative,
    projectDir,
  });
  return new Set([
    ...resolved.modules.map((module) => module.packageName),
    ...Object.keys(reactNative.dependencies),
  ]);
}

// The permissions the native project asks for that a check looks at.
function readPermissions({ platform, projectDir }) {
  if (platform === 'ios') {
    const iosDir = path.join(projectDir, 'ios');
    const plist = fs
      .readdirSync(iosDir)
      .map((name) => path.join(iosDir, name, 'Info.plist'))
      .find((file) => fs.existsSync(file));
    const text = fs.readFileSync(plist, 'utf8');
    return {
      camera: text.includes('<key>NSCameraUsageDescription</key>'),
      motion: text.includes('<key>NSMotionUsageDescription</key>'),
    };
  }
  const manifest = fs.readFileSync(
    path.join(projectDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
    'utf8'
  );
  const camera = [
    ...manifest.matchAll(/<uses-permission [^>]*android\.permission\.CAMERA"[^>]*>/g),
  ];
  return {
    camera: camera.some((match) => !match[0].includes('tools:node="remove"')),
    motion: false,
  };
}

function prebuild({ env, platform }) {
  return withTemporaryDirectory(`lowdefy-shell-prebuild-${platform}-`, (projectDir) => {
    fs.readdirSync(shellRoot)
      .filter((name) => !SKIPPED_IN_COPY.has(name))
      .forEach((name) => {
        fs.cpSync(path.join(shellRoot, name), path.join(projectDir, name), { recursive: true });
      });
    fs.symlinkSync(path.join(shellRoot, 'node_modules'), path.join(projectDir, 'node_modules'));
    execFileSync(
      path.join(projectDir, 'node_modules', '.bin', 'expo'),
      ['prebuild', '--no-install', '--platform', platform],
      { cwd: projectDir, env, stdio: ['ignore', 'ignore', 'inherit'] }
    );
    return {
      linked: readLinkedModules({ platform, projectDir }),
      permissions: readPermissions({ platform, projectDir }),
    };
  });
}

function checkControl({ configPath, platform }) {
  const env = variantEnv({ configPath, variant: 'dev' });
  const problems = [];
  const found = findInBundle({
    env,
    platform,
    strings: [DEV_CLIENT_MARKER, ...Object.values(DEV_MODULES)],
  });
  Object.entries(found)
    .filter(([, files]) => files.length === 0)
    .forEach(([string]) => problems.push(`the dev bundle does not hold "${string}"`));
  const { linked } = prebuild({ env, platform });
  Object.keys(DEV_MODULES)
    .filter((name) => !linked.has(name))
    .forEach((name) => problems.push(`the dev prebuild does not link ${name}`));
  return problems;
}

function checkRelease({ configPath, platform, shell }) {
  const env = variantEnv({ configPath, variant: 'release' });
  const excluded = getExcludedModules({ shell, variant: 'release' });
  const problems = [];
  const found = findInBundle({
    env,
    platform,
    strings: [DEV_CLIENT_MARKER, ...Object.values(excluded)],
  });
  Object.entries(found)
    .filter(([, files]) => files.length > 0)
    .forEach(([string, files]) =>
      problems.push(`the release bundle holds "${string}" (${files.join(', ')})`)
    );
  const { linked, permissions } = prebuild({ env, platform });
  Object.keys(excluded)
    .filter((name) => linked.has(name))
    .forEach((name) => problems.push(`the release prebuild links ${name}`));
  if (permissions.camera && !shellNeedsCamera(shell)) {
    problems.push('the release prebuild asks for the camera, which this shell does not need');
  }
  if (permissions.motion) {
    problems.push('the release prebuild asks for motion, which only Lowdefy Dev uses');
  }
  return { excluded: Object.keys(excluded), problems };
}

function main() {
  const { control, platforms } = readArgs(process.argv.slice(2));
  const { configPath, shell } = readShell();
  let failed = false;
  platforms.forEach((platform) => {
    if (control) {
      const problems = checkControl({ configPath, platform });
      if (problems.length > 0) {
        problems.forEach((problem) => console.error(`${platform}: ${problem}.`));
        failed = true;
        return;
      }
      console.log(
        `${platform}: the dev variant holds the dev-tab client and links ${Object.keys(
          DEV_MODULES
        ).join(', ')}.`
      );
    }
    const { excluded, problems } = checkRelease({ configPath, platform, shell });
    if (problems.length > 0) {
      problems.forEach((problem) => console.error(`${platform}: ${problem}.`));
      failed = true;
      return;
    }
    console.log(
      `${platform}: the release shell "${
        shell.id
      }" holds no dev-tab client, links none of ${excluded.join(', ')}, and asks for ${
        shellNeedsCamera(shell) ? 'the camera only as it needs' : 'no camera'
      }.`
    );
  });
  if (failed) {
    process.exit(1);
  }
}

main();
