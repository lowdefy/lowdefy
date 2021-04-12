module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '12',
          esmodules: true,
        },
        exclude: ['proposal-dynamic-import'],
      },
    ],
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '12',
              esmodules: true,
            },
          },
        ],
      ],
    },
  },
};
