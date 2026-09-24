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

import React, { useEffect } from 'react';
import { jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';

import createLazyBlock from './createLazyBlock.js';
import ErrorBoundary from './ErrorBoundary.js';
import getLazyBlockLoadsInFlight from './getLazyBlockLoadsInFlight.js';

const meta = {
  category: 'display',
  icons: [],
  methods: {
    clear: 'Clear the block.',
    send: 'Send a message.',
    focus: 'Focus the block.',
  },
};

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

// Stands in for the engine's block.methods: registerMethod is a plain
// assignment, and CallMethod reads the registered function when it runs.
function createEngineMethods() {
  const registered = {};
  return {
    registered,
    methods: {
      registerEvent: jest.fn(),
      registerMethod: jest.fn((name, fn) => {
        registered[name] = fn;
      }),
      triggerEvent: jest.fn(),
    },
  };
}

function createImplementation({ log, register = ['send', 'clear'], received }) {
  function Implementation(props) {
    if (received) {
      received.push(props);
    }
    const { methods } = props;
    useEffect(() => {
      if (register.includes('send')) {
        methods.registerMethod('send', (text) => {
          log.push(`send:${text}`);
          return `sent ${text}`;
        });
      }
      if (register.includes('clear')) {
        methods.registerMethod('clear', () => {
          log.push('clear');
          return 'cleared';
        });
      }
    }, [methods]);
    return <div data-testid="implementation">{props.properties.title}</div>;
  }
  return Implementation;
}

async function resolveLoad(deferred, Implementation) {
  await act(async () => {
    deferred.resolve({ default: Implementation });
    await deferred.promise;
  });
}

async function rejectLoad(deferred, error) {
  await act(async () => {
    deferred.reject(error);
    await deferred.promise.catch(() => {});
  });
}

let consoleError;

beforeEach(() => {
  // React logs errors caught by an error boundary.
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

test('createLazyBlock copies meta onto the wrapper and sets displayName and preload', () => {
  const LazyBlock = createLazyBlock({ load: () => new Promise(() => {}), meta });
  expect(LazyBlock.meta).toBe(meta);
  expect(LazyBlock.displayName).toBe('LazyBlock');
  expect(typeof LazyBlock.preload).toBe('function');
});

test('createLazyBlock throws when load is not a function', () => {
  expect(() => createLazyBlock({ load: './Block.lazy.js', meta })).toThrow(
    'createLazyBlock requires "load" to be a function returning import(). Received "./Block.lazy.js".'
  );
});

test('createLazyBlock throws when meta is not an object', () => {
  expect(() => createLazyBlock({ load: () => Promise.resolve() })).toThrow(
    'createLazyBlock requires "meta" to be the block\'s meta object. Received undefined.'
  );
});

test('preload calls load once and returns the same promise on every call', async () => {
  const Implementation = createImplementation({ log: [] });
  const load = jest.fn(() => Promise.resolve({ default: Implementation }));
  const LazyBlock = createLazyBlock({ load, meta });
  const first = LazyBlock.preload();
  const second = LazyBlock.preload();
  expect(first).toBe(second);
  expect(load).toHaveBeenCalledTimes(1);
  await expect(first).resolves.toEqual({ default: Implementation });
  expect(LazyBlock.preload()).toBe(first);
  expect(load).toHaveBeenCalledTimes(1);
});

test('preload retries the load after a failed load', async () => {
  const Implementation = createImplementation({ log: [] });
  const load = jest
    .fn()
    .mockImplementationOnce(() => Promise.reject(new Error('Network down')))
    .mockImplementationOnce(() => Promise.resolve({ default: Implementation }));
  const LazyBlock = createLazyBlock({ load, meta });
  await expect(LazyBlock.preload()).rejects.toThrow('Network down');
  await expect(LazyBlock.preload()).resolves.toEqual({ default: Implementation });
  expect(load).toHaveBeenCalledTimes(2);
});

test('the wrapper registers a proxy for every declared method at mount', () => {
  const LazyBlock = createLazyBlock({ load: () => new Promise(() => {}), meta });
  const { methods, registered } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);
  expect(Object.keys(registered).sort()).toEqual(['clear', 'focus', 'send']);
});

test('a method called before load is queued and resolves with the result once the block loads', async () => {
  const log = [];
  const deferred = createDeferred();
  const LazyBlock = createLazyBlock({ load: () => deferred.promise, meta });
  const { methods, registered } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{ title: 'Chat' }} />);

  const result = registered.send('hello');
  expect(result).toBeInstanceOf(Promise);
  expect(log).toEqual([]);

  await resolveLoad(deferred, createImplementation({ log }));
  expect(screen.getByTestId('implementation').textContent).toBe('Chat');
  await expect(result).resolves.toBe('sent hello');
  expect(log).toEqual(['send:hello']);
});

test('a method called after load runs synchronously and returns its result', async () => {
  const log = [];
  const deferred = createDeferred();
  const LazyBlock = createLazyBlock({ load: () => deferred.promise, meta });
  const { methods, registered } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);
  await resolveLoad(deferred, createImplementation({ log }));

  expect(registered.send('now')).toBe('sent now');
  expect(log).toEqual(['send:now']);
});

test('queued calls run in call order across methods, not registration order', async () => {
  const log = [];
  const deferred = createDeferred();
  const LazyBlock = createLazyBlock({ load: () => deferred.promise, meta });
  const { methods, registered } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);

  // The implementation registers send before clear.
  const cleared = registered.clear();
  const sent = registered.send('first');
  await resolveLoad(deferred, createImplementation({ log }));

  await expect(cleared).resolves.toBe('cleared');
  await expect(sent).resolves.toBe('sent first');
  expect(log).toEqual(['clear', 'send:first']);
});

test('a queued call rejects when the implementation never registers the declared method', async () => {
  const deferred = createDeferred();
  const LazyBlock = createLazyBlock({ load: () => deferred.promise, meta });
  const { methods, registered } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);

  // Observed at once, so the rejection is handled when the flush rejects it.
  const focused = registered.focus().catch((error) => error);
  await resolveLoad(deferred, createImplementation({ log: [] }));

  expect((await focused).message).toBe(
    'Failed to call method "focus" on block "chat". Check if "focus" is a valid block method for block "chat".'
  );
  // After the queue has flushed, a missing method throws synchronously, as CallMethod does today.
  expect(() => registered.focus()).toThrow(
    'Failed to call method "focus" on block "chat". Check if "focus" is a valid block method for block "chat".'
  );
});

test('queued calls reject when the load fails, and the error reaches the error boundary', async () => {
  const deferred = createDeferred();
  const LazyBlock = createLazyBlock({ load: () => deferred.promise, meta });
  const { methods, registered } = createEngineMethods();
  const onError = jest.fn();
  render(
    <ErrorBoundary blockId="chat" onError={onError}>
      <LazyBlock blockId="chat" methods={methods} properties={{}} />
    </ErrorBoundary>
  );

  const sent = registered.send('hello').catch((error) => error);
  const loadError = new Error('Failed to fetch dynamically imported module');
  await rejectLoad(deferred, loadError);

  const sendError = await sent;
  expect(sendError.message).toBe(
    'Failed to call method "send" on block "chat": the block failed to load.'
  );
  expect(sendError.cause).toBe(loadError);
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError.mock.calls[0][0].cause).toBe(loadError);
});

test('a block whose load failed loads again on the next mount', async () => {
  const log = [];
  const Implementation = createImplementation({ log });
  const first = createDeferred();
  const load = jest
    .fn()
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => Promise.resolve({ default: Implementation }));
  const LazyBlock = createLazyBlock({ load, meta });
  const { methods } = createEngineMethods();

  const failed = render(
    <ErrorBoundary blockId="chat">
      <LazyBlock blockId="chat" methods={methods} properties={{}} />
    </ErrorBoundary>
  );
  await rejectLoad(first, new Error('Network down'));
  failed.unmount();

  render(
    <ErrorBoundary blockId="chat">
      <LazyBlock blockId="chat" methods={methods} properties={{ title: 'Retried' }} />
    </ErrorBoundary>
  );
  expect((await screen.findByTestId('implementation')).textContent).toBe('Retried');
  expect(load).toHaveBeenCalledTimes(2);
});

test('queued calls reject when the block unmounts before it loads', async () => {
  const LazyBlock = createLazyBlock({ load: () => new Promise(() => {}), meta });
  const { methods, registered } = createEngineMethods();
  const { unmount } = render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);

  const sent = registered.send('hello').catch((error) => error);
  unmount();

  expect((await sent).message).toBe(
    'Failed to call method "send" on block "chat": the block unmounted before it loaded.'
  );
});

test('the implementation keeps one methods object while the engine methods object is unchanged', async () => {
  const received = [];
  const Implementation = createImplementation({ log: [], received });
  const LazyBlock = createLazyBlock({
    load: () => Promise.resolve({ default: Implementation }),
    meta,
  });
  await LazyBlock.preload();
  const { methods } = createEngineMethods();
  const { rerender } = render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);
  rerender(<LazyBlock blockId="chat" methods={methods} properties={{ title: 'Again' }} />);

  expect(received.length).toBe(2);
  expect(received[1].methods).toBe(received[0].methods);
  expect(received[0].methods).not.toBe(methods);

  const { methods: nextMethods } = createEngineMethods();
  rerender(<LazyBlock blockId="chat" methods={nextMethods} properties={{}} />);
  expect(received[2].methods).not.toBe(received[0].methods);
});

test('the implementation methods object reads framework methods reassigned after it was created', async () => {
  const received = [];
  const Implementation = createImplementation({ log: [], received });
  const LazyBlock = createLazyBlock({
    load: () => Promise.resolve({ default: Implementation }),
    meta,
  });
  await LazyBlock.preload();
  const { methods } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);

  // The engine re-assigns framework methods onto block.methods each render.
  const setValue = jest.fn();
  Object.assign(methods, { setValue });
  received[0].methods.setValue(3);
  expect(setValue).toHaveBeenCalledWith(3);
});

test('an already loaded block renders without a fallback and its methods run synchronously', async () => {
  const log = [];
  const Implementation = createImplementation({ log });
  const LazyBlock = createLazyBlock({
    load: () => Promise.resolve({ default: Implementation }),
    meta,
    Fallback: () => <div data-testid="fallback" />,
  });
  await LazyBlock.preload();
  const { methods, registered } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{ title: 'Loaded' }} />);

  expect(screen.queryByTestId('fallback')).toBe(null);
  expect(screen.getByTestId('implementation').textContent).toBe('Loaded');
  expect(registered.send('sync')).toBe('sent sync');
  expect(getLazyBlockLoadsInFlight()).toBe(0);
});

test('the Fallback receives the block props while loading and no fallback renders nothing by default', () => {
  const WithFallback = createLazyBlock({
    load: () => new Promise(() => {}),
    meta,
    Fallback: ({ blockId, properties }) => (
      <button data-testid="fallback">{`${blockId}:${properties.title}`}</button>
    ),
  });
  const { methods } = createEngineMethods();
  const { container } = render(
    <WithFallback blockId="chat" methods={methods} properties={{ title: 'Ask' }} />
  );
  expect(container.innerHTML).toBe('<button data-testid="fallback">chat:Ask</button>');

  const WithoutFallback = createLazyBlock({ load: () => new Promise(() => {}), meta });
  const empty = render(<WithoutFallback blockId="chat" methods={methods} properties={{}} />);
  expect(empty.container.innerHTML).toBe('');
});

test('an undeclared method is registered directly and warns once in development', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const log = [];
  const Implementation = createImplementation({ log });
  const LazyBlock = createLazyBlock({
    load: () => Promise.resolve({ default: Implementation }),
    meta: { category: 'display', methods: { send: 'Send a message.' } },
  });
  await LazyBlock.preload();
  const { methods, registered } = createEngineMethods();
  const { rerender } = render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);
  const { methods: nextMethods } = createEngineMethods();
  rerender(<LazyBlock blockId="chat" methods={nextMethods} properties={{}} />);

  expect(methods.registerMethod).toHaveBeenCalledWith('clear', expect.any(Function));
  expect(registered.clear()).toBe('cleared');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toBe(
    'Lazy block "chat" registered method "clear", which is not declared in its meta.methods. Calls to "clear" before the block loads will fail. Add "clear" to meta.methods.'
  );
  warn.mockRestore();
});

test('the lazy loads in flight count mounted blocks that are still loading', async () => {
  const deferred = createDeferred();
  const LazyBlock = createLazyBlock({ load: () => deferred.promise, meta });
  const { methods } = createEngineMethods();
  const before = getLazyBlockLoadsInFlight();

  render(
    <>
      <LazyBlock blockId="one" methods={methods} properties={{}} />
      <LazyBlock blockId="two" methods={methods} properties={{}} />
    </>
  );
  expect(getLazyBlockLoadsInFlight()).toBe(before + 2);
  expect(window.__lowdefyLazyLoads).toBe(before + 2);

  await resolveLoad(deferred, createImplementation({ log: [] }));
  expect(getLazyBlockLoadsInFlight()).toBe(before);
  expect(window.__lowdefyLazyLoads).toBe(before);
});

test('the lazy loads in flight drop when a loading block unmounts or fails', async () => {
  const Pending = createLazyBlock({ load: () => new Promise(() => {}), meta });
  const { methods } = createEngineMethods();
  const before = getLazyBlockLoadsInFlight();
  const { unmount } = render(<Pending blockId="one" methods={methods} properties={{}} />);
  expect(getLazyBlockLoadsInFlight()).toBe(before + 1);
  unmount();
  expect(getLazyBlockLoadsInFlight()).toBe(before);

  const deferred = createDeferred();
  const Failing = createLazyBlock({ load: () => deferred.promise, meta });
  render(
    <ErrorBoundary blockId="two">
      <Failing blockId="two" methods={methods} properties={{}} />
    </ErrorBoundary>
  );
  expect(getLazyBlockLoadsInFlight()).toBe(before + 1);
  await rejectLoad(deferred, new Error('Network down'));
  expect(getLazyBlockLoadsInFlight()).toBe(before);
});

test('preload before mount is not counted as a lazy load in flight', () => {
  const LazyBlock = createLazyBlock({ load: () => new Promise(() => {}), meta });
  const before = getLazyBlockLoadsInFlight();
  LazyBlock.preload();
  expect(getLazyBlockLoadsInFlight()).toBe(before);
});

test('a queued call rejects with the error its method throws when the queue flushes', async () => {
  const deferred = createDeferred();
  const LazyBlock = createLazyBlock({ load: () => deferred.promise, meta });
  const { methods, registered } = createEngineMethods();
  render(<LazyBlock blockId="chat" methods={methods} properties={{}} />);

  const sent = registered.send('hello').catch((error) => error);
  function Throwing({ methods: implementationMethods }) {
    useEffect(() => {
      implementationMethods.registerMethod('send', () => {
        throw new Error('Not connected.');
      });
    }, [implementationMethods]);
    return null;
  }
  await resolveLoad(deferred, Throwing);

  expect((await sent).message).toBe('Not connected.');
});
