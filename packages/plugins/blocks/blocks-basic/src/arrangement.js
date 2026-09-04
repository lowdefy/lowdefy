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

/*
  Class maps shared by the Row, Stack and Grid arrangement blocks.

  Every value is a complete literal class string. Tailwind's scanner reads the
  built JS of every block package as plain text (build/src/build/writePluginImports/
  collectBlockSourceContent.js), so a class only reaches the stylesheet if it appears
  here whole — never composed from fragments at runtime.

  The meta.js of each block derives its property enums from these maps, so the
  schema an agent reads and the classes the block can emit cannot drift apart.
*/

const GAP = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const JUSTIFY = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const WRAP = {
  wrap: 'flex-wrap',
  nowrap: 'flex-nowrap',
  reverse: 'flex-wrap-reverse',
};

const COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
  10: 'grid-cols-10',
  12: 'grid-cols-12',
  16: 'grid-cols-16',
  24: 'grid-cols-24',
};

const COLUMNS_SM = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
  8: 'sm:grid-cols-8',
  10: 'sm:grid-cols-10',
  12: 'sm:grid-cols-12',
  16: 'sm:grid-cols-16',
  24: 'sm:grid-cols-24',
};

const COLUMNS_MD = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  8: 'md:grid-cols-8',
  10: 'md:grid-cols-10',
  12: 'md:grid-cols-12',
  16: 'md:grid-cols-16',
  24: 'md:grid-cols-24',
};

const ROWS = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
};

/*
  The client renders a slot's children inside an Area (.lf-row) and wraps each child
  in a BlockLayout (.lf-col) that carries the child's #bl-<id>, class: and style:.
  `display: contents` on the Area removes only the Area's own box, so each child box
  becomes a direct flex or grid item of the arrangement block while every id, class
  and style stays exactly where it was.
*/
const SLOT_DISPLAY_CONTENTS = { display: 'contents' };

/*
  .lf-col carries the legacy 24-column rule `flex: 0 0 <span/24>` and a matching
  max-width, which would make every child of a Row full width. These two utilities
  clear it. They live in Tailwind's utilities layer, which globals.css orders after
  the components layer grid.css writes into, so they win against .lf-col; :where()
  drops them to zero specificity, so a class on the child (`grow`, `basis-1/3`,
  `w-64`, `col-span-8`) still wins against them.
*/
const CHILD_SIZE_RESET =
  '[:where(&>.lf-row>.lf-col)]:basis-auto [:where(&>.lf-row>.lf-col)]:max-w-none';

export {
  ALIGN,
  CHILD_SIZE_RESET,
  COLUMNS,
  COLUMNS_MD,
  COLUMNS_SM,
  GAP,
  JUSTIFY,
  ROWS,
  SLOT_DISPLAY_CONTENTS,
  WRAP,
};
