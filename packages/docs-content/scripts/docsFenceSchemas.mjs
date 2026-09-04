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

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Every ```yaml fence in content/ is config a reader will copy, so it is held to
// the same schemas the build holds an app to. The failure this catches is drift:
// a plugin schema renames or drops a property and the docs keep showing the old
// name. Schemas are read from the plugin packages' own dist/ exports on every
// run - the same modules the build imports in loadBlockSchemas,
// writeOperatorSchemaMap and writeConnectionSchemaMap - so a rename fails here
// the moment it lands, with no map to regenerate and nothing to keep in step.
//
// This is a repo test, not shipped runtime code: it resolves sibling workspace
// packages by path, exactly as hazards.test.mjs already reads packages/plugins.

const packageDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDirectory = path.join(packageDirectory, '../..');
const contentDirectory = path.join(packageDirectory, 'content');

// yaml is a dependency of @lowdefy/build, not of this package, and a docs
// package must not grow a dependency to be tested. Resolving it through build's
// package.json pins it to the version the build itself parses config with.
const requireFromBuild = createRequire(path.join(repoDirectory, 'packages/build/package.json'));
const YAML = requireFromBuild('yaml');

async function importByPath(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return import(pathToFileURL(filePath).href);
}

// The build's own Ajv instance, with its formats and keywords registered, so a
// schema compiles here exactly as it does in a build.
const { default: compileSchema } = await importByPath(
  path.join(repoDirectory, 'packages/utils/ajv/dist/compile.js')
);
const { default: buildBlockSchema } = await importByPath(
  path.join(repoDirectory, 'packages/utils/block-utils/dist/buildBlockSchema.js')
);
const { default: lowdefySchema } = await importByPath(
  path.join(repoDirectory, 'packages/build/src/lowdefySchema.js')
);

function listPluginPackages() {
  const pluginsDirectory = path.join(repoDirectory, 'packages/plugins');
  const packages = [];
  for (const group of fs.readdirSync(pluginsDirectory)) {
    const groupDirectory = path.join(pluginsDirectory, group);
    if (!fs.statSync(groupDirectory).isDirectory()) continue;
    for (const name of fs.readdirSync(groupDirectory)) {
      const manifestPath = path.join(groupDirectory, name, 'package.json');
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      // The `lowdefy` manifest key is what marks a package as an installable
      // plugin; utility packages under plugins/ do not carry it.
      if (!manifest.lowdefy) continue;
      packages.push({
        directory: path.join(groupDirectory, name),
        exports: manifest.exports ?? {},
        group,
        name: manifest.name,
      });
    }
  }
  return packages;
}

async function importPluginExport({ pluginPackage, subpath }) {
  const target = pluginPackage.exports[subpath];
  if (!target) return null;
  return importByPath(path.join(pluginPackage.directory, target));
}

// Mirrors loadBlockSchemas (`<package>/metas` -> buildBlockSchema),
// writeOperatorSchemaMap (`<package>/schemas`) and writeConnectionSchemaMap
// (`<package>/connections` -> Connection.schema / Connection.requests[].schema).
async function loadPluginSchemas() {
  const blocks = {};
  const connections = {};
  const operators = {};
  const requests = {};
  for (const pluginPackage of listPluginPackages()) {
    if (pluginPackage.group === 'blocks') {
      const metas = await importPluginExport({ pluginPackage, subpath: './metas' });
      for (const [typeName, meta] of Object.entries(metas ?? {})) {
        if (typeName === 'default') continue;
        blocks[typeName] = {
          meta,
          package: pluginPackage.name,
          schema: buildBlockSchema(meta),
        };
      }
    }
    if (pluginPackage.group === 'operators') {
      const schemas = await importPluginExport({ pluginPackage, subpath: './schemas' });
      for (const [typeName, schema] of Object.entries(schemas ?? {})) {
        if (typeName === 'default') continue;
        operators[typeName] = { package: pluginPackage.name, schema };
      }
    }
    if (pluginPackage.group === 'connections') {
      const module = await importPluginExport({ pluginPackage, subpath: './connections' });
      for (const [typeName, connection] of Object.entries(module ?? {})) {
        if (typeName === 'default') continue;
        if (connection?.schema) {
          connections[typeName] = { package: pluginPackage.name, schema: connection.schema };
        }
        for (const [requestType, request] of Object.entries(connection?.requests ?? {})) {
          if (!request?.schema) continue;
          requests[requestType] = { package: pluginPackage.name, schema: request.schema };
        }
      }
    }
  }
  return { blocks, connections, operators, requests };
}

function listContentFiles(directory = contentDirectory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      listContentFiles(entryPath, files);
      continue;
    }
    if (entry.name.endsWith('.md')) files.push(entryPath);
  }
  return files.sort();
}

// A markdown fence opens on a line whose first non-space characters are three or
// more backticks and closes on the next line ending in a run of at least that
// many. The length matters: a docs example of a markdown block holds a fence of
// its own, and the page wraps it in a longer one, so a scanner that treats every
// ``` alike closes the outer fence on the inner one and calls the rest of the
// page unterminated. Closing backticks are matched at the end of a line rather
// than on a line of their own because extractAgentDocs can emit a body and its
// closing fence on one line; a scanner that demands a bare ``` pairs that opener
// with the next fence's opener and mis-slices the rest of the file. An opener
// left unclosed at EOF is reported, never silently dropped.
function readFences({ markdown }) {
  const fences = [];
  let open = null;
  markdown.split('\n').forEach((line, index) => {
    if (open === null) {
      const opening = line.match(/^\s*(`{3,})(.*)$/);
      if (opening === null) return;
      open = {
        body: [],
        language: opening[2].trim(),
        line: index + 1,
        marker: opening[1].length,
      };
      return;
    }
    const closing = line.match(/^(.*?)\s*(`{3,})\s*$/);
    if (closing === null || closing[2].length < open.marker) {
      open.body.push(line);
      return;
    }
    if (closing[1] !== '') open.body.push(closing[1]);
    const { marker, ...fence } = open;
    fences.push({ ...fence, body: open.body.join('\n') });
    open = null;
  });
  if (open !== null) {
    const { marker, ...fence } = open;
    fences.push({ ...fence, body: open.body.join('\n'), unterminated: true });
  }
  return fences;
}

// A fence that shows a fragment of config - two alternative spellings of one key,
// an ellipsis standing in for a subtree, a deliberately invalid value - cannot be
// judged as config and says so on its first line. Nothing in the corpus needs it
// today: a fence is only validated where it positively claims a schema, so a
// fragment with no `type:`, no `_operator` root and no `lowdefy:` version is
// already skipped by shape. The marker is here for the fence that claims a schema
// and still means something the schema cannot express.
const FRAGMENT_MARKER = '# fragment';

function isFragment({ body }) {
  return body.split('\n')[0].trim() === FRAGMENT_MARKER;
}

// extractAgentDocs writes some example values with String(), leaving the literal
// `[object Object]` where the example should be. Such a fence carries no config
// to validate; it is counted so the defect cannot spread unnoticed.
function isStringifiedObject({ body }) {
  return body.trim() === '[object Object]';
}

// Marks a node whose value cannot be judged before the app runs. Same rule as the
// build's validateBlockProperties: an operator's result is unknown, and null in
// config means "not set", so both are left out of the data that is validated. An
// array holding an operator is left out whole - its length is unknown, so
// minItems or a positional schema would reject a literal that is fine.
const OMIT = Symbol('omit');

function getOperatorName(node) {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return null;
  const keys = Object.keys(node);
  if (keys.length !== 1 || !keys[0].startsWith('_')) return null;
  return keys[0];
}

function copyLiteralNodes(node) {
  if (node === null) return OMIT;
  if (getOperatorName(node) !== null) return OMIT;
  if (Array.isArray(node)) {
    const items = node.map((item) => copyLiteralNodes(item));
    if (items.includes(OMIT)) return OMIT;
    return items;
  }
  if (typeof node !== 'object') return node;
  const copy = {};
  for (const key of Object.keys(node)) {
    if (key.startsWith('~')) continue;
    const value = copyLiteralNodes(node[key]);
    if (value === OMIT) continue;
    copy[key] = value;
  }
  return copy;
}

// A docs fence shows the keys the passage is about, not a runnable app, and an
// operator may supply a key that is absent from the literal config. Required is
// therefore not checked; the drift this exists to catch is a property that no
// longer exists, which additionalProperties reports.
function isEmptySchema(schema) {
  return schema !== null && typeof schema === 'object' && Object.keys(schema).length === 0;
}

function stripRequired(schema) {
  if (Array.isArray(schema)) return schema.map((item) => stripRequired(item));
  if (schema === null || typeof schema !== 'object') return schema;
  const copy = {};
  for (const key of Object.keys(schema)) {
    if (key === 'required' && Array.isArray(schema[key])) continue;
    const stripped = stripRequired(schema[key]);
    // A oneOf/anyOf whose branches differ only in which keys they require -
    // Elasticsearch's "node or nodes" is the shape - loses its power to
    // discriminate once required is gone: every branch matches everything, so
    // oneOf then reports "must match exactly one" against data that is fine.
    if (
      (key === 'oneOf' || key === 'anyOf') &&
      Array.isArray(stripped) &&
      stripped.some(isEmptySchema)
    ) {
      continue;
    }
    copy[key] = stripped;
  }
  return copy;
}

const validators = new Map();

function describeError(error) {
  const property = error.params?.additionalProperty;
  return `${error.instancePath || '/'} ${error.message}${property ? ` ("${property}")` : ''}`;
}

// Ajv reports a oneOf/anyOf failure together with every branch's own errors. The
// branch errors describe schemas the data was never meant to match, so only the
// shallowest oneOf/anyOf error at a path is kept - the same collapse the build's
// validateBlockProperties applies before it reports a block property error.
function collapseBranchErrors(errors) {
  const branchPaths = errors
    .filter((error) => error.keyword === 'oneOf' || error.keyword === 'anyOf')
    .map((error) => error.instancePath);
  return errors.filter((error) => {
    const isBranchError = error.keyword === 'oneOf' || error.keyword === 'anyOf';
    return !branchPaths.some((branchPath) => {
      if (isBranchError && branchPath === error.instancePath) return false;
      return error.instancePath === branchPath || error.instancePath.startsWith(`${branchPath}/`);
    });
  });
}

function validateAgainst({ data, key, omit = [], schema }) {
  const literal = copyLiteralNodes(data);
  if (literal === OMIT) return [];
  for (const property of omit) delete literal[property];
  if (!validators.has(key)) {
    validators.set(key, compileSchema({ schema: stripRequired(schema) }));
  }
  const { errors, valid } = validators.get(key)(literal);
  if (valid) return [];
  return collapseBranchErrors(errors).map(describeError);
}

// What a fence claims to be decides what it is checked against as a whole
// document. A shape with no claim - a bare options list, a menu, a table of
// values - is skipped and counted, never guessed at. Its nested block and
// operator nodes are still walked, so a skipped fence is not an unchecked one.
function classifyFence({ document, schemas }) {
  if (getOperatorName(document) !== null) return { kind: 'operator' };
  if (Array.isArray(document)) {
    if (document.length === 0) return { kind: 'skipped', reason: 'empty array' };
    const kinds = document.map((item) => classifyFence({ document: item, schemas }));
    for (const kind of ['block', 'request', 'connection']) {
      if (kinds.every((item) => item.kind === kind)) return { kind: `${kind}s` };
    }
    return { kind: 'skipped', reason: 'array of mixed or unrecognised entries' };
  }
  if (document === null || typeof document !== 'object') {
    return { kind: 'skipped', reason: 'not a mapping' };
  }
  if (typeof document.lowdefy === 'string') return { kind: 'lowdefy' };
  if (typeof document.type !== 'string') return { kind: 'skipped', reason: 'no type' };
  if (schemas.blocks[document.type]) return { kind: 'block' };
  if (schemas.requests[document.type]) return { kind: 'request' };
  if (schemas.connections[document.type]) return { kind: 'connection' };
  return { kind: 'skipped', reason: `unknown type "${document.type}"` };
}

// `properties.title` on a page's root block sets the browser tab title (the
// client's Head.js) whatever the block type, and the build exempts it there -
// see validateBlockProperties' isPageRootBlock. A fence reaches a page root two
// ways: as an entry of a `pages` array, or as a whole document, which is the
// shape of a page file.
function omitsPageTitle({ kind, nodePath, schema }) {
  if (kind !== 'block') return false;
  if (nodePath !== '' && !/^\/pages\/\d+$/.test(nodePath)) return false;
  return schema.properties?.title === undefined;
}

// Block, request and connection schemas each describe the `properties` object of
// their config node, wherever that node sits. Walking the whole document rather
// than only its root is what reaches the blocks nested under `blocks`, `slots`
// and `areas`, and the operators used as property values - between them the bulk
// of the corpus, and where a renamed property is most likely to be left behind.
function walkNodes({ document, path: nodePath, report, schemas, visit }) {
  if (Array.isArray(document)) {
    document.forEach((item, index) =>
      walkNodes({ document: item, path: `${nodePath}/${index}`, report, schemas, visit })
    );
    return;
  }
  if (document === null || typeof document !== 'object') return;

  const operatorName = getOperatorName(document);
  if (operatorName !== null) {
    // `_json.stringify` and `_change_case.capitalCase` are one operator with a
    // method; the schema is registered under the name before the dot.
    const typeName = operatorName.split('.')[0];
    const schema = schemas.operators[typeName]?.schema?.params;
    if (schema) {
      visit('operator');
      validateAgainst({
        data: document[operatorName],
        key: `operator:${typeName}`,
        schema,
      }).forEach((message) =>
        report({ node: nodePath, problem: `${operatorName} params${message}` })
      );
    }
    // An operator's params are its own data, not config nodes to be walked.
    return;
  }

  for (const [kind, map] of [
    ['block', schemas.blocks],
    ['request', schemas.requests],
    ['connection', schemas.connections],
  ]) {
    if (typeof document.type !== 'string' || !map[document.type]) continue;
    if (document.properties === undefined) break;
    const schema =
      kind === 'block'
        ? map[document.type].schema.properties.properties
        : map[document.type].schema;
    if (!schema) break;
    visit(kind);
    validateAgainst({
      data: document.properties,
      key: `${kind}:${document.type}`,
      omit: omitsPageTitle({ kind, nodePath, schema }) ? ['title'] : [],
      schema,
    }).forEach((message) =>
      report({ node: nodePath, problem: `${document.type} properties${message}` })
    );
    break;
  }

  for (const key of Object.keys(document)) {
    walkNodes({ document: document[key], path: `${nodePath}/${key}`, report, schemas, visit });
  }
}

// One pass over content/: read every fence, validate the yaml ones against the
// schemas they claim, and count everything else by why it was not validated.
async function scanDocsFences() {
  const schemas = await loadPluginSchemas();
  const counts = {
    fences: 0,
    fragments: 0,
    nodes: { block: 0, connection: 0, operator: 0, request: 0 },
    skipped: 0,
    stringifiedObjects: 0,
    validatedFences: {},
    yamlFences: 0,
  };
  const failures = [];
  const skippedReasons = {};
  const unterminated = [];

  for (const filePath of listContentFiles()) {
    const file = path.relative(packageDirectory, filePath).split(path.sep).join('/');
    for (const fence of readFences({ markdown: fs.readFileSync(filePath, 'utf8') })) {
      counts.fences += 1;
      if (fence.unterminated) unterminated.push(`${file}:${fence.line}`);
      if (fence.language !== 'yaml') continue;
      counts.yamlFences += 1;
      if (isFragment(fence)) {
        counts.fragments += 1;
        continue;
      }
      if (isStringifiedObject(fence)) {
        counts.stringifiedObjects += 1;
        continue;
      }
      let document;
      try {
        document = YAML.parse(fence.body, { logLevel: 'silent' });
      } catch (error) {
        failures.push({
          file,
          line: fence.line,
          node: '',
          problem: `not valid yaml: ${error.message.split('\n')[0]}`,
        });
        continue;
      }
      const report = ({ node, problem }) =>
        failures.push({ file, line: fence.line, node, problem });
      const visit = (kind) => {
        counts.nodes[kind] += 1;
      };
      const { kind, reason } = classifyFence({ document, schemas });
      counts.validatedFences[kind] = (counts.validatedFences[kind] ?? 0) + 1;
      if (kind === 'skipped') {
        counts.skipped += 1;
        skippedReasons[reason] = (skippedReasons[reason] ?? 0) + 1;
      }
      if (kind === 'lowdefy') {
        validateAgainst({ data: document, key: 'lowdefy', schema: lowdefySchema }).forEach(
          (message) => report({ node: '', problem: `lowdefy.yaml${message}` })
        );
      }
      walkNodes({ document, path: '', report, schemas, visit });
    }
  }
  return { counts, failures, schemas, skippedReasons, unterminated };
}

export {
  classifyFence,
  isFragment,
  copyLiteralNodes,
  FRAGMENT_MARKER,
  listContentFiles,
  loadPluginSchemas,
  readFences,
  scanDocsFences,
};
