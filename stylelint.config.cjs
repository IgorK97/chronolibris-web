// Source - https://stackoverflow.com/a/63784195
// Posted by Chris, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-07, License - CC BY-SA 4.0

module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
        ],
      },
    ],
    // "declaration-block-trailing-semicolon": null,
    'no-descending-specificity': null,
  },
};
