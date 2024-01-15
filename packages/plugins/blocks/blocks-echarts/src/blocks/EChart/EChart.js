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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { registerTheme } from 'echarts';
import ReactECharts from 'echarts-for-react';

class EChart extends React.Component {
  constructor(props) {
    super(props);
    this.triggerEvent = this.triggerEvent.bind(this);
    // TODO: Test events.
    this.allEvents = {
      click: (event) => this.triggerEvent('click', event),
      dblclick: (event) => this.triggerEvent('dblclick', event),
      mousedown: (event) => this.triggerEvent('mousedown', event),
      mousemove: (event) => this.triggerEvent('mousemove', event),
      mouseup: (event) => this.triggerEvent('mouseup', event),
      mouseover: (event) => this.triggerEvent('mouseover', event),
      mouseout: (event) => this.triggerEvent('mouseout', event),
      globalout: (event) => this.triggerEvent('globalout', event),
      contextmenu: (event) => this.triggerEvent('contextmenu', event),
      highlight: (event) => this.triggerEvent('highlight', event),
      downplay: (event) => this.triggerEvent('downplay', event),
      selectchanged: (event) => this.triggerEvent('selectchanged', event),
      legendselectchanged: (event) => this.triggerEvent('legendselectchanged', event),
      legendselected: (event) => this.triggerEvent('legendselected', event),
      legendunselected: (event) => this.triggerEvent('legendunselected', event),
      legendselectall: (event) => this.triggerEvent('legendselectall', event),
      legendinverseselect: (event) => this.triggerEvent('legendinverseselect', event),
      legendscroll: (event) => this.triggerEvent('legendscroll', event),
      datazoom: (event) => this.triggerEvent('datazoom', event),
      datarangeselected: (event) => this.triggerEvent('datarangeselected', event),
      timelinechanged: (event) => this.triggerEvent('timelinechanged', event),
      timelineplaychanged: (event) => this.triggerEvent('timelineplaychanged', event),
      restore: (event) => this.triggerEvent('restore', event),
      dataviewchanged: (event) => this.triggerEvent('dataviewchanged', event),
      magictypechanged: (event) => this.triggerEvent('magictypechanged', event),
      geoselectchanged: (event) => this.triggerEvent('geoselectchanged', event),
      geoselected: (event) => this.triggerEvent('geoselected', event),
      geounselected: (event) => this.triggerEvent('geounselected', event),
      axisareaselected: (event) => this.triggerEvent('axisareaselected', event),
      brush: (event) => this.triggerEvent('brush', event),
      brushEnd: (event) => this.triggerEvent('brushEnd', event),
      brushselected: (event) => this.triggerEvent('brushselected', event),
      globalcursortaken: (event) => this.triggerEvent('globalcursortaken', event),
      rendered: (event) => this.triggerEvent('rendered', event),
      finished: (event) => this.triggerEvent('finished', event),
    };
    this.onEvents = Object.keys(this.allEvents).reduce((acc, eventName) => {
      if (props.events[eventName]) acc[eventName] = this.allEvents[eventName];
      return acc;
    }, {});
    if (props.properties.theme) {
      registerTheme(`custom_theme_${props.blockId}`, props.properties.theme);
    }
  }
  triggerEvent(name, event) {
    this.props.methods.triggerEvent({
      name,
      event,
    });
  }
  render() {
    return (
      <div
        style={{
          height: this.props.properties.height ?? 300,
          width: this.props.properties.width ?? '100%',
        }}
      >
        <ReactECharts
          lazyUpdate={true}
          notMerge={true}
          onEvents={this.onEvents ?? {}}
          option={{
            ...(this.props.properties.option ?? {}),
            dataset:
              this.props.properties.option?.dataset &&
              this.props.properties.option?.dataset?.source === null
                ? {
                    ...this.props.properties.option.dataset,
                    source: [],
                  }
                : this.props.properties.option?.dataset,
          }}
          opts={{
            height: this.props.properties.height ?? 300,
            ...(this.props.properties.init ?? {}),
          }}
          style={this.props.properties.style ?? {}}
          theme={this.props.properties.theme && `custom_theme_${this.props.blockId}`}
        />
      </div>
    );
  }
}

EChart.defaultProps = blockDefaultProps;
EChart.meta = {
  category: 'display',
  icons: [],
  styles: [],
};

export default EChart;
