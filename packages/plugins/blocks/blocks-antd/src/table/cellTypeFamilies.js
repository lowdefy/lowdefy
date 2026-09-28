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

// Every cell type and the family it belongs to. The family decides the filter
// operators, the comparator and the default alignment, so a type is only
// valid once it is listed here.
const CELL_TYPE_FAMILIES = {
  text: 'text',
  email: 'text',
  phone: 'text',
  url: 'text',
  link: 'text',
  html: 'text',
  relation: 'text',
  tag: 'text',
  status: 'text',
  avatar: 'text',
  number: 'number',
  currency: 'number',
  percent: 'number',
  progress: 'number',
  rating: 'number',
  date: 'date',
  datetime: 'date',
  boolean: 'boolean',
  tags: 'array',
  people: 'array',
  image: 'other',
  json: 'other',
  buttons: 'action',
  menu: 'action',
};

export default CELL_TYPE_FAMILIES;
