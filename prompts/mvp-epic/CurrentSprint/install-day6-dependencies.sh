#!/bin/bash
# install-day6-dependencies.sh

echo "Installing Day 6 dependencies..."

# Install virtual scrolling and performance utilities
npm install --save @tanstack/react-virtual@^3.0.0
npm install --save react-window@^1.8.8
npm install --save react-window-infinite-loader@^1.0.9

# Install layout and responsive utilities
npm install --save react-grid-layout@^1.4.0
npm install --save react-responsive@^9.0.2
npm install --save use-resize-observer@^9.1.0

# Install filtering and search utilities
npm install --save use-debounce@^9.0.4
npm install --save fuse.js@^7.0.0
npm install --save react-select@^5.8.0

# Install performance monitoring
npm install --save-dev @welldone-software/why-did-you-render@^8.0.0
npm install --save-dev react-performance-testing@^1.0.0

# Install additional testing utilities
npm install --save-dev @testing-library/jest-dom@^6.1.0

echo "Day 6 dependencies installed successfully!"
echo "Run 'npm run test:library' to verify library interface implementation"
