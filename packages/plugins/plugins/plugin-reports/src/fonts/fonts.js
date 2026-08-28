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

/**
 * The single document font set for reports: Roboto in four faces (TrueType).
 * Decoded to Buffers once at module load and registered with both pdfmake and
 * (later) takumi, so document text and Html-block text render in the same face
 * — matching the client-side PdfMake action, which ships the same faces.
 */

import { regular, bold, italic, boldItalic } from './robotoBase64.js';

/** The document font family name. */
export const FONT_FAMILY = 'Roboto';

/** Roboto faces as TrueType font Buffers, decoded once at module load. */
export const fonts = Object.freeze({
  regular: Buffer.from(regular, 'base64'),
  bold: Buffer.from(bold, 'base64'),
  italic: Buffer.from(italic, 'base64'),
  boldItalic: Buffer.from(boldItalic, 'base64'),
});

export default fonts;
