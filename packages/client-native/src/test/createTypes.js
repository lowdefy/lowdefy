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

import { Link, Request, SetDarkMode, SetState } from '@lowdefy/actions-core/actions';
import {
  _event,
  _if,
  _input,
  _location,
  _media,
  _request,
  _state,
  _string,
  _theme,
  _url_query,
} from '@lowdefy/operators-js/operators/client';

import { Box, Button, Icon, List, Paragraph, TextInput, Themed, Title } from './blocks.js';

// Record is a test action that logs its params, to see the order events run in.
// icons is the icon data the native Icon renderer draws from, as a shell gives it.
function createTypes({ icons = {}, record = () => undefined } = {}) {
  return {
    actions: { Link, Record: ({ params }) => record(params), Request, SetDarkMode, SetState },
    blocks: { Box, Button, Icon, List, Paragraph, TextInput, Themed, Title },
    icons,
    operators: {
      _event,
      _if,
      _input,
      _location,
      _media,
      _request,
      _state,
      _string,
      _theme,
      _url_query,
    },
  };
}

export default createTypes;
