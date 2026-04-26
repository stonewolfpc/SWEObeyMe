module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
  // TypeScript type checking for .ts and .tsx files
  '*.{ts,tsx}': ['npx tsc --noEmit'],
};
