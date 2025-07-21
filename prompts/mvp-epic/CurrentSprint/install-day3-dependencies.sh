#!/bin/bash
# install-day3-dependencies.sh

echo "Installing Day 3 dependencies..."

# Install React Query testing utilities
npm install --save-dev @testing-library/react-hooks@^8.0.1

# Install MSW for API mocking (already installed, but ensuring version)
npm install --save-dev msw@^2.0.0

# Install React Query development tools
npm install --save @tanstack/react-query-devtools@^5.0.0

# Install additional testing utilities for hooks
npm install --save-dev react-hooks-testing-library@^1.0.0

echo "Day 3 dependencies installed successfully!"
echo "Run 'npm run test:hooks' to verify React Query integration"
