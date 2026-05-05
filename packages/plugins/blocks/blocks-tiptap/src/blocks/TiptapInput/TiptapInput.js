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

import React, { useEffect } from 'react';
import { withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';
import { useEditor, EditorContent } from '@tiptap/react';

import Label from '@lowdefy/blocks-antd/blocks/Label/Label.js';

import PopoverMenu from '../utils/PopoverMenu.js';
import buildExtensions from '../utils/buildExtensions.js';
import computeHeightStyle from '../utils/computeHeightStyle.js';
import statusClass from '../utils/statusClass.js';
import useTiptapState from './useTiptapState.js';

import './style.module.css';

const TiptapInput = ({
  blockId,
  components: { Icon, Link },
  events,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  const { emit, insertImage } = useTiptapState({ value, methods });

  const disabled = properties.disabled === true || loading;
  const uploadEnabled = !type.isNone(properties.s3PostPolicyRequestId);

  const extensions = buildExtensions({
    properties,
    insertImage,
    uploadEnabled,
  });

  const heightStyle = computeHeightStyle({
    rows: properties.rows,
    autoSize: properties.autoSize,
  });

  const editor = useEditor({
    extensions,
    content: value?.html || '',
    editable: () => !disabled,
    onUpdate({ editor }) {
      // User-driven change. Emit the full derived value to Lowdefy.
      emit(editor);
      methods.triggerEvent({ name: 'onChange' });
    },
  });

  // Register upload-policy event once (if configured).
  useEffect(() => {
    if (!uploadEnabled) return;
    methods.registerEvent({
      name: '__getS3PostPolicy',
      actions: [
        {
          id: '__getS3PostPolicy',
          type: 'Request',
          params: [properties.s3PostPolicyRequestId],
        },
      ],
    });
  }, []);

  // Register methods as soon as the editor is available.
  useEffect(() => {
    if (!editor) return;
    methods.registerMethod('clear', () => {
      editor.commands.clearContent();
      emit(editor);
    });
    methods.registerMethod('setContent', (args) => {
      editor.commands.setContent(args?.html ?? '');
      emit(editor);
    });
    methods.registerMethod('focus', () => {
      editor.commands.focus();
    });
  }, [editor]);

  // External value.html → editor sync. One-way only: we read value.html and
  // push it into the editor with setContent(..., false) so tiptap's onUpdate
  // does not fire. No write-back via emit() — that would race with concurrent
  // SetState calls (child effects fire before parent effects, so a sibling's
  // onMount SetState could be overwritten by our derived emit). Derived
  // fields (text/markdown/fileList) are populated on user interaction via
  // onUpdate; downstream consumers of seeded content should read value.html
  // directly, or include the fields they need in their SetState payload.
  useEffect(() => {
    if (!editor) return;
    const next = value?.html ?? '';
    const current = editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, false);
    }
  }, [value?.html, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({ editable: !disabled });
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const placeholderExt = editor.extensionManager.extensions.find(
      (extension) => extension.name === 'placeholder'
    );
    if (placeholderExt) {
      placeholderExt.options.placeholder = properties.placeholder ?? '';
      editor.view.dispatch(editor.state.tr);
    }
  }, [editor, properties.placeholder]);

  const wrapperClass = [
    'tiptap-wrapper',
    properties.bordered === false ? 'tiptap-wrapper-borderless' : '',
    disabled ? 'tiptap-wrapper-disabled' : '',
    statusClass(validation?.status),
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperStyle = {
    padding: 0,
    ...heightStyle,
    ...properties.inputStyle,
    ...properties.style,
  };

  return (
    <Label
      blockId={blockId}
      components={{ Icon, Link }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => {
          if (!editor) {
            return <div />;
          }
          return (
            <>
              <EditorContent
                id={`${blockId}_input`}
                editor={editor}
                className={wrapperClass}
                style={wrapperStyle}
              />
              {!disabled && <PopoverMenu editor={editor} Icon={Icon} />}
            </>
          );
        },
      }}
    />
  );
};

export default withBlockDefaults(TiptapInput);
