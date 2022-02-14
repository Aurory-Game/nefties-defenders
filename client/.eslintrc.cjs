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
        '@typescript-eslint/no-inferrable-types': 'off'
    }
};
