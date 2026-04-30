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

// Ref-tracked controller for the editor's value. No useState — the only
// source of truth for `fileList` is the `value` prop from Lowdefy. We mirror
// it into a ref each render so callbacks (onUpdate, insertImage) captured in
// closures always read the current value instead of a stale render snapshot.
function useTiptapState({ value, methods }) {
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

  // Emit a full `{fileList, html, text, markdown}` value to Lowdefy based on
  // the editor's current document. When appendFile is supplied (an S3 upload
  // result), it is added to the current fileList before filtering by
  // in-document image urls.
  const emit = (editor, appendFile) => {
    const html = editor.getHTML();
    const markdown = turndownService.turndown(html);
    const json = editor.getJSON();
    const text = editor.getText().trim() === '' ? null : editor.getText();
    const urls = (json.content ?? []).filter((c) => c.type === 'image').map((c) => c.attrs.src);
    const base = valueRef.current?.fileList ?? [];
    const next = appendFile ? [...base, appendFile] : base;
    const fileList = next.filter((f) => urls.includes(f.url));
    methods.setValue({ fileList, html, text, markdown });
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

export default useTiptapState;
