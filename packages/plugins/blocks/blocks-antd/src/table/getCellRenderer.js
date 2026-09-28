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

import { type } from '@lowdefy/helpers';

import AvatarCell from './cells/AvatarCell.js';
import BooleanCell from './cells/BooleanCell.js';
import ButtonsCell from './cells/ButtonsCell.js';
import DateCell from './cells/DateCell.js';
import EmailCell from './cells/EmailCell.js';
import HtmlCell from './cells/HtmlCell.js';
import ImageCell from './cells/ImageCell.js';
import JsonCell from './cells/JsonCell.js';
import LinkCell from './cells/LinkCell.js';
import MenuCell from './cells/MenuCell.js';
import NumberCell from './cells/NumberCell.js';
import PeopleCell from './cells/PeopleCell.js';
import PhoneCell from './cells/PhoneCell.js';
import ProgressCell from './cells/ProgressCell.js';
import RatingCell from './cells/RatingCell.js';
import RelationCell from './cells/RelationCell.js';
import StatusCell from './cells/StatusCell.js';
import TagCell from './cells/TagCell.js';
import TextCell from './cells/TextCell.js';
import UrlCell from './cells/UrlCell.js';
import './tableCells.css';

const CELL_RENDERERS = {
  text: TextCell,
  number: NumberCell,
  currency: NumberCell,
  percent: NumberCell,
  date: DateCell,
  datetime: DateCell,
  boolean: BooleanCell,
  tag: TagCell,
  tags: TagCell,
  status: StatusCell,
  avatar: AvatarCell,
  people: PeopleCell,
  link: LinkCell,
  email: EmailCell,
  phone: PhoneCell,
  url: UrlCell,
  relation: RelationCell,
  progress: ProgressCell,
  rating: RatingCell,
  image: ImageCell,
  html: HtmlCell,
  json: JsonCell,
  buttons: ButtonsCell,
  menu: MenuCell,
};

// The React component for a cell type. Every renderer takes
// `{ value, row, rowKey, column, methods, components, onEvent }`, where
// `column` is a compiled column (compileColumns), `components` the block's
// Lowdefy components (Icon, Link) and `onEvent({ name, event })` fires a block
// event with the full payload. Tier-0 types render plain DOM styled by
// tableCells.css; `buttons` renders antd Buttons and `menu` mounts an antd
// Dropdown on first click.
function getCellRenderer(cellType) {
  const Renderer = CELL_RENDERERS[cellType];
  if (type.isUndefined(Renderer)) {
    throw new Error(`Unknown table cell type "${cellType}".`);
  }
  return Renderer;
}

export default getCellRenderer;
