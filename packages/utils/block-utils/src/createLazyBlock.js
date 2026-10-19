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

import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { type } from '@lowdefy/helpers';

import createImplementationMethods from './createImplementationMethods.js';
import createLazyBlockInstance from './createLazyBlockInstance.js';
import createLazyLoader from './createLazyLoader.js';
import LazyBlockFlush from './LazyBlockFlush.js';

// Wraps a block whose implementation loads on first mount. The wrapper stands
// in for the block from mount: it registers a proxy for every method declared
// in meta.methods, so CallMethod works before the implementation has loaded.
function createLazyBlock({ load, meta, Fallback }) {
  if (!type.isFunction(load)) {
    throw new Error(
      `createLazyBlock requires "load" to be a function returning import(). Received ${JSON.stringify(
        load
      )}.`
    );
  }
  if (!type.isObject(meta)) {
    throw new Error(
      `createLazyBlock requires "meta" to be the block's meta object. Received ${JSON.stringify(
        meta
      )}.`
    );
  }
  const declaredMethods = Object.keys(meta.methods ?? {});
  const loader = createLazyLoader({ load });
  const warnedMethods = new Set();

  function LazyBlock(props) {
    const { blockId, methods } = props;
    const instanceRef = useRef(null);
    if (instanceRef.current === null) {
      instanceRef.current = createLazyBlockInstance({ loader });
    }
    const instance = instanceRef.current;

    // Keyed on the engine's methods object, so the implementation's effects
    // that depend on `methods` re-run exactly when they would for an eager block.
    const implementationMethods = useMemo(
      () =>
        createImplementationMethods({
          blockId,
          declaredMethods,
          methods,
          queue: instance.queue,
          warnedMethods,
        }),
      [blockId, instance, methods]
    );

    // Registered with the same effect timing an eager block uses, before any
    // ancestor's onMount event fires.
    useEffect(() => {
      declaredMethods.forEach((method) => {
        methods.registerMethod(method, (...args) => instance.queue.call({ args, blockId, method }));
      });
    }, [blockId, instance, methods]);

    useEffect(() => {
      instance.mount();
      instance.promise.catch((error) => {
        instance.queue.close({ cause: error, reason: 'loadFailed' });
        instance.settle();
      });
      return () => {
        instance.queue.close({ reason: 'unmounted' });
        instance.settle();
      };
    }, [instance]);

    const { Component } = instance;
    return (
      <Suspense fallback={type.isNone(Fallback) ? null : <Fallback {...props} />}>
        <Component {...props} methods={implementationMethods} />
        <LazyBlockFlush instance={instance} />
      </Suspense>
    );
  }

  LazyBlock.meta = meta;
  LazyBlock.displayName = 'LazyBlock';
  LazyBlock.preload = loader.preload;
  return LazyBlock;
}

export default createLazyBlock;
