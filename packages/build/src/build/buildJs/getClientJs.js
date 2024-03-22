/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { serializer, type } from '@lowdefy/helpers';

function getClientJs(input) {
  const clientHashes = new Set();

  const parse = ({ input, operatorName = '_js' }) => {
    const reviver = (_, value) => {
      if (!type.isObject(value)) return value;
      if (Object.keys(value).length !== 1) return value;
      const key = Object.keys(value)[0];
      if (key !== operatorName) return value;
      clientHashes.add(value[key]);
      return value;
    };
    return serializer.copy(input, { reviver });
  };
  parse(input);
  return clientHashes;
}
export default getClientJs;
