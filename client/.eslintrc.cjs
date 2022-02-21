module.exports = {
    'env': {
        'node': true,
        'es2021': true
    },
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/type-annotation-spacing': [
            'error',
            { before: false, after: false, overrides: { arrow: { before: true, after: true } } }
        ]
    }
};
