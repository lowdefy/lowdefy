/*
  Copyright 2020-2023 Lowdefy, Inc

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

// TODO: Better name needed here maybe?
function logRequest({ context, metadata = {} }) {
  const { user = {} } = context;
  context.logger.debug({
    // TODO:
    // app_name
    // app_version
    // lowdefy_version
    // build_hash
    // config_hash
    user: {
      id: user.id,
      roles: user.roles,
      sub: user.sub,
      session_id: user.session_id, // TODO: Implement session id
    },
    url: context.req.url,
    method: context.req.method,
    resolvedUrl: context.nextContext?.resolvedUrl,
    hostname: context.req.hostname,
    ...metadata,
  });
  // TODO:
  // Next local? nextContext.locale, nextContext.locales, nextContext.defaultLocale
  // console.log('params', nextContext.params);
}

export default logRequest;

/*
User ID
Session ID
Event Type/Action
Timestamp
Source IP Address
User Agent
Resource ID/Identifier
Outcome/Status
Reason
Details/Additional Information
Targeted System
Page URL
Referrer URL
IP Address

Response Time
Error Messages
Device Information
Input Data
Behavioral Metrics

Error Level/Severity
Error Message
Error Code
HTTP Method
Stack Trace
Payload/Body
Application Version
Environment Information
*/
