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

function createBuildProfiler({ logger, prefix = '' }) {
  const timings = new Map();
  const isDebug = logger?.level === 'debug';

  const track = (name) => {
    if (!isDebug) {
      return;
    }
    if (!timings.has(name)) {
      timings.set(name, { total: 0, count: 0, min: Infinity, max: 0 });
    }
  };

  const time = async (name, fn) => {
    if (!isDebug) {
      return fn();
    }
    track(name);
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    const entry = timings.get(name);
    entry.total += duration;
    entry.count += 1;
    entry.min = Math.min(entry.min, duration);
    entry.max = Math.max(entry.max, duration);
    return result;
  };

  const timeSync = (name, fn) => {
    if (!isDebug) {
      return fn();
    }
    track(name);
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    const entry = timings.get(name);
    entry.total += duration;
    entry.count += 1;
    entry.min = Math.min(entry.min, duration);
    entry.max = Math.max(entry.max, duration);
    return result;
  };

  const getTimings = () => {
    const result = [];
    timings.forEach((value, name) => {
      result.push({ name, ...value, avg: value.total / value.count });
    });
    return result;
  };

  const printSummary = () => {
    if (!isDebug || timings.size === 0) {
      return;
    }

    const entries = getTimings();
    const total = entries.reduce((sum, t) => sum + t.total, 0);
    const displayPrefix = prefix ? `[${prefix}] ` : '';

    logger.debug('');
    logger.debug(`⏱️  ${displayPrefix}Build Performance Summary:`);
    logger.debug('─'.repeat(90));
    const header = [
      'Step'.padEnd(30),
      'Total'.padStart(10),
      '%'.padStart(6),
      'Count'.padStart(7),
      'Avg'.padStart(10),
      'Min'.padStart(10),
      'Max'.padStart(10),
    ].join(' ');
    logger.debug(header);
    logger.debug('─'.repeat(90));

    entries
      .sort((a, b) => b.total - a.total)
      .forEach(({ name, total: stepTotal, count, avg, min, max }) => {
        const pct = ((stepTotal / total) * 100).toFixed(1);
        const displayName = name.length > 28 ? `${name.slice(0, 25)}...` : name;
        const row = [
          displayName.padEnd(30),
          `${stepTotal.toFixed(2).padStart(8)}ms`,
          `${pct.padStart(6)}%`,
          String(count).padStart(7),
          `${avg.toFixed(2).padStart(8)}ms`,
          `${min.toFixed(2).padStart(8)}ms`,
          `${max.toFixed(2).padStart(8)}ms`,
        ].join(' ');
        logger.debug(row);
      });

    logger.debug('─'.repeat(90));
    logger.debug(`${'TOTAL'.padEnd(30)} ${total.toFixed(2).padStart(8)}ms`);
  };

  const createSubProfiler = (subPrefix) => {
    return createBuildProfiler({
      logger,
      prefix: prefix ? `${prefix}::${subPrefix}` : subPrefix,
    });
  };

  return { time, timeSync, getTimings, printSummary, createSubProfiler, isDebug };
}

export default createBuildProfiler;
