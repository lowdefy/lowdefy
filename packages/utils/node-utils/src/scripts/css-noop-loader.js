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

export function resolve(specifier, context, next) {
  if (specifier.endsWith('.css') || specifier.endsWith('.less')) {
    return {
      url: 'data:text/javascript,export default {}',
      shortCircuit: true,
    };
  }
  return next(specifier, context);
}

export function load(url, context, next) {
  if (url === 'data:text/javascript,export default {}') {
    return {
      format: 'module',
      source: 'export default {}',
      shortCircuit: true,
    };
  }
  return next(url, context);
}
