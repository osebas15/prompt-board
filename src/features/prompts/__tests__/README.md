# Integration Tests

This directory contains integration tests that connect to a real Supabase instance for end-to-end testing.

## Setup

1. **Start local Supabase**:
   ```bash
   npm run supabase:start
   ```

2. **Run integration tests**:
   ```bash
   # Run once
   npm run test:integration:run
   
   # Run in watch mode
   npm run test:integration:watch
   
   # Start Supabase and run tests
   npm run test:integration:local
   ```

## Test Structure

### `promptService.integration.test.ts`
- **Database Connection Tests**: Verify connection to local Supabase
- **CRUD Operations**: Test actual database operations
- **Error Handling**: Test error scenarios with real database

## Configuration

- Uses `vitest.integration.config.ts` for separate configuration
- Connects to `http://localhost:54321` (default local Supabase)
- Uses actual database tables and auth
- Runs tests sequentially to avoid conflicts
- Longer timeouts for database operations

## Important Notes

1. **Database State**: Tests create and clean up their own data
2. **User Management**: Tests create temporary users for testing
3. **Isolation**: Each test cleans up after itself
4. **Sequential Execution**: Tests run one at a time to avoid database conflicts

## Troubleshooting

- Make sure Supabase is running locally
- Check that the database schema is properly migrated
- Verify environment variables are set correctly
- Check Supabase logs if tests fail: `npm run supabase:status`
