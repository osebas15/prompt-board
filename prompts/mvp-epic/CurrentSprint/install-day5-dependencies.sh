#!/bin/bash
# install-day5-dependencies.sh

echo "Installing Day 5 dependencies..."

# Install rich text editor and markdown support
npm install --save @uiw/react-md-editor@^3.23.0
npm install --save react-markdown@^9.0.0
npm install --save remark-gfm@^4.0.0

# Install form libraries and validation
npm install --save react-hook-form@^7.47.0
npm install --save @hookform/resolvers@^3.3.0
npm install --save zod@^3.22.0

# Install UI component utilities
npm install --save @headlessui/react@^1.7.17
npm install --save @heroicons/react@^2.0.18
npm install --save clsx@^2.0.0

# Install accessibility testing
npm install --save-dev @axe-core/react@^4.8.0
npm install --save-dev jest-axe@^8.0.0

# Install additional testing utilities
npm install --save-dev @testing-library/user-event@^14.5.0

echo "Day 5 dependencies installed successfully!"
echo "Run 'npm run test:components' to verify component implementation"
