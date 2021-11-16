/*
  Copyright 2020-2021 Lowdefy, Inc

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

import Anchor from './blocks/Anchor/index.js';
import Box from './blocks/Box/index.js';
import DangerousHtml from './blocks/DangerousHtml/index.js';
import Html from './blocks/Html/index.js';
import Img from './blocks/Img/index.js';
import List from './blocks/List/index.js';
import Span from './blocks/Span/index.js';

export default {
  blocks: {
    Anchor,
    Box,
    DangerousHtml,
    Html,
    Img,
    List,
    Span,
  },
  import: {
    styles: [],
  },
};
