#!/bin/bash
# install-day3-dependencies.sh

echo "Installing Day 3 dependencies..."

# Note: @testing-library/react-hooks is deprecated and incompatible with React 19
# Hook testing is now built into @testing-library/react (already installed)

# Install MSW for API mocking (already installed, but ensuring version)
npm install --save-dev msw@^2.0.0

# Install React Query development tools
npm install --save @tanstack/react-query-devtools@^5.0.0

# Ensure we have the latest @testing-library/react for hook testing
npm install --save-dev @testing-library/react@^16.0.0

echo "Day 3 dependencies installed successfully!"
echo "Note: Hook testing is now built into @testing-library/react"
echo "Use renderHook from @testing-library/react instead of @testing-library/react-hooks"
echo "Run 'npm run test' to verify React Query integration"
