const changeCase = require('change-case');
const type = require('@lowdefy/helpers').type;
const get = require('@lowdefy/helpers').get;

const testStr = 'test string';

const testArr = ['test string 1', 'test string 2', 'test string 3'];

const testObj = {
  field_1: 'test string 1',
  field_2: 'test string 2',
};

// const {
//   camelCase,
//   capitalCase,
//   constantCase,
//   dotCase,
//   headerCase,
//   noCase,
//   paramCase,
//   pascalCase,
//   pathCase,
//   sentenceCase,
//   snakeCase,
// } = changeCase;

// const myChangeCase = {
//   camelCase,
//   capitalCase,
//   constantCase,
//   dotCase,
//   headerCase,
//   noCase,
//   paramCase,
//   pascalCase,
//   pathCase,
//   sentenceCase,
//   snakeCase,
// };

const supportedMethods = [
  'camelCase',
  'capitalCase',
  'constantCase',
  'dotCase',
  'headerCase',
  'noCase',
  'paramCase',
  'pascalCase',
  'pathCase',
  'sentenceCase',
  'snakeCase',
];

const convertArray = ({ methodName, on, options }) => {
  return on.map((item) => {
    if (type.isString(item)) {
      return changeCase[methodName](item, options);
    }
    return item;
  });
};

const convertObject = ({ methodName, on, options = {} }) => {
  const result = {};
  const keyConverter = options.convertKeys
    ? (key) => changeCase[methodName](key, options)
    : (key) => key;
  const valueConverter = get(options, 'convertValues', { default: true })
    ? (val) => changeCase[methodName](val, options)
    : (val) => val;

  Object.entries(on).forEach((item) => {
    result[keyConverter(item[0])] = valueConverter(item[1]);
  });
  return result;
};

const makeCaseChanger =
  ({ methodName }) =>
  (on, options = {}) => {
    if (type.isObject(on)) {
      return convertObject({ methodName, on, options });
    }
    if (type.isArray(on)) {
      return convertArray({ methodName, on, options });
    }
    if (type.isString(on)) {
      return changeCase[methodName](on, options);
    }
    return on;
  };

const functions = {};
const meta = {};
supportedMethods.forEach((methodName) => {
  functions[methodName] = makeCaseChanger({ methodName });
  meta[methodName] = { namedArgs: ['on', 'options'], validTypes: ['array', 'object'] };
});

const opts = {
  // delimiter: '||',
  // convertKeys: true,
  // convertValues: false,
};

// console.log(makeCaseChanger({ methodName: 'snakeCase' })(test));

// console.log(
//   // convertArray({ methodName: 'snakeCase', on: testArr })
//   convertObject({
//     methodName: 'headerCase',
//     on: testObj,
//     options: opts,
//   })
//   // makeCaseChanger({ methodName: 'headerCase' })(
//   //   testObj,
//   //   (convertValues = false),
//   //   (convertKeys = true)
//   // )
// );
