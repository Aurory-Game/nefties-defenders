module.exports = {
    root: true,
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'windows'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'max-len': ['error', { 'code': 120 }],
        'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
        'spaced-comment': ['error', 'always', { 'block': { 'balanced': true } }],
        'block-spacing': ['error', 'always'],
        'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
        'keyword-spacing': ['error', { 'after': true }],
        'comma-spacing': ['error'],
        'no-trailing-spaces': ['error'],
        'no-multi-spaces': ['error'],
        'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0, 'maxBOF': 0 }],
        'eol-last': ['error', 'always'],
        'sort-imports': ['error', { 'ignoreDeclarationSort': true }]
    },
    extends: [
        'eslint:recommended',
    ],
};
