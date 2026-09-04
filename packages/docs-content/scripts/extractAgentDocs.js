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
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import YAML from 'yaml';

import { type } from '@lowdefy/helpers';
import { nunjucksFunction } from '@lowdefy/nunjucks';

// Runs inside the docs app build (see packages/docs/templates/generateSiteAssets.js),
// where pages are fully resolved: _refs inlined, template vars substituted.
// Markdown content lives on Markdown/MarkdownWithCode block properties in
// document order, so a plain block walk reconstructs each page as markdown.

// The block types that carry a page's prose. Content on one of these that does
// not resolve to a string is prose the agent will never see, so it is reported
// rather than dropped in silence.
const MARKDOWN_TYPES = new Set(['Markdown', 'MarkdownWithCode']);

function sectionKind(section) {
  if (section === 'Controls') return 'control';
  if (section.endsWith('Blocks')) return 'block';
  if (section === 'Operators') return 'operator';
  if (section === 'Actions') return 'action';
  if (section === 'Connections') return 'connection';
  return undefined;
}

// Build-time reference and key markers, which are config bookkeeping rather than
// anything a reader of the docs should see in an example.
function isMarkerKey(key) {
  return type.isString(key) && key.length >= 2 && key[0] === '~';
}

function stripMarkers(value) {
  if (type.isArray(value)) {
    return value.map(stripMarkers);
  }
  if (!type.isObject(value)) {
    return value;
  }
  const stripped = {};
  for (const key of Object.keys(value)) {
    if (isMarkerKey(key)) continue;
    stripped[key] = stripMarkers(value[key]);
  }
  return stripped;
}

// Docs example panels hand a config object to a template as
// `_custom_yaml_stringify`, an operator the docs app resolves in the browser.
// Extraction happens before that, so the operator is resolved here the same way
// packages/docs/src/operators/client/yaml_stringify.js resolves it.
function yamlStringifyParams(params) {
  if (type.isArray(params)) return { input: params[0], options: params[1] };
  if (type.isObject(params) && 'on' in params) return { input: params.on, options: params.options };
  return { input: params };
}

// Nunjucks renders a variable with String(), so an object reaches the page as the
// literal `[object Object]` - a fence that carries no config at all. Every docs
// example variable is config, so an object is rendered as the yaml the reader is
// meant to copy.
function renderTemplateVar(value) {
  if (!type.isObject(value) && !type.isArray(value)) return value;
  const { input, options } =
    type.isObject(value) && '_custom_yaml_stringify' in value
      ? yamlStringifyParams(value._custom_yaml_stringify)
      : { input: value };
  if (type.isNone(input)) return '';
  return YAML.stringify(stripMarkers(input), options);
}

function renderTemplateVars(on) {
  if (!type.isObject(on)) return {};
  const rendered = {};
  for (const key of Object.keys(on)) {
    rendered[key] = renderTemplateVar(on[key]);
  }
  return rendered;
}

// Docs pages wrap prose in _nunjucks to interpolate release facts, for example
// packages/docs/concepts/api.yaml. The build walker has already inlined the
// _refs that carry the template and its vars, so the template renders here.
function resolveContent(value) {
  if (type.isString(value)) {
    return value;
  }
  if (!type.isObject(value)) {
    return null;
  }
  const params = value._nunjucks;
  if (type.isString(params)) {
    return nunjucksFunction(params)({});
  }
  if (type.isObject(params) && type.isString(params.template)) {
    return nunjucksFunction(params.template)(renderTemplateVars(params.on));
  }
  return null;
}

function resolvePageSections(pages, menus) {
  const sectionMap = new Map();
  function walkLinks(links, parentGroup) {
    (links ?? []).forEach((link) => {
      if (link.type === 'MenuGroup') {
        const group = { label: link.properties?.title ?? link.id };
        walkLinks(link.links, group);
      } else if (link.type === 'MenuLink' && link.pageId) {
        if (parentGroup) {
          sectionMap.set(link.pageId, parentGroup);
        }
      }
    });
  }
  (menus ?? []).forEach((menu) => {
    walkLinks(menu.links, null);
  });
  return sectionMap;
}

function extractPageMarkdown(page) {
  const parts = [];
  const unresolved = [];
  let markdownBlocks = 0;
  function collect(value) {
    if (type.isString(value) && value.trim() !== '') {
      parts.push(value.trim());
    }
  }
  function walkBlock(block) {
    if (!block) return;
    // page_title duplicates the manifest title emitted as the markdown h1.
    if (block.id === 'page_title') return;
    const props = block.properties ?? {};
    const content = resolveContent(props.content);
    if (MARKDOWN_TYPES.has(block.type)) {
      markdownBlocks += 1;
      if (!type.isNone(props.content) && !type.isString(content)) {
        unresolved.push(`${block.id} (${block.type})`);
      }
    }
    collect(content);
    collect(type.isString(props.message) ? `> ${props.message}` : null);
    (block.blocks ?? []).forEach(walkBlock);
    // header/footer slots and areas hold site chrome (menu, feedback, newsletter).
    for (const [name, area] of Object.entries(block.areas ?? {})) {
      if (name === 'header' || name === 'footer') continue;
      (area.blocks ?? []).forEach(walkBlock);
    }
    for (const [name, slot] of Object.entries(block.slots ?? {})) {
      if (name === 'header' || name === 'footer') continue;
      (slot.blocks ?? []).forEach(walkBlock);
    }
  }
  (page.blocks ?? []).forEach(walkBlock);
  return { markdown: parts.join('\n\n'), markdownBlocks, unresolved };
}

function toSlugSegment(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractAgentDocs({ pages, menus, outputDir }) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8')
  );
  const sectionMap = resolvePageSections(pages, menus);
  const contentDir = path.join(outputDir, 'content');
  fs.rmSync(contentDir, { recursive: true, force: true });

  const docs = [];
  pages.filter(Boolean).forEach((page) => {
    const title = page.properties?.title ?? page.id;
    const section = sectionMap.get(page.id)?.label ?? 'Other';
    const { markdown, markdownBlocks, unresolved } = extractPageMarkdown(page);
    // A prose page the agent cannot read is the defect this pack exists to
    // prevent, so losing one fails the build instead of shipping a gap. Pages
    // built only from other blocks (404, demos) carry no prose to lose.
    if (markdown === '' && markdownBlocks > 0) {
      throw new Error(
        `Docs page "${page.id}" has ${markdownBlocks} markdown block(s) but extracted no markdown. Every documented page must reach @lowdefy/docs-content.`
      );
    }
    if (markdown === '') {
      return;
    }
    if (unresolved.length > 0) {
      const blocks = unresolved.join(', ');
      console.warn(
        `Docs page "${page.id}" has content that does not resolve to markdown at build on ${blocks}. That prose is missing from the extracted page.`
      );
    }
    const slug = `${toSlugSegment(section)}/${toSlugSegment(page.id)}`;
    const filePath = `content/${slug}.md`;
    const absolutePath = path.join(outputDir, filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, `# ${title}\n\n${markdown}\n`);

    const doc = { slug, title, section, path: filePath };
    const kind = sectionKind(section);
    if (kind) {
      doc.kind = kind;
      doc.typeName = title;
    }
    docs.push(doc);
  });

  fs.writeFileSync(
    path.join(outputDir, 'index.json'),
    JSON.stringify({ version: packageJson.version, docs }, null, 2)
  );
}

export default extractAgentDocs;
