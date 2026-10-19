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

const DEFAULT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
      Table.configure({
        HTMLAttributes: { class: 'tiptap-table' },
        resizable: table.resizable,
      }),
      TableRow,
      TableHeader,
      TableCell
    );
  }

  if (!image.disabled) {
    extensions.push(
      Image.configure({
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
      Highlight.configure({
        multicolor: highlight.multicolor,
        HTMLAttributes: { style: 'padding: 0;' },
      })
    );
  }

  if (!link.disabled) {
    extensions.push(
      LinkExtension.configure({
        autolink: link.autolink,
        linkOnPaste: link.linkOnPaste,
        openOnClick: link.openOnClick,
        defaultProtocol: link.defaultProtocol,
        // TipTap v2's default. v3's default also skips bare IP addresses and hosts without a TLD
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
