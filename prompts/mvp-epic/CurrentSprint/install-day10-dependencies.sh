#!/bin/bash
# install-day10-dependencies.sh

echo "Installing Day 10 dependencies..."

# Install documentation tools
npm install --save-dev typedoc@^0.25.0
npm install --save-dev jsdoc@^4.0.0
npm install --save-dev @compodoc/compodoc@^1.1.0

# Install audit and security tools
npm install --save-dev audit-ci@^6.6.0
npm install --save-dev npm-audit-resolver@^3.0.0
npm install --save-dev snyk@^1.1232.0

# Install cross-browser testing
npm install --save-dev @playwright/test@^1.40.0
npm install --save-dev puppeteer@^21.5.0

# Install final testing utilities
npm install --save-dev jest-html-reporter@^3.10.0
npm install --save-dev coverage-istanbul-loader@^3.0.5

# Install code quality tools
npm install --save-dev prettier@^3.1.0
npm install --save-dev eslint-plugin-jsx-a11y@^6.8.0

echo "Day 10 dependencies installed successfully!"
echo "Run 'npm run validate:sprint' to perform final sprint validation"
