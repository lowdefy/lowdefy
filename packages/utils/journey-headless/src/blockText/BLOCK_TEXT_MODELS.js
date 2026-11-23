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

import { type } from '@lowdefy/helpers';

import formatStatisticValue from './formatStatisticValue.js';

// What each block type the headless run knows draws as text (LDF-1147), read from its component
// in the browser: a function of { block, properties, areaNames, ancestors (the blocks holding it,
// nearest first), i18n } that returns
// { pieces, areas, open }.
// - pieces: the text it draws from its evaluated properties, in order, each { html } (drawn with
//   renderHtml, whose HtmlComponent reads the value as a string), { text } (drawn as a React text
//   child) or { markdown, raw, skipHtml } (react-markdown); `pre` keeps white space as written.
// - areas: the areas whose blocks it draws; blocks in any other area are not on the page.
// - open: why some of its text is not known, else null: text the browser draws that a headless
//   run cannot read (a locale's labels, a measured ellipsis, a skeleton), so a check that does not
//   find its text there runs in a browser. A piece marked `unsure` may not show as written (an
//   ellipsis may cut it), so it never passes a check on its own.
// It leaves out text a browser draws only on hover, focus or open: tooltips, placeholders, closed
// dropdowns. Input values are not page text: the browser runner reads innerText, which leaves
// them out.

// A value drawn as html (renderHtml): nothing when none, else its string.
function html(value) {
  return type.isNone(value) ? [] : [{ html: String(value) }];
}

// A value drawn as a React child: a string or number as text, nothing for none or a boolean.
// Returns { pieces, open }: an object or array React draws in a way this does not follow.
function child(value) {
  if (type.isNone(value) || type.isBoolean(value) || value === '')
    return { pieces: [], open: null };
  if (type.isString(value) || type.isNumber(value))
    return { pieces: [{ text: String(value) }], open: null };
  return { pieces: [], open: 'it draws a value that is neither text nor a number' };
}

// The locale's labels antd draws on a Modal's footer buttons, known only for an app with no i18n
// locales (antd's en_US).
function knowsLocale(i18n) {
  return (i18n?.locales ?? []).length === 0;
}

function shortcutOpen(block) {
  return type.isNone(block.Events?.events?.onClick?.shortcut)
    ? null
    : 'it draws its onClick shortcut, which reads by platform';
}

function contentBox({ properties }) {
  // Box and Span draw properties.content in place of their content area when it is set.
  if (properties.content) {
    const { pieces, open } = child(properties.content);
    return { pieces, areas: [], open };
  }
  return { pieces: [], areas: ['content'], open: null };
}

function container() {
  return { pieces: [], areas: ['content'], open: null };
}

function htmlBlock({ properties }) {
  return { pieces: html(properties.html), areas: [], open: null };
}

function typography({ properties }) {
  // A measured ellipsis cuts the text and adds an expand link, and actions draw their own text.
  const cut = Boolean(properties.ellipsis);
  let open = null;
  if (cut) open = 'its ellipsis may cut the text it draws';
  if (!type.isNone(properties.actions)) open = 'it draws actions';
  return {
    pieces: html(properties.content).map((piece) => ({ ...piece, unsure: cut })),
    areas: [],
    open,
  };
}

function markdown({ properties }) {
  return {
    pieces: type.isNone(properties.content)
      ? []
      : [{ markdown: String(properties.content), skipHtml: properties.skipHtml === true }],
    areas: [],
    open: null,
  };
}

// antd's Button puts a space between two Chinese characters it is given as its text.
const TWO_CHINESE_CHARACTERS = /^[\u4e00-\u9fa5]{2}$/;

// The Cancel and OK buttons antd draws in a Modal's footer: a label left undefined is antd's
// default, known only in en_US (no app i18n locales and no ConfigProvider locale above the
// Modal), and a null one draws an empty button.
function popupFooter({ ancestors, i18n, properties }) {
  const labels = [properties.cancelText, properties.okText];
  const localised = ancestors.some(
    (block) => block.type === 'ConfigProvider' && !type.isNone(block.eval?.properties?.locale)
  );
  if (labels.some((label) => type.isUndefined(label)) && (!knowsLocale(i18n) || localised)) {
    return { pieces: [], open: 'its footer buttons are labelled in the app locale' };
  }
  if (labels.some((label) => type.isString(label) && TWO_CHINESE_CHARACTERS.test(label))) {
    return { pieces: [], open: 'antd spaces a two-character Chinese button label' };
  }
  const [cancel, ok] = [
    child(type.isUndefined(properties.cancelText) ? 'Cancel' : properties.cancelText),
    child(type.isUndefined(properties.okText) ? 'OK' : properties.okText),
  ];
  return { pieces: [...cancel.pieces, ...ok.pieces], open: cancel.open ?? ok.open };
}

function descriptionsItems({ properties }) {
  let items = properties.items ?? [];
  if (type.isObject(items)) {
    items = Object.keys(items).map((key) => ({ value: items[key], key }));
  }
  const pieces = [];
  items.forEach((item) => {
    const row = type.isPrimitive(item) ? { value: item, key: String(item) } : (item ?? {});
    pieces.push(...html(row.key || row.label), ...html(row.value));
  });
  // Each item keeps its white space (white-space: pre-wrap).
  return pieces.map((piece) => ({ ...piece, pre: true }));
}

const BLOCK_TEXT_MODELS = {
  Alert: ({ properties }) => {
    const hasCloseText = !type.isNone(properties.closeText) && properties.closeText !== '';
    const close = hasCloseText ? child(properties.closeText) : { pieces: [], open: null };
    return {
      pieces: [...html(properties.message), ...html(properties.description), ...close.pieces],
      areas: ['action'],
      open: close.open,
    };
  },
  Box: contentBox,
  Button: ({ block, properties }) => {
    const titleHidden =
      properties.hideTitle || (properties.shape === 'circle' && type.isNone(properties.title));
    if (titleHidden) return { pieces: [], areas: [], open: null };
    return {
      pieces: html(type.isNone(properties.title) ? block.blockId : properties.title),
      areas: [],
      open: shortcutOpen(block),
    };
  },
  Card: ({ areaNames, properties }) => ({
    pieces: areaNames.has('title') ? [] : html(properties.title),
    // A loading Card draws a skeleton in place of its body.
    areas: ['title', 'extra', 'cover', 'actions', ...(properties.loading ? [] : ['content'])],
    open: null,
  }),
  ClickableHtml: htmlBlock,
  // Its own DOMPurifyOptions may keep or strip what the default sanitiser does not.
  DangerousHtml: ({ properties }) => ({
    pieces: html(properties.html),
    areas: [],
    open: type.isNone(properties.DOMPurifyOptions)
      ? null
      : 'it sanitises with its own DOMPurifyOptions',
  }),
  // It sanitises the markdown as a string before react-markdown reads it, with rehype-raw.
  DangerousMarkdown: ({ properties }) => ({
    pieces: type.isNone(properties.content)
      ? []
      : [{ markdown: String(properties.content), raw: true, sanitize: true }],
    areas: [],
    open: type.isNone(properties.DOMPurifyOptions)
      ? null
      : 'it sanitises with its own DOMPurifyOptions',
  }),
  Descriptions: ({ properties }) => {
    const transforms = (properties.itemOptions ?? []).some(
      (option) => type.isFunction(option?.transformValue) || type.isFunction(option?.transformLabel)
    );
    return {
      pieces: [...html(properties.title), ...(transforms ? [] : descriptionsItems({ properties }))],
      areas: ['extra'],
      open: transforms ? 'its itemOptions transform what it draws' : null,
    };
  },
  // antd draws no title on a vertical Divider.
  Divider: ({ properties }) => ({
    pieces: properties.orientation === 'vertical' ? [] : html(properties.title),
    areas: [],
    open: null,
  }),
  Drawer: ({ properties }) => ({
    pieces: html(properties.title),
    // A loading Drawer draws a skeleton in place of its body.
    areas: ['extra', 'footer', ...(properties.loading ? [] : ['content'])],
    open: null,
  }),
  Flex: container,
  Html: htmlBlock,
  // An icon draws an svg, whose title a browser's innerText does not read.
  Icon: () => ({ pieces: [], areas: [], open: null }),
  Img: () => ({ pieces: [], areas: [], open: null }),
  // Its label: a label area, else its title (its id when the title is no string), with a colon it
  // ends with taken off when antd adds one; none while disabled. Its extra shows while it has no
  // validation status or a success one; a status may show a message, which leaves the text open.
  Label: ({ areaNames, block, properties }) => {
    let pieces = [];
    if (!properties.disabled && !areaNames.has('label')) {
      let label = type.isString(properties.title) ? properties.title : block.blockId;
      if (properties.colon && label.trim() !== '') label = label.replace(/[:|：]\s*$/u, '');
      pieces = label === '' ? [] : html(label);
    }
    const status = block.eval?.validation?.status;
    const hasStatus = !type.isNone(status);
    const showsExtra = !hasStatus || status === 'success';
    return {
      pieces: [...pieces, ...(showsExtra ? html(properties.extra || null) : [])],
      areas: properties.disabled ? ['content'] : ['label', 'content'],
      open: hasStatus ? 'it may show a validation message' : null,
    };
  },
  List: container,
  Markdown: markdown,
  MarkdownWithCode: markdown,
  // A loading Modal draws a skeleton in place of its body and no footer. footer: false draws no
  // footer, a footer area draws its blocks in place of the buttons.
  Modal: ({ ancestors, areaNames, i18n, properties }) => {
    if (properties.loading) {
      return { pieces: html(properties.title), areas: [], open: null };
    }
    if (properties.footer === false) {
      return { pieces: html(properties.title), areas: ['content'], open: null };
    }
    if (areaNames.has('footer')) {
      return { pieces: html(properties.title), areas: ['content', 'footer'], open: null };
    }
    const footer = popupFooter({ ancestors, i18n, properties });
    return {
      pieces: [...html(properties.title), ...footer.pieces],
      areas: ['content'],
      open: footer.open,
    };
  },
  Paragraph: typography,
  Span: contentBox,
  Statistic: ({ properties }) => {
    if (properties.loading || type.isObject(properties.timer)) {
      return {
        pieces: html(properties.title),
        areas: [],
        open: properties.loading ? 'it draws a skeleton while loading' : 'it draws a timer',
      };
    }
    const prefix = properties.prefixIcon ? child(null) : child(properties.prefix);
    const suffix = properties.suffixIcon ? child(null) : child(properties.suffix);
    const value = formatStatisticValue({
      value: type.isNone(properties.value) ? '' : properties.value,
      precision: properties.precision,
      decimalSeparator: properties.decimalSeparator || undefined,
      groupSeparator: properties.groupSeparator ?? undefined,
    });
    return {
      pieces: [...html(properties.title), ...prefix.pieces, { text: value }, ...suffix.pieces],
      areas: [],
      open: prefix.open ?? suffix.open,
    };
  },
  Tag: ({ block, properties }) => {
    const title = type.isString(properties.title)
      ? { pieces: html(properties.title), open: null }
      : child(properties.title ?? block.blockId);
    return { pieces: title.pieces, areas: [], open: title.open ?? shortcutOpen(block) };
  },
  Title: typography,
};

export default BLOCK_TEXT_MODELS;
