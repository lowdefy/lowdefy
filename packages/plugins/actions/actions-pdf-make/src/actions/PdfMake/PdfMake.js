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

import pdfMake from 'pdfmake/build/pdfmake.js';
import { type } from '@lowdefy/helpers';

import adaptPageBreakBefore from './adaptPageBreakBefore.js';
import vfs from '../../fonts/vfs_fonts.js';

const robotoFonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

pdfMake.addVirtualFileSystem(vfs);

async function PdfMake({ params }) {
  const { docDefinition, tableLayouts, filename, fonts } = params;
  // pdfMake is a module-level singleton, so fonts and table layouts are set on every call rather
  // than added, which would carry one call's fonts and layouts into the next.
  pdfMake.setFonts({ ...robotoFonts, ...fonts });
  pdfMake.setTableLayouts(tableLayouts ?? {});
  const definition = type.isFunction(docDefinition.pageBreakBefore)
    ? {
        ...docDefinition,
        pageBreakBefore: adaptPageBreakBefore(docDefinition.pageBreakBefore),
      }
    : docDefinition;
  await pdfMake.createPdf(definition).download(filename);
}

export default PdfMake;
