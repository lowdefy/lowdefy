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

// Translation of the markdown IR node: markdown source -> pdfmake content. The
// pieces live in ./markdown/; this module is the one import for the PDF side.
import markdownToPdfMake from './markdown/markdownToPdfMake.js';
import mdastToPdfMake from './markdown/mdastToPdfMake.js';
import parseMarkdown from './markdown/parseMarkdown.js';
import resolveMarkdownImages from './markdown/resolveMarkdownImages.js';

export default markdownToPdfMake;
export { markdownToPdfMake, mdastToPdfMake, parseMarkdown, resolveMarkdownImages };
