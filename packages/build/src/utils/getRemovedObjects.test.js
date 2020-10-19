/*
  Copyright 2020 Lowdefy, Inc

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

import getRemovedObjects from './getRemovedObjects';

describe('getRemovedObjects', () => {
  test('getRemovedObjects both empty', () => {
    const oldObjects = [];
    const newObjects = [];
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([]);
  });

  test('getRemovedObjects defaults', () => {
    const oldObjects = undefined;
    const newObjects = undefined;
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([]);
  });

  test('getRemovedObjects no new objects', () => {
    const oldObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const newObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([]);
  });

  test('getRemovedObjects object changed', () => {
    const oldObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const newObjects = [
      {
        id: '1',
        properties: {
          prop: '2',
        },
      },
    ];
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([]);
  });

  test('getRemovedObjects new object', () => {
    const oldObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const newObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
      {
        id: '2',
        properties: {
          prop: '2',
        },
      },
    ];
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([]);
  });
  test('getRemovedObjects object removed', () => {
    const oldObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
      {
        id: '2',
        properties: {
          prop: '2',
        },
      },
    ];
    const newObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([
      {
        id: '2',
        properties: {
          prop: '2',
        },
      },
    ]);
  });

  test('getRemovedObjects objectId', () => {
    const oldObjects = [
      {
        name: '1',
        properties: {
          prop: '1',
        },
      },
      {
        name: '2',
        properties: {
          prop: '2',
        },
      },
    ];
    const newObjects = [
      {
        name: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const res = getRemovedObjects({ oldObjects, newObjects, objectId: 'name' });
    expect(res).toEqual([
      {
        name: '2',
        properties: {
          prop: '2',
        },
      },
    ]);
  });

  test('getRemovedObjects old object null', () => {
    const oldObjects = [null];
    const newObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([]);
  });

  test('getRemovedObjects new object null', () => {
    const oldObjects = [
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ];
    const newObjects = [null];
    const res = getRemovedObjects({ oldObjects, newObjects });
    expect(res).toEqual([
      {
        id: '1',
        properties: {
          prop: '1',
        },
      },
    ]);
  });
});
