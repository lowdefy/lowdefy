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

import React, { useEffect, useRef } from 'react';
import { Carousel } from 'antd';
import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const getSlides = ({ content, slides }) => {
  if (!slides) {
    return Object.keys(content)
      .sort()
      .map((key) => ({ key }));
  }
  return slides;
};

// antd 6 renamed dotPosition to dotPlacement, with left/right as start/end.
const dotPlacements = { left: 'start', right: 'end', top: 'top', bottom: 'bottom' };

const CarouselBlock = ({ blockId, classNames = {}, content, properties, methods, styles = {} }) => {
  // slides is Lowdefy config, not a react-slick setting, so it is not passed to antd.
  const { dotPosition, slides: slidesConfig, ...carouselProperties } = properties;
  const slides = getSlides({ content, slides: slidesConfig });

  const carousel = useRef();

  useEffect(() => {
    methods.registerMethod('goTo', ({ slide, dontAnimate = false }) => {
      const slideNumber = slides.findIndex((item) => {
        return item.key === slide;
      });
      if (slideNumber !== -1) {
        carousel.current.goTo(slideNumber, dontAnimate);
      }
    });
    methods.registerMethod('next', () => {
      carousel.current.next();
    });
    methods.registerMethod('prev', () => {
      carousel.current.prev();
    });
  }, []);

  return (
    <Carousel
      {...carouselProperties}
      dotPlacement={carouselProperties.dotPlacement ?? dotPlacements[dotPosition]}
      id={blockId}
      afterChange={(current) => {
        methods.triggerEvent({
          name: 'afterChange',
          event: { current: slides[current] },
        });
      }}
      beforeChange={(current, next) => {
        methods.triggerEvent({
          name: 'beforeChange',
          event: { current: slides[current], next: slides[next] },
        });
      }}
      onInit={() => methods.triggerEvent({ name: 'onInit' })}
      // react-slick drops an onSwipe prop, so the swipe is read from its swipeEvent callback.
      swipeEvent={(direction) => methods.triggerEvent({ name: 'onSwipe', event: { direction } })}
      className={classNames.element}
      style={styles.element}
      ref={carousel}
    >
      {slides?.map((slide) => (
        <div key={slide.key}>{content[slide.key] && content[slide.key]()}</div>
      ))}
    </Carousel>
  );
};

export default withTheme('Carousel', withBlockDefaults(CarouselBlock));
