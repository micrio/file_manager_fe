module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'simple-import-sort'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'simple-import-sort/imports': ['error', {
      groups: [
        ['^react$'],                       // 1. React core
        ['^[a-z@]'],                        // 3. third-party (lowercase / @scoped)
        ['^\\w'],                           // 4. third-party (uppercased)
        ['^@/components/ui/'],              // 5. @/components/ui/* (ui primitives)
        ['^@/constants/'],                  // 6. @/constants/*
        ['^@/store/'],                      // 7. @/store/*
        ['^@/components/common/'],          // 8. @/components/common/*
        ['^@/'],                            // 9. other @/ aliases
        ['^\\.'],                           // 10. relative paths
        ['\\.(png|jpe?g|svg|css|scss|less)$'], // 11. assets & styles
      ],
    }],
  },
}
