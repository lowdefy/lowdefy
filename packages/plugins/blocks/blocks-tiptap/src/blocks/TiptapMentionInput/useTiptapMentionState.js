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

import { useRef } from 'react';
import TurndownService from 'turndown';

import s3FileUpload from '../utils/s3FileUpload.js';

// Ref-tracked controller for the mention editor's value. Mirrors TiptapInput's
// useTiptapState but also extracts mentions from the document.
function useTiptapMentionState({ value, methods }) {
  const valueRef = useRef(value);
  valueRef.current = value;

  const turndownService = new TurndownService();
  turndownService.addRule('encodeImgUrl', {
    filter: 'img',
    replacement: (content, node) => {
      const src = node.getAttribute('src');
      return `![${content}](${encodeURI(src)})`;
    },
  });

  const emit = (editor, appendFile) => {
    const html = editor.getHTML();
    const markdown = turndownService.turndown(html);
    const json = editor.getJSON();
    const text = editor.getText().trim() === '' ? null : editor.getText();
    const urls = (json.content ?? []).filter((c) => c.type === 'image').map((c) => c.attrs.src);
    const base = valueRef.current?.fileList ?? [];
    const next = appendFile ? [...base, appendFile] : base;
    const fileList = next.filter((f) => urls.includes(f.url));

    const mentionsMap = new Map();
    (json.content ?? [])
      .filter((c) => c.type === 'paragraph')
      .forEach((c) => {
        c.content?.forEach((cc) => {
          if (cc.type === 'mention') {
            mentionsMap.set(JSON.stringify(cc.attrs.id.value), cc.attrs.id.value);
          }
        });
      });
    const mentions = Array.from(mentionsMap.values());

    methods.setValue({ fileList, html, mentions, text, markdown });
  };

  const insertImage = async (editor, file, pos) => {
    const url = await s3FileUpload({ file, methods });
    editor
      .chain()
      .insertContentAt(pos, [
        { type: 'image', attrs: { src: url } },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: url, target: '_blank' } }],
              text: 'Enlarge Image',
            },
          ],
        },
      ])
      .focus()
      .run();
    const fileObj = {
      bucket: file.bucket,
      key: file.key,
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      status: file.status,
      type: file.type,
      url,
    };
    emit(editor, fileObj);
  };

  return { emit, insertImage };
}

export default useTiptapMentionState;
