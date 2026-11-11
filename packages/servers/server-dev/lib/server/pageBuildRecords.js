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

import { AsyncLocalStorage } from 'node:async_hooks';
import path from 'node:path';

import { resolveErrorLocation } from '@lowdefy/errors';

import mapPageBuildErrors from '../docs/mapPageBuildErrors.js';
import hashConfigContent from './hashConfigContent.js';

// What each page's latest JIT build read and how it ended, kept for the life of
// the server process. The dev server uses it to tell which built pages an edit
// touched and which pages currently fail to build, without the page being
// requested. Pages build concurrently on one shared build context, so the files
// a build reads are attributed through async context rather than the context.
const buildReads = new AsyncLocalStorage();
const records = new Map();
// The builds running now, each as { generation, reads }. A build's record is
// written when it ends, so until then this is the only place that names the
// jitMaps/ file it writes.
const buildsInFlight = new Set();

// Recorded for a file a build read twice with different content, or could not
// read: no content on disk matches it, so the page is always rebuilt.
const NEVER_MATCHES = 'conflict';

function recordRead({ reads, filePath, hash }) {
  const previous = reads.files.get(filePath);
  if (previous !== undefined && previous !== hash) {
    reads.files.set(filePath, NEVER_MATCHES);
    return;
  }
  reads.files.set(filePath, hash);
}

// Every config file a page build reads comes through readConfigFile, and all
// app code it runs through importAppCode. App code can read anything, so a
// build that ran it is only marked, not traced.
function trackReadConfigFile({ readConfigFile, configDirectory }) {
  return async function trackedReadConfigFile(filePath) {
    const reads = buildReads.getStore();
    const absolutePath = path.resolve(configDirectory, filePath);
    let content;
    try {
      content = await readConfigFile(filePath);
    } catch (error) {
      if (reads) recordRead({ reads, filePath: absolutePath, hash: NEVER_MATCHES });
      throw error;
    }
    if (reads) recordRead({ reads, filePath: absolutePath, hash: hashConfigContent(content) });
    return content;
  };
}

// A page build writes the key and ref entries it added to one jitMaps/ file
// (writeJitMaps), also when it fails. Recording its name lets the dev server
// keep exactly the files that resolve the errors current pages report. A write
// skipStaleMapWrites drops never reaches this wrapper, so it is not recorded.
//
// The name is recorded before the write starts: a new build context prunes
// jitMaps/ by these names (mapsFiles), and it can be made while the write is
// under way, after which the file is in place and would be removed as one no
// build wrote.
function trackMapWrites({ context }) {
  const writeBuildArtifact = context.writeBuildArtifact;
  context.writeBuildArtifact = async (filePath, content, options) => {
    const reads = buildReads.getStore();
    if (!reads || !filePath.startsWith('jitMaps/')) {
      await writeBuildArtifact(filePath, content, options);
      return;
    }
    const name = path.posix.basename(filePath);
    reads.mapsFiles.push(name);
    try {
      await writeBuildArtifact(filePath, content, options);
    } catch (error) {
      reads.mapsFiles.splice(reads.mapsFiles.lastIndexOf(name), 1);
      throw error;
    }
  };
}

function trackFileReads({ context, configDirectory }) {
  context.readConfigFile = trackReadConfigFile({
    readConfigFile: context.readConfigFile,
    configDirectory,
  });
  const importAppCode = context.importAppCode;
  context.importAppCode = (filePath) => {
    const reads = buildReads.getStore();
    if (reads) reads.ranAppCode = true;
    return importAppCode(filePath);
  };
}

// The page route resolves a build error's source when it logs the error; a
// build nobody requested is never logged, so its errors are located here, from
// the keys the build added to its context.
function locateErrors({ error, context, configDirectory }) {
  for (const buildError of error.buildErrors ?? [error]) {
    if (buildError.source) continue;
    try {
      buildError.source =
        resolveErrorLocation(buildError, {
          keyMap: context.keyMap,
          refMap: context.refMap,
          configDirectory,
        })?.source ?? null;
    } catch {
      // A malformed keyMap or refMap entry leaves the error unlocated.
    }
  }
}

// generation names the config build the page was built in, and checkedAt the
// change event counter when its build started: what it read is current as of
// that event.
async function record({ pageId, context, configDirectory, generation, checkedAt, build }) {
  const reads = { files: new Map(), mapsFiles: [], ranAppCode: false };
  const builtAt = Date.now();
  const describe = (errors) => ({
    builtAt,
    checkedAt,
    errors,
    files: reads.files,
    generation,
    mapsFiles: reads.mapsFiles,
    ranAppCode: reads.ranAppCode,
  });
  const buildInFlight = { generation, reads };
  buildsInFlight.add(buildInFlight);
  try {
    let result;
    try {
      result = await buildReads.run(reads, build);
    } catch (error) {
      locateErrors({ error, context, configDirectory });
      records.set(pageId, describe(mapPageBuildErrors(error)));
      throw error;
    }
    // A plugin install ends the build before the page is built, so the page's
    // previous record still describes it.
    if (!result?.installing) {
      records.set(pageId, describe(null));
    }
    return result;
  } finally {
    buildsInFlight.delete(buildInFlight);
  }
}

function get(pageId) {
  return records.get(pageId) ?? null;
}

// The jitMaps/ files the latest builds of a generation's pages wrote, and the
// ones its builds still running have written or are writing.
function mapsFiles({ generation }) {
  const names = [];
  for (const pageRecord of records.values()) {
    if (pageRecord.generation === generation) {
      names.push(...pageRecord.mapsFiles);
    }
  }
  for (const buildInFlight of buildsInFlight) {
    if (buildInFlight.generation === generation) {
      names.push(...buildInFlight.reads.mapsFiles);
    }
  }
  return names;
}

export default {
  get,
  mapsFiles,
  record,
  trackFileReads,
  trackMapWrites,
  trackReadConfigFile,
};
