#!/bin/bash
# install-day9-dependencies.sh

echo "Installing Day 9 dependencies..."

# Install performance monitoring tools
npm install --save-dev web-vitals@^3.5.0
npm install --save-dev @welldone-software/why-did-you-render@^8.0.0
npm install --save-dev react-performance-testing@^1.0.0

# Install E2E testing framework
npm install --save-dev @playwright/test@^1.40.0
npm install --save-dev playwright@^1.40.0

# Install performance profiling tools
npm install --save-dev clinic@^18.0.0
npm install --save-dev autocannon@^7.14.0
npm install --save-dev lighthouse@^11.4.0

# Install additional testing utilities
npm install --save-dev @testing-library/jest-dom@^6.1.0
npm install --save-dev jest-environment-jsdom@^29.7.0

# Install bundle analysis tools
npm install --save-dev webpack-bundle-analyzer@^4.10.0
npm install --save-dev bundlesize@^0.18.2

# Install service worker testing
npm install --save-dev workbox-webpack-plugin@^7.0.0
npm install --save-dev workbox-cli@^7.0.0

echo "Day 9 dependencies installed successfully!"
echo "Run 'npm run test:all' to verify complete testing setup"
