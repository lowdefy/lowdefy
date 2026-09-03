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

import pino from 'pino';

import { serializer, type } from '@lowdefy/helpers';

import createOtlpSink from './createOtlpSink.js';

function createNodeLogger({
  name = 'lowdefy',
  level = process.env.LOWDEFY_LOG_LEVEL ?? 'info',
  base = { pid: undefined, hostname: undefined },
  mixin,
  serializers,
  destination,
  otlp,
} = {}) {
  const options = {
    name,
    level,
    base,
    mixin,
    serializers: {
      err: (error) => serializer.serialize(error)?.['~e'] ?? error,
      ...serializers,
    },
  };
  if (type.isNone(otlp)) {
    return pino(options, destination);
  }

  // The OTLP export is a second leg beside stdout, never a replacement: the
  // platform's own log stream stays the source of truth if the export fails.
  const sink = createOtlpSink(otlp);
  const logger = pino(
    options,
    pino.multistream([
      { level, stream: destination ?? pino.destination(1) },
      { level, stream: sink },
    ])
  );
  // Inherited by every child (pino children are created from the parent), so a
  // per-request child logger can be flushed by the request that made it.
  logger.flushOtlp = () => sink.flush();
  return logger;
}

export default createNodeLogger;
