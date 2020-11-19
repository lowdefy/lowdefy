import schemaTest from './schemaTest';

test(`Test Schema pass`, () => {
  const validate = schemaTest({
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: {
          type: 'string',
          description: 'Paragraph text content.',
        },
      },
    },
  });
  const valid = validate({
    id: 'one',
    type: 'Test',
    properties: {
      content: 'strings',
    },
  });
  expect(valid).toEqual(true);
  expect(validate.errors).toEqual(null);
});

test(`Test Schema fail required`, () => {
  const validate = schemaTest({
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: {
          type: 'string',
          description: 'Paragraph text content.',
        },
      },
    },
  });
  const valid = validate({
    type: 'Test',
    properties: {
      content: 'strings',
    },
  });
  expect(valid).toEqual(false);
  expect(validate.errors).toEqual([
    {
      dataPath: '',
      keyword: 'required',
      message: "should have required property 'id'",
      params: {
        missingProperty: 'id',
      },
      schemaPath: '#/required',
    },
  ]);
});

test(`Test Schema fail properties`, () => {
  const validate = schemaTest({
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: {
          type: 'string',
          description: 'Paragraph text content.',
        },
      },
    },
  });
  const valid = validate({
    id: 'one',
    type: 'Test',
    properties: {
      mistake: 'strings',
    },
  });
  expect(valid).toEqual(false);
  expect(validate.errors).toEqual([
    {
      dataPath: '/properties',
      keyword: 'additionalProperties',
      message: 'should NOT have additional properties',
      params: {
        additionalProperty: 'mistake',
      },
      schemaPath: '#/properties/properties/additionalProperties',
    },
  ]);
});
