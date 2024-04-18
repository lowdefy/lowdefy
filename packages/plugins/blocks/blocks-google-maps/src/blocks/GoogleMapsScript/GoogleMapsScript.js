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
import { LoadScriptNext } from '@react-google-maps/api';
import { blockDefaultProps } from '@lowdefy/block-utils';

class GoogleMapsScript extends React.Component {
  constructor(props) {
    super(props);
    this.libraries = [...new Set(props.properties?.libraries || [])];
  }
  render() {
    const { blockId, properties, content } = this.props;
    return (
      <LoadScriptNext
        id={blockId}
        channel={properties.channel}
        googleMapsApiKey={properties.apiKey}
        language={properties.language}
        libraries={this.libraries}
        region={properties.region}
        version={properties.version}
      >
        {content.content && content.content()}
      </LoadScriptNext>
    );
  }
}

GoogleMapsScript.defaultProps = blockDefaultProps;
GoogleMapsScript.meta = {
  category: 'container',
  icons: [],
  styles: [],
};

export default GoogleMapsScript;
