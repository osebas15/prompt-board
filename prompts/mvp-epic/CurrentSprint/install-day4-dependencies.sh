#!/bin/bash
# install-day4-dependencies.sh

echo "Installing Day 4 dependencies..."

# Install infinite scroll testing utilities
npm install --save-dev intersection-observer@^0.12.2
npm install --save-dev resize-observer-polyfill@^1.5.1

# Install WebSocket testing utilities
npm install --save-dev ws@^8.14.0
npm install --save-dev @types/ws@^8.5.0

# Install state management testing utilities
npm install --save-dev @testing-library/react-hooks@^8.0.1
npm install --save-dev @testing-library/user-event@^14.5.0

# Install performance monitoring for hooks
npm install --save-dev @welldone-software/why-did-you-render@^8.0.0

echo "Day 4 dependencies installed successfully!"
echo "Run 'npm run test:advanced-hooks' to verify implementation"
