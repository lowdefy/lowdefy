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

const builtinMessages = {
  'engine.action.loading': 'Loading',
  'engine.action.success': 'Success',
  'engine.validation.fieldRequired': 'This field is required',
  'engine.validation.summary':
    '{count, plural, one {Your input has # validation error} other {Your input has # validation errors}}',
  'client.popupBlocked':
    'A popup blocker may be preventing the application from opening the page. Approve the popup to continue.',
  'client.requestError': 'Request error',
  'client.backAriaLabel': 'back',
  'client.shortcutThen': 'then',
  'errorPage.name': 'Error',
  'errorPage.message': 'An error has occurred.',
  'errorPage.homeLink': 'Return to home page',

  // Agent runtime — surfaces in browser as HTTP error responses / streamed errors
  'agent.runtime.methodNotAllowed': 'Only POST requests are supported.',
  'agent.runtime.invalidPath': 'Invalid agent path',
  'agent.runtime.messagesMustBeArray': 'messages must be an array',
  'agent.runtime.urlQueryMustBeObject': 'urlQuery must be an object',
  'agent.runtime.sharedStateMustBeObject': 'sharedState must be an object',
  'agent.runtime.agentNotFound': 'Agent "{agentId}" does not exist.',
  'agent.runtime.agentTypeNotFound': 'Agent type "{type}" can not be found.',
  'agent.runtime.toolExecutionFailed': 'Endpoint execution failed',

  // AgentChat block UI
  'agent.sender.placeholder': 'Type a message...',
  'agent.toolApproval.approve': 'Approve',
  'agent.toolApproval.reject': 'Reject',
  'agent.message.copy': 'Copy',
  'agent.message.feedback': 'Feedback',
  'agent.message.regenerate': 'Regenerate',
  'agent.message.delete': 'Delete',
  'agent.toolResult.completed': 'Completed',
  'agent.toolResult.completedNoData': 'Completed (no data)',
  'agent.toolResult.empty': 'Empty',
  'agent.toolResult.emptyList': 'Empty list',
  'agent.toolResult.showMore': 'Show more',
  'agent.toolResult.showLess': 'Show less',

  // antd X built-ins — apps can override per-locale via config.i18n.messages.
  // For en_US and zh_CN, XProvider's pack already covers these natively.
  'agent.antdx.conversations.create': 'New chat',
  'agent.antdx.sender.stopLoading': 'Stop loading',
  'agent.antdx.bubble.editableOk': 'OK',
  'agent.antdx.bubble.editableCancel': 'Cancel',
  'agent.antdx.actions.feedbackLike': 'Like',
  'agent.antdx.actions.feedbackDislike': 'Dislike',
};

export default builtinMessages;
