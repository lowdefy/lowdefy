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
export default {
  type: 'object',
  params: {
    type: 'string',
    description:
      "An exact decimal as a string, such as '19.99'. Returns the decimal marker { '~dec': '19.99' }, which a MongoDB request stores as a Decimal128. Quote the value so YAML does not read it as a number.",
  },
};
