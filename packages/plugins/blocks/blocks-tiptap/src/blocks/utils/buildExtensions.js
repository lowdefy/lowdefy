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

import FileHandler from '@tiptap/extension-file-handler';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import LinkExtension from '@tiptap/extension-link';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { type } from '@lowdefy/helpers';

import buildStarterKit from './buildStarterKit.js';
import isAllowedLinkUri from './isAllowedLinkUri.js';
import withV2PasteRules from './withV2PasteRules.js';

const DEFAULT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// TipTap v3 extensions read attributes from html that v2 dropped (e.g. width and height on
// pasted images). Removing them keeps the saved html the same as v2 for the same input.
function withoutAttributes(extension, names) {
  return extension.extend({
    addAttributes() {
      const attributes = { ...this.parent?.() };
      names.forEach((name) => {
        delete attributes[name];
      });
      return attributes;
    },
  });
}

const ImageV2 = withoutAttributes(Image, ['width', 'height']);
const LinkV2 = withV2PasteRules(withoutAttributes(LinkExtension, ['title']));
const TableCellV2 = withoutAttributes(TableCell, ['align']);
const TableHeaderV2 = withoutAttributes(TableHeader, ['align']);

// v3 renders a table without resizable columns through a node view that wraps it in a
// div.tableWrapper; v2 rendered it as a plain table.
const TableV2 = Table.extend({
  addNodeView() {
    return null;
  },
});

// For a highlight without data-color, v2 read the colour from the element's style as the
// browser normalises it (rgb()); v3 keeps the colour as written.
const HighlightV2 = withV2PasteRules(
  Highlight.extend({
    addAttributes() {
      const attributes = this.parent?.() ?? {};
      if (!attributes.color) return attributes;
      return {
        ...attributes,
        color: {
          ...attributes.color,
          parseHTML: (element) =>
            element.getAttribute('data-color') || element.style.backgroundColor,
        },
      };
    },
  })
);

const DEFAULTS = {
  image: { disabled: false, maxWidth: '80%', zoom: 0.5 },
  table: { disabled: false, resizable: true },
  link: {
    disabled: false,
    openOnClick: true,
    autolink: true,
    linkOnPaste: true,
    defaultProtocol: 'https',
  },
  highlight: { disabled: false, multicolor: true },
};

function merge(defaults, overrides) {
  if (!type.isObject(overrides)) return defaults;
  return { ...defaults, ...overrides };
}

function buildExtensions({
  properties,
  getPlaceholder,
  insertImage,
  mentionExtension,
  uploadEnabled,
}) {
  const image = merge(DEFAULTS.image, properties.image);
  const table = merge(DEFAULTS.table, properties.table);
  const link = merge(DEFAULTS.link, properties.link);
  const highlight = merge(DEFAULTS.highlight, properties.highlight);
  const allowedMimeTypes = type.isArray(properties.allowedMimeTypes)
    ? properties.allowedMimeTypes
    : DEFAULT_IMAGE_MIME_TYPES;

  const extensions = [buildStarterKit(properties.starterKit)];

  if (!table.disabled) {
    extensions.push(
      TableV2.configure({
        HTMLAttributes: { class: 'tiptap-table' },
        resizable: table.resizable,
      }),
      TableRow,
      TableHeaderV2,
      TableCellV2
    );
  }

  if (!image.disabled) {
    extensions.push(
      ImageV2.configure({
        HTMLAttributes: {
          style: `max-width: ${image.maxWidth}; display: block; zoom: ${image.zoom};`,
        },
      })
    );
  }

  extensions.push(
    Placeholder.configure({
      placeholder: getPlaceholder,
      showOnlyWhenEditable: false,
    })
  );

  if (!highlight.disabled) {
    extensions.push(
      HighlightV2.configure({
        multicolor: highlight.multicolor,
        HTMLAttributes: { style: 'padding: 0;' },
      })
    );
  }

  if (!link.disabled) {
    extensions.push(
      LinkV2.configure({
        autolink: link.autolink,
        linkOnPaste: link.linkOnPaste,
        openOnClick: link.openOnClick,
        defaultProtocol: link.defaultProtocol,
        isAllowedUri: isAllowedLinkUri,
        // v2 default. v3's default also skips bare IP addresses and hosts without a TLD
        // (e.g. localhost:3000), and applies to pasted URLs too.
        shouldAutoLink: (url) => !!url,
      })
    );
  }

  if (mentionExtension) {
    extensions.push(mentionExtension);
  }

  if (uploadEnabled) {
    extensions.push(
      FileHandler.configure({
        onDrop: (editor, files, pos) => {
          files.forEach((file) => insertImage(editor, file, pos));
        },
        onPaste: (editor, files, htmlContent) => {
          if (htmlContent) return false;
          files.forEach((file) => {
            const pos = editor.state.selection.anchor;
            insertImage(editor, file, pos);
          });
        },
        allowedMimeTypes,
      })
    );
  }

  return extensions;
}

export default buildExtensions;
