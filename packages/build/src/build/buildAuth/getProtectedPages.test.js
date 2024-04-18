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

import getProtectedPages from './getProtectedPages.js';

test('No config', () => {
  const components = {
    auth: {
      pages: {},
    },
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual([]);
});

test('Public true', () => {
  const components = {
    auth: {
      pages: {
        public: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual([]);
});

test('Protected empty array', () => {
  const components = {
    auth: {
      pages: {
        protected: [],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual([]);
});

test('Protected empty array, public true', () => {
  const components = {
    auth: {
      pages: {
        protected: [],
        public: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual([]);
});

test('Protected  true', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual(['a', 'b', 'c']);
});

test('Public empty array', () => {
  const components = {
    auth: {
      pages: {
        public: [],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual(['a', 'b', 'c']);
});

test('Protected true, public empty array', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        public: [],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual(['a', 'b', 'c']);
});

test('Protected true, public array', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        public: ['a'],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual(['b', 'c']);
});

test('Public array', () => {
  const components = {
    auth: {
      pages: {
        public: ['a'],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual(['b', 'c']);
});

test('Protected array', () => {
  const components = {
    auth: {
      pages: {
        protected: ['a'],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual(['a']);
});

test('Protected array, public true', () => {
  const components = {
    auth: {
      pages: {
        protected: ['a'],
        public: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedPages({ components });
  expect(res).toEqual(['a']);
});
