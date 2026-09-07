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

// The single document font set for reports: Roboto in four faces, decoded once
// to Buffers and registered with pdfmake and the Html renderer so document text
// and Html-block text share one face. The faces come from pdfmake's own shipped
// font container rather than a copy of the base64 blobs — pdfmake is already a
// dependency, so carrying the same 800 KB again would only be a second place for
// the faces to drift.
//
// pdfmake's font container is CommonJS (`module.exports = fontContainer`); under
// Node's ESM interop the default import is that object, unwrapped defensively.
import robotoModule from 'pdfmake/build/fonts/Roboto.js';

const roboto = robotoModule.default ?? robotoModule;

export const FONT_FAMILY = 'Roboto';

function decodeFace(fileName) {
  return Buffer.from(roboto.vfs[fileName].data, 'base64');
}

// pdfmake pairs Roboto's Medium weight with its bold role, so bold and boldItalic
// map to the Medium faces.
export const fonts = Object.freeze({
  regular: decodeFace(roboto.fonts.Roboto.normal),
  bold: decodeFace(roboto.fonts.Roboto.bold),
  italic: decodeFace(roboto.fonts.Roboto.italics),
  boldItalic: decodeFace(roboto.fonts.Roboto.bolditalics),
});

export default fonts;
