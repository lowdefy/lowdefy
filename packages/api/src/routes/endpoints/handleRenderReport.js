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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import addStepResult from './addStepResult.js';
import renderReport from '../reports/renderReport.js';

// Mail providers reject large attachments, so a report the app could never send
// must fail loudly instead of succeeding into an undeliverable email.
//
// Both limits are measured against the attachment, not the document: the envelope
// carries the bytes base64-encoded, which is what a mail provider weighs, and
// that runs a third larger than the buffer. Measured raw, a 24 MB PDF passed as a
// 32 MB attachment — over the very limit the error message invokes.
const WARN_BYTES = 10 * 1024 * 1024;
const MAX_BYTES = 25 * 1024 * 1024;

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The exact length of `buffer.toString('base64')`, without allocating it: every
// three bytes become four characters, padded up to a multiple of four.
function base64Length(bytes) {
  return 4 * Math.ceil(bytes / 3);
}

async function handleRenderReport(context, routineContext, { step }) {
  const { logger, evaluateOperators } = context;

  logger.debug({
    event: 'debug_start_render_report',
    step,
  });

  const evaluatedProperties = evaluateOperators({
    input: step.properties,
    items: routineContext.items,
    location: step.stepId,
    payload: routineContext.payload,
    state: routineContext.state,
    steps: routineContext.steps,
  });

  const { pageId, format = 'pdf', filename, urlQuery, input, state } = evaluatedProperties;

  if (!type.isString(pageId) || pageId === '') {
    throw new ConfigError(
      `RenderReport step "${
        step.stepId
      }" properties.pageId must evaluate to a non-empty string. Received ${JSON.stringify(
        pageId
      )}.`,
      { configKey: step['~k'] }
    );
  }
  if (!type.isString(format)) {
    throw new ConfigError(
      `RenderReport step "${
        step.stepId
      }" properties.format must evaluate to a string. Received ${JSON.stringify(format)}.`,
      { configKey: step['~k'] }
    );
  }
  if (!type.isNone(filename) && (!type.isString(filename) || filename === '')) {
    throw new ConfigError(
      `RenderReport step "${
        step.stepId
      }" properties.filename must evaluate to a non-empty string. Received ${JSON.stringify(
        filename
      )}.`,
      { configKey: step['~k'] }
    );
  }
  for (const key of ['urlQuery', 'input', 'state']) {
    const value = evaluatedProperties[key];
    if (!type.isNone(value) && !type.isObject(value)) {
      throw new ConfigError(
        `RenderReport step "${
          step.stepId
        }" properties.${key} must evaluate to an object. Received ${JSON.stringify(value)}.`,
        { configKey: step['~k'] }
      );
    }
  }

  // A report renders with the auth context of its invoker. Scheduled, webhook and
  // detached runs create a system context (createAuthorize({ system: true })) —
  // there is no user, so a page that evaluates _user fails fast in the render
  // rather than emailing a plausible-but-wrong document.
  const invocation = context.authorize?.system === true ? 'system' : 'user';

  const result = await renderReport(context, {
    pageId,
    format,
    snapshot: { urlQuery, input, state },
    invocation,
  });

  // renderReport masks a missing page and an unauthorized page as the same null —
  // the step must not become an existence oracle either.
  if (!result) {
    throw new ConfigError(
      `RenderReport step "${step.stepId}" cannot render page "${pageId}": the page does not exist.`,
      { configKey: step['~k'] }
    );
  }

  const { buffer, contentType, warnings } = result;
  const size = buffer.length;
  const attachmentSize = base64Length(size);

  if (attachmentSize > MAX_BYTES) {
    throw new ConfigError(
      `RenderReport step "${step.stepId}" generated ${formatMb(
        size
      )} for page "${pageId}", which is ${formatMb(
        attachmentSize
      )} as an attachment — over the ${formatMb(
        MAX_BYTES
      )} limit. Mail providers reject attachments this large — reduce the report's content or split it.`,
      { configKey: step['~k'] }
    );
  }
  if (attachmentSize > WARN_BYTES) {
    logger.warn(
      {
        event: 'report_step_large',
        endpointId: step.endpointId,
        stepId: step.stepId,
        pageId,
        size,
        attachmentSize,
      },
      `RenderReport step "${step.stepId}" generated ${formatMb(size)} for page "${pageId}", ` +
        `${formatMb(attachmentSize)} as an attachment — attachments this large are often ` +
        'rejected or silently dropped.'
    );
  }

  addStepResult(context, routineContext, {
    result: {
      name: filename ?? result.filename,
      size,
      type: contentType,
      content: buffer.toString('base64'),
    },
    stepId: step.stepId,
  });

  logger.info(
    {
      event: 'report_step_generated',
      endpointId: step.endpointId,
      stepId: step.stepId,
      pageId,
      format,
      invocation,
      size,
      warnings,
    },
    `RenderReport step "${step.stepId}" generated ${formatMb(size)} for page "${pageId}" with ` +
      `${warnings?.skippedActions?.length ?? 0} skipped action(s) and ` +
      `${warnings?.skippedBlockTypes?.length ?? 0} unsupported block type(s).`
  );

  return { status: 'continue' };
}

export default handleRenderReport;
