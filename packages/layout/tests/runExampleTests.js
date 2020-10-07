import React from 'react';
import renderer from 'react-test-renderer';
import AutoBlockSim from '../demo/AutoBlockSim';

const runExampleTests = (examples, options = { highlightBorders: true }) => {
  const makeCss = jest.fn();
  const makeCssImp = (style, op) => JSON.stringify({ style, options: op });

  beforeEach(() => {
    makeCss.mockReset();
    makeCss.mockImplementation(makeCssImp);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  examples.forEach((ex) => {
    test(ex.id, () => {
      const component = renderer.create(
        <AutoBlockSim
          block={ex}
          state={{}}
          areaKey="content"
          makeCss={makeCss}
          highlightBorders={options.highlightBorders}
        />
      );
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
};

export default runExampleTests;
