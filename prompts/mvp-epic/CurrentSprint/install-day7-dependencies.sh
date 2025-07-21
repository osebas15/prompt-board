#!/bin/bash
# install-day7-dependencies.sh

echo "Installing Day 7 dependencies..."

# Install search and text processing utilities
npm install --save fuse.js@^7.0.0
npm install --save lunr@^2.3.9
npm install --save highlight.js@^11.9.0
npm install --save react-highlight-words@^0.20.0

# Install WebSocket and real-time utilities
npm install --save ws@^8.14.0
npm install --save @types/ws@^8.5.0
npm install --save reconnecting-websocket@^4.4.0

# Install performance optimization tools
npm install --save-dev web-vitals@^3.5.0
npm install --save-dev performance-observer@^1.0.0

# Install testing utilities for WebSocket
npm install --save-dev mock-socket@^9.3.0
npm install --save-dev @testing-library/react-hooks@^8.0.1

# Install real-time testing framework
npm install --save-dev @testing-library/user-event@^14.5.0

echo "Day 7 dependencies installed successfully!"
echo "Run 'npm run test:search-realtime' to verify implementation"
