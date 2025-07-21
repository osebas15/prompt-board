#!/bin/bash
# install-day2-dependencies.sh

echo "Installing Day 2 dependencies..."

# Install database testing utilities
npm install --save-dev @faker-js/faker@^8.0.0
npm install --save-dev pg@^8.11.0
npm install --save-dev @types/pg@^8.10.0

# Install performance testing tools
npm install --save-dev clinic@^18.0.0
npm install --save-dev autocannon@^7.14.0

# Install additional testing utilities
npm install --save-dev supertest@^6.3.3
npm install --save-dev @types/supertest@^2.0.12

echo "Day 2 dependencies installed successfully!"
echo "Run 'npm run test:database' to verify setup"
