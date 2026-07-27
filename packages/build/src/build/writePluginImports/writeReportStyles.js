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
import path from 'path';
import { createRequire } from 'module';
import { serializer, type } from '@lowdefy/helpers';

import { objectToThemeVars } from './writeGlobalsCss.js';

const require = createRequire(import.meta.url);

// Both halves of the compiler load through require: @tailwindcss/oxide is a
// native CJS addon, and @tailwindcss/node's ESM entry registers Node module
// resolve hooks as an import side effect that deadlock Jest's ESM loader. The
// CJS and ESM builds are the same code.
const { compile, normalizePath } = require('@tailwindcss/node');
const { Scanner } = require('@tailwindcss/oxide');

// Report Html blocks render server-side through takumi, which resolves classes
// against stylesheets handed to it per render. The client compiles its CSS
// inside the Vite bundle, so there is nothing to reuse — build compiles its own
// artifact here with the same programmatic API Tailwind's CLI and PostCSS
// plugin use: compile() to build the design system, oxide's Scanner to find
// class candidates in the collected page/block content.
//
// The source stylesheet mirrors writeGlobalsCss.js minus the antd token bridge.
// Bridged utilities resolve to `var(--ant-*)` variables that antd injects from
// CSS-in-JS at browser runtime; nothing defines them statically, so emitting
// the bridge would only add unresolvable references to every report.

/** A theme token that resolves to an antd runtime variable, which never exists
 * in a document. Dropped so `bg-primary` fails visibly as an unknown utility
 * rather than painting with an undefined colour. */
const isRuntimeToken = (value) => typeof value === 'string' && value.includes('var(--ant-');

function withoutRuntimeTokens(config) {
  const kept = {};
  for (const [key, value] of Object.entries(config)) {
    if (type.isObject(value)) {
      const nested = withoutRuntimeTokens(value);
      if (Object.keys(nested).length > 0) kept[key] = nested;
    } else if (!isRuntimeToken(value)) {
      kept[key] = value;
    }
  }
  return kept;
}

/**
 * The app's own Tailwind theme tokens (`theme.tailwind` in lowdefy.yaml) as a
 * `@theme` block, so a `bg-brand` tile renders in a report exactly as it does
 * on the page. Read from the theme artifact rather than from `components`:
 * writeTheme runs before this in the full build, and per-page JIT rebuilds have
 * no components to read — one source works in both.
 */
function themeBlock({ context }) {
  let theme;
  try {
    theme = serializer.deserializeFromString(
      fs.readFileSync(path.join(context.directories.build, 'theme.json'), 'utf8')
    );
  } catch {
    return ''; // no theme artifact yet (a JIT build before any full build)
  }
  if (!type.isObject(theme?.tailwind)) return '';
  const vars = objectToThemeVars(withoutRuntimeTokens(theme.tailwind));
  if (vars.length === 0) return '';
  return `\n/* App theme tokens */\n@theme inline {\n${vars.join('\n')}\n}\n`;
}

function reportStylesSource({ context }) {
  // Tailwind's entry stylesheet, resolved from this package rather than through
  // the app's server directory, so the compile always uses the tailwindcss
  // version @tailwindcss/node was built against and never depends on the state
  // of the app's install. normalizePath keeps the path a legal CSS string on
  // Windows, where backslashes would read as escapes.
  const tailwindEntry = normalizePath(require.resolve('tailwindcss/index.css'));

  const userStyles = path.join(context.directories.config, 'public/styles.css');
  const userStylesImport = fs.existsSync(userStyles)
    ? `/* User custom styles */\n@import "${normalizePath(userStyles)}" layer(components);\n`
    : '';

  // source(none) disables Tailwind's automatic source detection — the explicit
  // @source glob below is the only scan input. The glob resolves against the
  // compile base (the server directory) and covers the per-page content files
  // and the block plugin content file writeGlobalsCss collected.
  return `@import "${tailwindEntry}" source(none);
${userStylesImport}@source "./lowdefy-build/tailwind/*.html";
${themeBlock({ context })}`;
}

async function writeReportStyles({ context }) {
  const source = reportStylesSource({ context });
  const compiler = await compile(source, {
    base: context.directories.server,
    onDependency: () => {},
  });
  const scanner = new Scanner({ sources: compiler.sources });
  const css = compiler.build(scanner.scan());

  await context.writeBuildArtifact(
    'reports/styles.css',
    `/* Generated by Lowdefy build */\n${css}`
  );
}

export default writeReportStyles;
