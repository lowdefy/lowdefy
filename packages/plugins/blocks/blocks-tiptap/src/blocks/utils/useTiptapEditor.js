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

import { useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';

import buildExtensions from './buildExtensions.js';

// The TipTap editor of the TiptapInput and TiptapMentionInput blocks: creates it, registers the
// block's clear, setContent and focus methods, and keeps it in sync with the block's value,
// disabled state and placeholder.
function useTiptapEditor({
  disabled,
  editorProps = {},
  emit,
  insertImage,
  mentionExtension,
  methods,
  properties,
  uploadEnabled,
  value,
}) {
  // The Placeholder extension is created once, so it reads the current text from a ref.
  const placeholderRef = useRef();
  placeholderRef.current = properties.placeholder ?? '';

  const extensions = buildExtensions({
    properties,
    getPlaceholder: () => placeholderRef.current,
    insertImage,
    mentionExtension,
    uploadEnabled,
  });

  const editor = useEditor({
    editorProps,
    extensions,
    content: value?.html || '',
    editable: () => !disabled,
    onUpdate({ editor }) {
      // User-driven change. Emit the full derived value to Lowdefy.
      emit(editor);
      methods.triggerEvent({ name: 'onChange' });
    },
  });

  // Register methods as soon as the editor is available.
  useEffect(() => {
    if (!editor) return;
    // emitUpdate false: the methods emit the value themselves and must not trigger onChange.
    methods.registerMethod('clear', () => {
      editor.commands.clearContent(false);
      emit(editor);
    });
    methods.registerMethod('setContent', (args) => {
      editor.commands.setContent(args?.html ?? '', { emitUpdate: false });
      emit(editor);
    });
    methods.registerMethod('focus', () => {
      editor.commands.focus();
    });
  }, [editor]);

  // External value.html → editor sync. One-way only: we read value.html and
  // push it into the editor with emitUpdate false so tiptap's onUpdate
  // does not fire. No write-back via emit() — that would race with concurrent
  // SetState calls (child effects fire before parent effects, so a sibling's
  // onMount SetState could be overwritten by our derived emit). Derived
  // fields (text/markdown/fileList, and mentions for TiptapMentionInput) are
  // populated on user interaction via onUpdate; downstream consumers of seeded
  // content should read value.html directly, or include the fields they need
  // in their SetState payload.
  useEffect(() => {
    if (!editor) return;
    const next = value?.html ?? '';
    const current = editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value?.html, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({ editable: !disabled });
  }, [editor, disabled]);

  // Redraw the placeholder when its text changes.
  useEffect(() => {
    if (!editor) return;
    editor.view.dispatch(editor.state.tr);
  }, [editor, properties.placeholder]);

  return editor;
}

export default useTiptapEditor;
