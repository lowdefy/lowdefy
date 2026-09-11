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

import { fonts } from '../../fonts/fonts.js';
import { PdfDocument, virtualFileSystem } from './pdfmakeModules.js';

// The bundled Roboto faces, registered once into pdfmake's virtual filesystem.
// Buffers cannot be passed directly as font descriptor values — the Printer's
// URL resolver treats non-string descriptor values as URL objects and would
// discard them — so the Buffers are stored as virtual files and referenced by
// path. pdfmake reads the Buffer back from the VFS when it embeds the font.
export const FONT_FILES = {
  normal: 'Roboto-Regular.ttf',
  bold: 'Roboto-Bold.ttf',
  italics: 'Roboto-Italic.ttf',
  bolditalics: 'Roboto-BoldItalic.ttf',
};

// One symbol face answers every role: a bold ▲ at 10pt is indistinguishable
// from a regular one, and a missing role would make pdfmake throw.
export const SYMBOL_FONT_FILES = {
  normal: 'DejaVuSans.ttf',
  bold: 'DejaVuSans.ttf',
  italics: 'DejaVuSans.ttf',
  bolditalics: 'DejaVuSans.ttf',
};

let registered = false;

// pdfmake reads document-text fonts out of the virtual filesystem itself, but
// its SVG font callback hands svg-to-pdfkit the raw descriptor value — the VFS
// file name — which pdfkit then tries to open from disk (ENOENT, and every chart
// label falls back to Helvetica). Register each VFS font file with pdfkit under
// that same name the first time the callback asks for it, so `doc.font(name)`
// resolves to the Buffer and pdfkit caches the face instead of embedding it per
// label. Only the return value's meaning for svg-to-pdfkit changes; pdfmake's own
// callers use getFontFile for a null check.
function patchSvgFontLookup() {
  const { getFontFile } = PdfDocument.prototype;
  PdfDocument.prototype.getFontFile = function getVfsFontFile(family, bold, italics) {
    const file = getFontFile.call(this, family, bold, italics);
    if (
      typeof file === 'string' &&
      this._registeredFonts?.[file] === undefined &&
      this.virtualfs?.existsSync(file)
    ) {
      this.registerFont(file, this.virtualfs.readFileSync(file));
    }
    return file;
  };
}

function registerFonts() {
  if (registered) return;
  patchSvgFontLookup();
  virtualFileSystem.writeFileSync(FONT_FILES.normal, fonts.regular);
  virtualFileSystem.writeFileSync(FONT_FILES.bold, fonts.bold);
  virtualFileSystem.writeFileSync(FONT_FILES.italics, fonts.italic);
  virtualFileSystem.writeFileSync(FONT_FILES.bolditalics, fonts.boldItalic);
  virtualFileSystem.writeFileSync(SYMBOL_FONT_FILES.normal, fonts.symbol);
  registered = true;
}

export default registerFonts;
