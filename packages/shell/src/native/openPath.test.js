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

import openPath from './openPath.js';

function open(path, query) {
  const app = { router: { push: jest.fn() } };
  openPath({ app, path, query });
  return app.router.push;
}

test('openPath opens a page of the app with its query and the query passed', () => {
  expect(open('/tasks/42?tab=notes', { shared: { n: 1 } })).toHaveBeenCalledWith({
    pathname: '/tasks/42',
    query: 'tab=notes&shared=%7B%22n%22%3A1%7D',
  });
  expect(open('/tasks')).toHaveBeenCalledWith({ pathname: '/tasks', query: undefined });
});

test('openPath ignores anything that is not a path inside the app', () => {
  ['//evil.com/x', '/\\evil.com/x', '/\t/evil.com', 'https://evil.com', 'tasks/1', null].forEach(
    (path) => {
      expect(open(path)).not.toHaveBeenCalled();
    }
  );
});
