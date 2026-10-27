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

export default {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to share.' },
      url: { type: 'string', description: 'A link to share.' },
      uri: {
        type: 'string',
        description:
          'A file on the phone to share (the uri PickFile, PickImage, TakePhoto or ScanDocument returned), or an https URL of a file the shell downloads first.',
      },
      base64: {
        type: 'string',
        description:
          'File content made on the page, base64 encoded (a PDF, say), shared as a file named "name".',
      },
      name: { type: 'string', description: 'The file name for "base64", like "report.pdf".' },
      mimeType: { type: 'string', description: 'The file type, like application/pdf.' },
      title: { type: 'string', description: 'The share sheet title (Android) or email subject.' },
    },
    additionalProperties: false,
  },
};
