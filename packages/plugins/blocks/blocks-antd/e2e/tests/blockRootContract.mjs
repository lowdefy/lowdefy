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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// The block root contract: every block renders `blockRootProps` from
// @lowdefy/block-utils on the element it owns outermost, so the block itself
// carries `id`, `data-testid` and the app author's `class:` / `style:` rather
// than depending on the client's layout wrapper to carry them.
//
// Whether a file calls the helper is a static fact of its source, so this scan
// needs no browser and no server; Playwright hosts it only because it is the
// runner this package has. It scans every block package in the repo, not just
// this one - the contract is repo-wide and a new block package must not be able
// to opt out by having no e2e suite of its own.

const blocksDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

// Blocks whose whole root is another Lowdefy component that applies the contract
// on their behalf. Editing one of these to render its own root means moving it
// out of this list.
const delegatedRoots = [
  { file: 'blocks-antd/src/blocks/AutoComplete/AutoComplete.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/ButtonSelector/ButtonSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/CheckboxSelector/CheckboxSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/CheckboxSwitch/CheckboxSwitch.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/ColorSelector/ColorSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/DateRangeSelector/DateRangeSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/DateSelector/DateSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/DateTimeSelector/DateTimeSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/MonthSelector/MonthSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/MultipleSelector/MultipleSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/NumberInput/NumberInput.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/PasswordInput/PasswordInput.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/PageHeaderMenu/PageHeaderMenu.js', via: 'Layout' },
  { file: 'blocks-antd/src/blocks/PageSidebarLayout/PageSidebarLayout.js', via: 'Layout' },
  { file: 'blocks-antd/src/blocks/PageSiderMenu/PageSiderMenu.js', via: 'Layout' },
  { file: 'blocks-antd/src/blocks/PhoneNumberInput/PhoneNumberInput.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/RadioSelector/RadioSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/RatingSlider/RatingSlider.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/SegmentedSelector/SegmentedSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/Selector/Selector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/Slider/Slider.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/Switch/Switch.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/TagMultipleSelector/TagMultipleSelector.js', via: 'TagPillRow' },
  { file: 'blocks-antd/src/blocks/TagSelector/TagSelector.js', via: 'TagPillRow' },
  { file: 'blocks-antd/src/blocks/TextArea/TextArea.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/TextInput/TextInput.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/TreeMultipleSelector/TreeMultipleSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/TreeSelector/TreeSelector.js', via: 'Label' },
  { file: 'blocks-antd/src/blocks/WeekSelector/WeekSelector.js', via: 'Label' },
  { file: 'blocks-basic/src/blocks/List/List.js', via: 'Box' },
  { file: 'blocks-diff/src/blocks/DiffGit/DiffGit.js', via: 'DiffShell' },
  { file: 'blocks-diff/src/blocks/DiffList/DiffList.js', via: 'DiffShell' },
  { file: 'blocks-diff/src/blocks/DiffSideBySide/DiffSideBySide.js', via: 'DiffShell' },
  { file: 'blocks-diff/src/blocks/DiffTimeline/DiffTimeline.js', via: 'DiffShell' },
  { file: 'blocks-google-maps/src/blocks/GoogleMaps/GoogleMaps.js', via: 'Map' },
  { file: 'blocks-google-maps/src/blocks/GoogleMapsHeatmap/GoogleMapsHeatmap.js', via: 'Map' },
  { file: 'blocks-loaders/src/blocks/SkeletonAvatar/SkeletonAvatar.js', via: 'Skeleton' },
  { file: 'blocks-loaders/src/blocks/SkeletonButton/SkeletonButton.js', via: 'Skeleton' },
  { file: 'blocks-tiptap/src/blocks/TiptapInput/TiptapInput.js', via: 'Label' },
  { file: 'blocks-tiptap/src/blocks/TiptapMentionInput/TiptapMentionInput.js', via: 'Label' },
];

// Blocks that cannot carry the contract, each with the reason. A new entry needs
// a reason that says why the block owns no root element, not that adding one is
// inconvenient.
const exemptBlocks = [
  {
    file: 'blocks-basic/src/blocks/Icon/Icon.js',
    reason:
      'renders the client-provided Icon component (packages/client/src/createIcon.js), which owns the root and applies id and the element slot itself',
  },
  {
    file: 'blocks-basic/src/blocks/Throw/Throw.js',
    reason: 'throws instead of rendering, so it has no root element',
  },
  {
    file: 'blocks-google-maps/src/blocks/GoogleMapsScript/GoogleMapsScript.js',
    reason:
      'renders LoadScriptNext, which returns its children and no DOM of its own; its id prop names the injected script tag, not a block root',
  },
];

// A block main file is <BlockName>/<BlockName>.js in a package's src/blocks tree.
// Everything else in that tree is a helper the block imports.
function listBlockMainFiles() {
  const files = [];
  fs.readdirSync(blocksDirectory, { withFileTypes: true }).forEach((packageEntry) => {
    if (!packageEntry.isDirectory()) return;
    const blocksRoot = path.join(blocksDirectory, packageEntry.name, 'src', 'blocks');
    if (!fs.existsSync(blocksRoot)) return;
    fs.readdirSync(blocksRoot, { withFileTypes: true }).forEach((blockEntry) => {
      if (!blockEntry.isDirectory()) return;
      ['js', 'jsx'].forEach((extension) => {
        const main = path.join(blocksRoot, blockEntry.name, `${blockEntry.name}.${extension}`);
        if (!fs.existsSync(main)) return;
        files.push({
          file: [
            packageEntry.name,
            'src',
            'blocks',
            blockEntry.name,
            `${blockEntry.name}.${extension}`,
          ].join('/'),
          path: main,
        });
      });
    });
  });
  return files.sort((a, b) => a.file.localeCompare(b.file));
}

function callsBlockRootProps({ path: filePath }) {
  return fs.readFileSync(filePath, 'utf8').includes('blockRootProps(');
}

export { blocksDirectory, callsBlockRootProps, delegatedRoots, exemptBlocks, listBlockMainFiles };
