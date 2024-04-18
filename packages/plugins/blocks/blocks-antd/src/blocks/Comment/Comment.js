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

import React from 'react';
import { Comment } from 'antd';
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';

import Avatar from '../Avatar/Avatar.js';

const CommentBlock = ({ blockId, components, content, properties, methods }) => {
  let avatar = {};
  if (type.isObject(properties.avatar)) {
    avatar = properties.avatar;
  } else if (type.isString(properties.avatar)) {
    avatar = { src: properties.avatar };
  } else if (type.isString(properties.author)) {
    avatar = {
      content: properties.author.substring(0, 2),
    };
  }

  return (
    <Comment
      id={blockId}
      actions={[content.actions && content.actions()]}
      author={properties.author || (content.author && content.author())}
      content={properties.content || (content.content && content.content())}
      datetime={properties.datetime}
      avatar={<Avatar components={components} properties={avatar} methods={methods} />}
    >
      {content.children && content.children()}
    </Comment>
  );
};

CommentBlock.defaultProps = blockDefaultProps;
CommentBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Comment/style.less'],
};

export default CommentBlock;
