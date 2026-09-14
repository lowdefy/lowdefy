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

// The single document font for reports: pdfmake's bundled Roboto, referenced by
// the absolute paths pdfmake itself ships (`pdfmake/fonts/Roboto.js`). Both of
// pdfmake's font paths — provideFont for document text and the SVG font
// callback that hands svg-to-pdfkit the raw descriptor — then open the same real
// file, and pdfkit caches it. A virtual-filesystem layer was tried and only the
// document-text path read through it; every SVG <text> logged ENOENT and fell
// back to the default face. The same files feed takumi, so Html-block text and
// document text share one face.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const FONT_FAMILY = 'Roboto';

// pdfmake font descriptors: role → absolute path. pdfmake pairs Roboto's Medium
// weight with its bold role.
export const fontDescriptors = Object.freeze({
  [FONT_FAMILY]: require('pdfmake/fonts/Roboto.js').Roboto,
});

const files = fontDescriptors[FONT_FAMILY];

export const fonts = Object.freeze({
  regular: fs.readFileSync(files.normal),
  bold: fs.readFileSync(files.bold),
  italic: fs.readFileSync(files.italics),
  boldItalic: fs.readFileSync(files.bolditalics),
});

export default fonts;
