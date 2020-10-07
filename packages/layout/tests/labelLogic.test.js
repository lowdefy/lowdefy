import labelLogic from '../src/labelLogic';

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

const defaultInput = {
  blockId: 'label_1',
  content: {},
  methods: { makeCss },
};

test('label default logic', () => {
  expect(labelLogic(defaultInput)).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic with required', () => {
  expect(labelLogic({ ...defaultInput, required: true })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic with required and validated', () => {
  expect(labelLogic({ ...defaultInput, required: true, validated: true })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{}}',
    validateStatus: 'success',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic with required, validated and validate', () => {
  expect(
    labelLogic({
      ...defaultInput,
      required: true,
      validated: true,
      validate: [{ message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.align = right', () => {
  expect(labelLogic({ ...defaultInput, properties: { align: 'right' } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.align = left', () => {
  expect(labelLogic({ ...defaultInput, properties: { align: 'left' } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.inline = true', () => {
  expect(labelLogic({ ...defaultInput, properties: { inline: true } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: '{}',
    labelCol: { flex: '0 1 auto' },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{"flexWrap":"inherit"}}',
    validateStatus: null,
    wrapperCol: { flex: '1 1 auto' },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { inline: true }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    properties: { inline: true },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual('success');
  expect(reponse.rowClassName).toEqual(
    'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{"flexWrap":"inherit"}}'
  );
  expect(
    labelLogic({
      ...defaultInput,
      properties: { inline: true },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: { flex: '0 1 auto' },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName:
      'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{"flexWrap":"inherit"}}',
    validateStatus: 'error',
    wrapperCol: { flex: '1 1 auto' },
  });
});

test('label default logic properties.colon = true', () => {
  expect(labelLogic({ ...defaultInput, properties: { colon: true } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { colon: true }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    properties: { colon: true },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual('success');
  expect(reponse.rowClassName).toEqual(
    'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{}}'
  );
  expect(
    labelLogic({
      ...defaultInput,
      properties: { colon: true },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.title = title_1', () => {
  expect(labelLogic({ ...defaultInput, properties: { title: 'title_1' } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'title_1',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { colon: true }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    properties: { title: 'title_1' },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual('success');
  expect(reponse.rowClassName).toEqual(
    'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{}}'
  );
  expect(
    labelLogic({
      ...defaultInput,
      properties: { title: 'title_1' },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'title_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.hasFeedback = false', () => {
  expect(labelLogic({ ...defaultInput, properties: { hasFeedback: false } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: false,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { hasFeedback: false }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    properties: { hasFeedback: false },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual(false);
  expect(reponse.rowClassName).toEqual('ant-form-item ant-form-item-has-success {"style":{}}');
  expect(
    labelLogic({
      ...defaultInput,
      properties: { hasFeedback: false },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-error {"style":{}}',
    validateStatus: false,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.size = small', () => {
  expect(labelLogic({ ...defaultInput, properties: { size: 'small' } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":-4},null]}',
    label: 'label_1',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { size: 'small' }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    properties: { colon: true },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual('success');
  expect(reponse.rowClassName).toEqual(
    'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{}}'
  );
  expect(
    labelLogic({
      ...defaultInput,
      properties: { size: 'small' },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":-4},null]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.disabled = true', () => {
  expect(labelLogic({ ...defaultInput, properties: { disabled: true } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: false,
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { disabled: true }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    properties: { hasFeedback: false },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual(false);
  expect(reponse.rowClassName).toEqual('ant-form-item ant-form-item-has-success {"style":{}}');
  expect(
    labelLogic({
      ...defaultInput,
      properties: { disabled: true },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: false,
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic properties.style && properties.extraStyle', () => {
  expect(
    labelLogic({ ...defaultInput, properties: { style: { b: 2 }, extraStyle: { a: 1 } } })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},{"a":1}]}',
    label: 'label_1',
    labelClassName: '{"style":{"b":2}}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { disabled: true }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    properties: { style: { b: 2 }, extraStyle: { a: 1 } },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {"style":{"b":2}}');
  expect(reponse.validateStatus).toEqual('success');
  expect(reponse.rowClassName).toEqual(
    'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{}}'
  );
  expect(
    labelLogic({
      ...defaultInput,
      properties: { style: { b: 2 }, extraStyle: { a: 1 } },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},{"a":1}]}',
    label: 'label_1',
    labelClassName: 'ant-form-item-required {"style":{"b":2}}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic content.label = () => one', () => {
  expect(labelLogic({ ...defaultInput, content: { label: () => 'one' } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'one',
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { colon: true }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    content: { label: () => 'one' },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual('success');
  expect(reponse.rowClassName).toEqual(
    'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{}}'
  );
  expect(
    labelLogic({
      ...defaultInput,
      content: { label: () => 'one' },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: 'one',
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});

test('label default logic label === "" ', () => {
  expect(labelLogic({ ...defaultInput, content: { label: () => '' } })).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: null,
    labelClassName: '{}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item {"style":{}}',
    validateStatus: null,
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
  let reponse = labelLogic({ ...defaultInput, properties: { colon: true }, required: true });
  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  reponse = labelLogic({
    ...defaultInput,
    content: { label: () => '' },
    required: true,
    validated: true,
  });

  expect(reponse.labelClassName).toEqual('ant-form-item-required {}');
  expect(reponse.validateStatus).toEqual('success');
  expect(reponse.rowClassName).toEqual(
    'ant-form-item ant-form-item-has-feedback ant-form-item-has-success {"style":{}}'
  );
  expect(
    labelLogic({
      ...defaultInput,
      content: { label: () => '' },
      required: true,
      validated: true,
      validate: [{ status: 'error', message: 'fail' }],
    })
  ).toEqual({
    extraClassName: 'ant-form-item-extra {"style":[{"marginTop":0},null]}',
    label: null,
    labelClassName: 'ant-form-item-required {}',
    labelCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
    labelColClassName: 'ant-form-item-label ant-form-item-label-left',
    rowClassName: 'ant-form-item ant-form-item-has-feedback ant-form-item-has-error {"style":{}}',
    validateStatus: 'error',
    wrapperCol: {
      sm: {
        span: 24,
      },
      xs: {
        span: 24,
      },
    },
  });
});
