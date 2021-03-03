/*
  Copyright 2020-2021 Lowdefy, Inc

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

import React from 'react';
import { useLocation, Redirect } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { urlQuery } from '@lowdefy/helpers';
import { Loading } from '@lowdefy/block-tools';

//# user
const LOGIN_CALLBACK = gql`
  query openIdCallback($openIdCallbackInput: OpenIdCallbackInput!) {
    openIdCallback(openIdCallbackInput: $openIdCallbackInput) {
      accessToken
      idToken
      input
      pageId
      urlQuery
    }
  }
`;

// const GET_MENU = gql`
//   fragment MenuLinkFragment on MenuLink {
//     id
//     type
//     properties
//     pageId
//     url
//   }
//   query getMenu {
//     menu {
//       menus {
//         id
//         menuId
//         properties
//         links {
//           ...MenuLinkFragment
//           ... on MenuGroup {
//             id
//             type
//             properties
//             links {
//               ... on MenuGroup {
//                 id
//                 type
//                 properties
//                 links {
//                   ...MenuLinkFragment
//                 }
//               }
//               ...MenuLinkFragment
//             }
//           }
//         }
//       }
//       homePageId
//     }
//   }
// `;

// const FetchMenu = ({ rootContext, callbackResponse }) => {
//   // const { data, loading, error } = useQuery(GET_MENU, {
//   //   fetchPolicy: 'network-only',
//   //   variables: {
//   //     branch,
//   //   },
//   //   context: {
//   //     newToken: callbackResponse.accessToken,
//   //   },
//   // });

//   if (error) return <ErrorPage error={error} />;
//   if (loading) return <LoadingPage />;
//   if (callbackResponse.firstSignin) {
//     return <Redirect to="/first-signin" />;
//   }
//   rootContext.menu = get();
//   // to prevent looping login
//   // maybe switch to regular expression, since this will break pageIds that start with "login" (e.g. login-success-page)
//   if (type.isNone(callbackResponse.location) || callbackResponse.location.includes('/login')) {
//     return <Redirect to="/" />;
//   }
//   return <Redirect to={callbackResponse.location} />;
// };

const LoginCallback = ({ code, state, rootContext }) => {
  const { data, loading, error } = useQuery(LOGIN_CALLBACK, {
    variables: {
      openIdCallbackInput: {
        code,
        state,
      },
    },
  });
  if (error) {
    throw new Error(error);
  }
  if (loading) return <Loading type="Spinner" properties={{ height: '100vh' }} />;
  rootContext.user = console.log(data);
  // localStore.setItem(`idToken`, data.openidCallback.accessToken);
  return <div>DONE</div>;
  // return <FetchMenu callbackResponse={data.openidCallback} branch={branch} />;
};

const OpenIdCallback = ({ rootContext }) => {
  const { search } = useLocation();
  const { code, state, error, error_description } = urlQuery.parse(search.slice(0) || '');

  if (error) {
    if (error_description) throw new Error(error_description);
    throw new Error(error);
  }
  if (code && state) {
    return <LoginCallback code={code} state={state} rootContext={rootContext} />;
  }
};

export default OpenIdCallback;
