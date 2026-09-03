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
const SHARED_JS_GLOBALS = [
  'Array',
  'Object',
  'String',
  'Number',
  'Boolean',
  'Symbol',
  'BigInt',
  'Math',
  'JSON',
  'Date',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Proxy',
  'Reflect',
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'EvalError',
  'ReferenceError',
  'URIError',
  'AggregateError',
  'Function',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array',
  'WeakRef',
  'FinalizationRegistry',
  'Intl',
  'Infinity',
  'NaN',
  'undefined',
  'globalThis',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  'structuredClone',
  'console',
  'fetch',
  'URL',
  'URLSearchParams',
  'AbortController',
  'AbortSignal',
  'queueMicrotask',
  'performance',
  'escape',
  'unescape',
  'TextEncoder',
  'TextDecoder',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'crypto',
];

const CLIENT_ONLY_JS_GLOBALS = [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'Blob',
  'File',
  'FormData',
  'FileReader',
  'Image',
  'atob',
  'btoa',
  'localStorage',
  'sessionStorage',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'Event',
  'CustomEvent',
  'DOMParser',
  'MutationObserver',
  'IntersectionObserver',
  'ResizeObserver',
  'getComputedStyle',
];

const SERVER_ONLY_JS_GLOBALS = ['Buffer', 'process', 'atob', 'btoa'];

export const CLIENT_JS_GLOBALS = new Set([...SHARED_JS_GLOBALS, ...CLIENT_ONLY_JS_GLOBALS]);
export const SERVER_JS_GLOBALS = new Set([...SHARED_JS_GLOBALS, ...SERVER_ONLY_JS_GLOBALS]);
