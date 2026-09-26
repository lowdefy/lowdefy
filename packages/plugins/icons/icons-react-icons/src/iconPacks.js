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

// react-icons packs in resolution order. Packs that share a name prefix list the pack Lowdefy
// imported that prefix from before v7 first (fa before fa6, hi before hi2, io5 before io), so
// every name an app used keeps the glyph it had.
const iconPacks = [
  { pack: 'ai', prefix: 'Ai' },
  { pack: 'bi', prefix: 'Bi' },
  { pack: 'bs', prefix: 'Bs' },
  { pack: 'cg', prefix: 'Cg' },
  { pack: 'ci', prefix: 'Ci' },
  { pack: 'di', prefix: 'Di' },
  { pack: 'fa', prefix: 'Fa' },
  { pack: 'fa6', prefix: 'Fa' },
  { pack: 'fc', prefix: 'Fc' },
  { pack: 'fi', prefix: 'Fi' },
  { pack: 'gi', prefix: 'Gi' },
  { pack: 'go', prefix: 'Go' },
  { pack: 'gr', prefix: 'Gr' },
  { pack: 'hi', prefix: 'Hi' },
  { pack: 'hi2', prefix: 'Hi' },
  { pack: 'im', prefix: 'Im' },
  { pack: 'io5', prefix: 'Io' },
  { pack: 'io', prefix: 'Io' },
  { pack: 'lia', prefix: 'Lia' },
  { pack: 'lu', prefix: 'Lu' },
  { pack: 'md', prefix: 'Md' },
  { pack: 'pi', prefix: 'Pi' },
  { pack: 'ri', prefix: 'Ri' },
  { pack: 'rx', prefix: 'Rx' },
  { pack: 'si', prefix: 'Si' },
  { pack: 'sl', prefix: 'Sl' },
  { pack: 'tb', prefix: 'Tb' },
  { pack: 'tfi', prefix: 'Tfi' },
  { pack: 'ti', prefix: 'Ti' },
  { pack: 'vsc', prefix: 'Vsc' },
  { pack: 'wi', prefix: 'Wi' },
];

export default iconPacks;
