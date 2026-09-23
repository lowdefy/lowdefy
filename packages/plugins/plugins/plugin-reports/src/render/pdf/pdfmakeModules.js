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

// These pdfmake modules are CommonJS. Under Node's ESM interop a default import
// binds to `module.exports`, which itself carries the real value on `.default`
// (the double-default gotcha), so unwrap defensively. This is the only file that
// imports pdfmake internals.
import PrinterModule from 'pdfmake/js/Printer.js';
import URLResolverModule from 'pdfmake/js/URLResolver.js';
import virtualFileSystemModule from 'pdfmake/js/virtual-fs.js';

export const PdfPrinter = PrinterModule.default ?? PrinterModule;
export const URLResolver = URLResolverModule.default ?? URLResolverModule;
export const virtualFileSystem = virtualFileSystemModule.default ?? virtualFileSystemModule;
