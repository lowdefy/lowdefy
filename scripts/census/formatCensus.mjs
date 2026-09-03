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

function renderTable({ rows }) {
  const width = Math.max(...rows.map(([label]) => label.length));
  return rows.map(([label, value]) => `  ${label.padEnd(width)}  ${value}`).join('\n');
}

function formatCensus({ result }) {
  const { escapeHatch, oversizedFiles, comments, duplicates } = result;
  const sections = [
    `Census of ${result.directory}`,
    '',
    renderTable({
      rows: [
        ['YAML files', `${result.yamlFiles}`],
        ['YAML lines', `${result.totalLines}`],
        ['_js lines', `${escapeHatch.jsLines}`],
        ['Html blocks / template lines', `${escapeHatch.htmlBlocks} / ${escapeHatch.htmlLines}`],
        ['_nunjucks lines', `${escapeHatch.nunjucksLines}`],
        ['Escape-hatch share (_js + Html)', `${escapeHatch.share}%`],
        ['Escape-hatch share incl. _nunjucks', `${escapeHatch.shareWithNunjucks}%`],
        [
          `Files > ${oversizedFiles.threshold} lines`,
          `${oversizedFiles.files} (${oversizedFiles.share}%)`,
        ],
        ['Comment lines', `${comments.lines} (${comments.share}%)`],
        ['... saying never/must/because', `${comments.intentLines}`],
        ['_js bodies / distinct', `${duplicates.jsBodies} / ${duplicates.distinctJsBodies}`],
      ],
    }),
  ];

  if (duplicates.duplicateHelpers.length > 0) {
    sections.push(
      '',
      'Helper names declared in _js bodies in more than one file',
      renderTable({
        rows: duplicates.duplicateHelpers.map((helper) => [
          helper.name,
          `${helper.copies} copies in ${helper.files} files`,
        ]),
      })
    );
  }
  if (duplicates.duplicateBodies.length > 0) {
    sections.push(
      '',
      'Identical _js bodies in more than one file',
      renderTable({
        rows: duplicates.duplicateBodies.map((body) => [
          body.preview,
          `${body.copies} copies in ${body.files} files`,
        ]),
      })
    );
  }
  return sections.join('\n');
}

export default formatCensus;
