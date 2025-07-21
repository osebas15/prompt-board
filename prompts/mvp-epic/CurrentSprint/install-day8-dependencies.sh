#!/bin/bash
# install-day8-dependencies.sh

echo "Installing Day 8 dependencies..."

# Install AI/ML utilities for tag suggestions
npm install --save @xenova/transformers@^2.6.0
npm install --save natural@^6.8.0
npm install --save stopword@^2.0.0

# Install advanced input and selection components
npm install --save react-select@^5.8.0
npm install --save @headlessui/react@^1.7.17
npm install --save downshift@^8.3.0

# Install data visualization for analytics
npm install --save recharts@^2.8.0
npm install --save d3@^7.8.5
npm install --save @types/d3@^7.4.0

# Install text processing utilities
npm install --save fuzzy@^0.1.3
npm install --save string-similarity@^4.0.1
npm install --save @types/string-similarity@^4.0.0

# Install additional utilities
npm install --save uuid@^9.0.1
npm install --save @types/uuid@^9.0.0

echo "Day 8 dependencies installed successfully!"
echo "Run 'npm run test:categories-tags' to verify implementation"
