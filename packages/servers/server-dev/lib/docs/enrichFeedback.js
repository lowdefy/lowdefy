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

import { type } from '@lowdefy/helpers';

import findConfig from './findConfig.js';

// Resolves each annotation's target.blockId to a config source location
// (file:line) via findConfig, which force-builds the batch's page — so an
// annotation drawn on a block the agent hasn't looked at yet still resolves.
// Runs before the batch is queued (src/routes/feedback.js) so
// formatFeedback.js can stay a pure string formatter with no build-artifact
// access of its own.
async function enrichFeedback({ batch }) {
  const annotations = await Promise.all(
    (batch.annotations ?? []).map((annotation) => enrichAnnotation({ annotation, batch }))
  );
  return { ...batch, annotations };
}

async function enrichAnnotation({ annotation, batch }) {
  const blockId = annotation.target?.blockId;
  if (type.isNone(blockId)) {
    return annotation;
  }
  try {
    const result = await findConfig({ id: blockId, pageId: batch.pageId });
    const location = result.matches?.[0]?.location ?? {
      note: result.note ?? `No config found with id "${blockId}" on page "${batch.pageId}".`,
    };
    return { ...annotation, location };
  } catch (error) {
    // Never drop feedback because location resolution failed — the
    // developer's annotation is still useful without a file:line pointer.
    return { ...annotation, location: { note: `Failed to resolve location: ${error.message}` } };
  }
}

export default enrichFeedback;
