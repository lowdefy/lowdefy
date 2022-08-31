/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Html5Qrcode } from 'html5-qrcode';

class QRScanner extends React.Component {
  constructor(props) {
    super(props);
    this.onNewScanResult = this.onNewScanResult.bind(this);
    this.onStart = this.onStart.bind(this);
    this.onStop = this.onStop.bind(this);
  }

  onNewScanResult(decodedText, decodedResult) {
    this.props.methods.setValue(decodedResult);
    this.props.methods.triggerEvent({ name: 'onScan' });
  }

  onStart() {
    this.html5QrCode?.start(
      { facingMode: this.props.properties.facingMode || 'environment' },
      { ...{ aspectRatio: 1 }, ...this.props.properties },
      this.onNewScanResult
    );
  }

  onStop() {
    this.html5QrCode?.stop();
  }

  componentDidMount() {
    this.html5QrCode = new Html5Qrcode(this.props.blockId);
    if (!this.props.properties.inactiveByDefault) {
      this.onStart();
    }
    this.props.methods.registerMethod('start', () => this.onStart());
    this.props.methods.registerMethod('stop', () => this.onStop());
  }
  componentWillUnmount() {
    this.onStop();
  }

  render() {
    const { blockId, properties, methods } = this.props;
    return <div id={blockId} className={methods.makeCssClass([properties.style])} />;
  }
}

QRScanner.defaultProps = blockDefaultProps;
QRScanner.meta = {
  valueType: 'object',
  category: 'input',
  icons: [],
  styles: [],
};

export default QRScanner;
