/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: "lf",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  printWidth: 80,
  trailingComma: "es5",
  plugins: [
    // comment for better diff
    "prettier-plugin-organize-imports",
  ],
};
