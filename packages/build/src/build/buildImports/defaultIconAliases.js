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

// Built-in semantic icon names. Apps use these instead of picking a react-icons
// pack per icon, so an app looks consistent by default. All map to Lucide
// (react-icons/lu). theme.icons.aliases overrides or extends them per name.
const defaultIconAliases = {
  add: 'LuPlus',
  'arrow-down': 'LuArrowDown',
  'arrow-left': 'LuArrowLeft',
  'arrow-right': 'LuArrowRight',
  'arrow-up': 'LuArrowUp',
  attach: 'LuPaperclip',
  bell: 'LuBell',
  calendar: 'LuCalendar',
  chart: 'LuChartColumn',
  check: 'LuCheck',
  'chevron-down': 'LuChevronDown',
  'chevron-left': 'LuChevronLeft',
  'chevron-right': 'LuChevronRight',
  'chevron-up': 'LuChevronUp',
  clock: 'LuClock',
  close: 'LuX',
  copy: 'LuCopy',
  delete: 'LuTrash2',
  document: 'LuFileText',
  download: 'LuDownload',
  drag: 'LuGripVertical',
  edit: 'LuPencil',
  error: 'LuCircleX',
  'external-link': 'LuExternalLink',
  file: 'LuFile',
  filter: 'LuFilter',
  folder: 'LuFolder',
  globe: 'LuGlobe',
  grid: 'LuLayoutGrid',
  heart: 'LuHeart',
  help: 'LuCircleHelp',
  hide: 'LuEyeOff',
  history: 'LuHistory',
  home: 'LuHouse',
  image: 'LuImage',
  info: 'LuInfo',
  link: 'LuLink',
  list: 'LuList',
  loading: 'LuLoaderCircle',
  location: 'LuMapPin',
  lock: 'LuLock',
  login: 'LuLogIn',
  logout: 'LuLogOut',
  mail: 'LuMail',
  menu: 'LuMenu',
  message: 'LuMessageSquare',
  minus: 'LuMinus',
  more: 'LuEllipsis',
  'more-vertical': 'LuEllipsisVertical',
  phone: 'LuPhone',
  print: 'LuPrinter',
  refresh: 'LuRefreshCw',
  save: 'LuSave',
  search: 'LuSearch',
  send: 'LuSend',
  settings: 'LuSettings',
  share: 'LuShare2',
  sort: 'LuArrowUpDown',
  star: 'LuStar',
  success: 'LuCircleCheck',
  tag: 'LuTag',
  unlock: 'LuLockOpen',
  upload: 'LuUpload',
  user: 'LuUser',
  users: 'LuUsers',
  view: 'LuEye',
  warning: 'LuTriangleAlert',

  // Ant Design icon names that people and agents reach for by habit. They map to
  // the same icons as the names above, so either spelling looks the same.
  'check-circle': 'LuCircleCheck',
  'clock-circle': 'LuClock',
  'close-circle': 'LuCircleX',
  down: 'LuChevronDown',
  ellipsis: 'LuEllipsis',
  environment: 'LuMapPin',
  'file-text': 'LuFileText',
  'info-circle': 'LuInfo',
  left: 'LuChevronLeft',
  plus: 'LuPlus',
  printer: 'LuPrinter',
  reload: 'LuRefreshCw',
  right: 'LuChevronRight',
  setting: 'LuSettings',
  up: 'LuChevronUp',
};

export default defaultIconAliases;
