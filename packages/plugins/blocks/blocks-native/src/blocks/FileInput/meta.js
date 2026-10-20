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

import label from '../../schemas/inputLabel.js';
import { disabled, inputTitle, theme } from '../../schemas/inputProperties.js';

// FileInput has no web block of its name: a page that uses it is mobile only. It picks from Photos
// (photos and videos) and Files in every shell, and the camera in shells that carry it.
export default {
  category: 'input',
  icons: ['Paperclip', 'X', 'File'],
  valueType: 'array',
  cssKeys: {
    element: 'The FileInput element.',
    label: 'The FileInput label.',
    extra: 'The FileInput extra content.',
    feedback: 'The FileInput validation feedback.',
  },
  events: {
    onChange: {
      description: 'Trigger actions when files are added or removed.',
      event: { value: 'The files: [{ name, mimeType, size, uri, width?, height?, upload? }].' },
    },
    onError: {
      description: 'Trigger actions when picking or uploading fails.',
      event: { error: 'The error.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      buttonText: { type: 'string', default: 'Add', description: 'The add button text.' },
      disabled,
      fileTypes: {
        type: 'array',
        items: { type: 'string' },
        description: 'MIME types Files offers, like application/pdf. All by default.',
      },
      label,
      maxCount: { type: 'number', description: 'The most files the input holds.' },
      mediaTypes: {
        type: 'array',
        items: { type: 'string', enum: ['images', 'videos'] },
        default: ['images', 'videos'],
        description: 'What Photos and the camera offer.',
      },
      quality: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.7,
        description: 'JPEG quality of photos, 0 to 1.',
      },
      sources: {
        type: 'array',
        items: { type: 'string', enum: ['photos', 'camera', 'files'] },
        description: 'Where files come from: photos, camera and files by default.',
      },
      theme,
      title: inputTitle,
      upload: {
        type: 'object',
        required: ['endpointId'],
        description:
          'Upload each file as it is added to an API endpoint, called with { ...payload, file: { name, mimeType, size, base64 } }; the file keeps the answer as "upload".',
        properties: {
          endpointId: { type: 'string' },
          payload: { type: 'object' },
        },
        additionalProperties: false,
      },
    },
  },
};
