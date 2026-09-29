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

// The skeleton a cell of this column type shows while its row loads (D17), shaped like the cell
// that replaces it so the layout does not jump: bars for text, short end-aligned bars for numbers,
// a circle and a bar for people, a pill for tags, a square for booleans and checkboxes, small
// squares for buttons and a thin bar for progress.
const SHAPES = {
  number: 'number',
  currency: 'number',
  percent: 'number',
  rating: 'number',
  avatar: 'person',
  people: 'person',
  tag: 'pill',
  tags: 'pill',
  status: 'pill',
  boolean: 'square',
  image: 'square',
  buttons: 'buttons',
  menu: 'square',
  progress: 'progress',
};

function getSkeletonShape(type) {
  return SHAPES[type] ?? 'text';
}

export default getSkeletonShape;
