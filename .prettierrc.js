module.exports = {
  printWidth: 80,
  trailingComma: 'all',
  singleQuote: true,
  semi: false,
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: ['^@core/(.*)$', '^@server/(.*)$', '^@ui/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  overrides: [
    {
      files: '*.html',
      options: {
        printWidth: 120,
      },
    },
  ],
}
