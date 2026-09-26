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

// Built-in semantic icon names. Apps use these instead of picking an icon per
// use, so an app looks consistent by default, and an icon set plugin or
// theme.icons.aliases can re-skin every use at once. Targets are canonical
// Lucide names (a build test checks each one).
const defaultIconAliases = {
  add: 'Plus',
  'arrow-down': 'ArrowDown',
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'arrow-up': 'ArrowUp',
  attach: 'Paperclip',
  bell: 'Bell',
  calendar: 'Calendar',
  chart: 'ChartColumn',
  check: 'Check',
  'chevron-down': 'ChevronDown',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'chevron-up': 'ChevronUp',
  clock: 'Clock',
  close: 'X',
  copy: 'Copy',
  delete: 'Trash',
  document: 'FileText',
  download: 'Download',
  drag: 'GripVertical',
  edit: 'Pencil',
  error: 'CircleX',
  'external-link': 'ExternalLink',
  file: 'File',
  filter: 'Funnel',
  folder: 'Folder',
  globe: 'Globe',
  grid: 'LayoutGrid',
  heart: 'Heart',
  help: 'CircleQuestionMark',
  hide: 'EyeOff',
  history: 'RotateCcwClock',
  home: 'House',
  image: 'Image',
  info: 'Info',
  link: 'Link',
  list: 'List',
  loading: 'LoaderCircle',
  location: 'MapPin',
  lock: 'Lock',
  login: 'LogIn',
  logout: 'LogOut',
  mail: 'Mail',
  menu: 'Menu',
  message: 'MessageSquare',
  minus: 'Minus',
  more: 'Ellipsis',
  'more-vertical': 'EllipsisVertical',
  phone: 'Phone',
  print: 'Printer',
  refresh: 'RefreshCw',
  save: 'Save',
  search: 'Search',
  send: 'Send',
  settings: 'Settings',
  share: 'Share2',
  sort: 'ArrowUpDown',
  star: 'Star',
  success: 'CircleCheck',
  tag: 'Tag',
  unlock: 'LockOpen',
  upload: 'Upload',
  user: 'User',
  users: 'Users',
  view: 'Eye',
  warning: 'TriangleAlert',

  // Ant Design icon names that people and agents reach for by habit. They map to
  // the same icons as the names above, so either spelling looks the same.
  'check-circle': 'CircleCheck',
  'clock-circle': 'Clock',
  'close-circle': 'CircleX',
  down: 'ChevronDown',
  ellipsis: 'Ellipsis',
  environment: 'MapPin',
  'file-text': 'FileText',
  'info-circle': 'Info',
  left: 'ChevronLeft',
  plus: 'Plus',
  printer: 'Printer',
  reload: 'RefreshCw',
  right: 'ChevronRight',
  setting: 'Settings',
  up: 'ChevronUp',

  // Icons blocks and antd chrome render for themselves, so an icon set or an
  // alias restyles them with everything else.
  'add-circle': 'CirclePlus',
  remove: 'CircleMinus',
  clear: 'CircleX',
  'chevrons-left': 'ChevronsLeft',
  'chevrons-right': 'ChevronsRight',
  'sidebar-collapse': 'PanelLeftClose',
  'sidebar-expand': 'PanelLeftOpen',
  'theme-light': 'Sun',
  'theme-dark': 'Moon',
  'theme-system': 'Monitor',
  'rating-low': 'FaceSlightlyFrowning',
  'rating-high': 'FaceSlightlySmiling',
  camera: 'Camera',
  bot: 'Bot',
  unchanged: 'CirclePause',
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  highlight: 'Highlighter',
  'icon-missing': 'CircleAlert',
};

export default defaultIconAliases;
