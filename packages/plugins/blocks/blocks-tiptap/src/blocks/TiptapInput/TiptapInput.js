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
import { EditorContent } from '@tiptap/react';

import Label from '@lowdefy/blocks-antd/blocks/Label/Label.js';

import PopoverMenu from '../utils/PopoverMenu.js';
import computeHeightStyle from '../utils/computeHeightStyle.js';
import statusClass from '../utils/statusClass.js';
import useTiptapEditor from '../utils/useTiptapEditor.js';
import useTiptapState from './useTiptapState.js';

import './style.css';

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
  const uploadPolicyRequestId =
    properties.uploadPolicyRequestId ?? properties.s3PostPolicyRequestId;
  const downloadPolicyRequestId = properties.downloadPolicyRequestId;
  const { emit, insertImage } = useTiptapState({
    value,
    methods,
    hasDownloadRequest: !type.isNone(downloadPolicyRequestId),
  });

  const disabled = properties.disabled === true || loading;
  const uploadEnabled = !type.isNone(uploadPolicyRequestId);

  const heightStyle = computeHeightStyle({
    rows: properties.rows,
    autoSize: properties.autoSize,
  });

  const editor = useTiptapEditor({
    disabled,
    emit,
    insertImage,
    methods,
    properties,
    uploadEnabled,
    value,
  });

  // Register upload-policy and download-policy events once (if configured).
  useEffect(() => {
    if (!uploadEnabled) return;
    if (!type.isNone(properties.s3PostPolicyRequestId)) {
      console.warn(
        'TiptapInput property "s3PostPolicyRequestId" is deprecated. Use "uploadPolicyRequestId" instead.'
      );
    }
    methods.registerEvent({
      name: '__getUploadPolicy',
      actions: [
        {
          id: '__getUploadPolicy',
          type: 'Request',
          params: [uploadPolicyRequestId],
        },
      ],
    });
    if (!type.isNone(downloadPolicyRequestId)) {
      methods.registerEvent({
        name: '__getDownloadPolicy',
        actions: [
          {
            id: '__getDownloadPolicy',
            type: 'Request',
            params: [downloadPolicyRequestId],
          },
        ],
      });
    }
  }, []);

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
              {!disabled && <PopoverMenu blockId={blockId} editor={editor} Icon={Icon} />}
            </>
          );
        },
      }}
    />
  );
};

export default withBlockDefaults(TiptapInput);
