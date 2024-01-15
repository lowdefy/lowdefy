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

import { nunjucksFunction } from '@lowdefy/nunjucks';

function createErrorMessage(errors = []) {
  if (errors.length === 1) {
    const template = nunjucksFunction(errors[0].message);
    return template(errors[0]);
  }
  if (errors.length > 1) {
    const firstMessage = errors[0].message;
    const lastMessage = errors[errors.length - 1].message;
    const firstTemplate = nunjucksFunction(firstMessage);
    const lastTemplate = nunjucksFunction(lastMessage);
    return `${firstTemplate(errors[0])}; ${lastTemplate(errors[errors.length - 1])}`;
  }
  return 'Schema validation error.';
}

export default createErrorMessage;
