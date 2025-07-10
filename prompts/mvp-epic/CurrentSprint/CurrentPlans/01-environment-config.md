# Environment Configuration Implementation

## File: `src/lib/env.ts`

**Purpose:** Validate environment variables and provide type-safe access

**Implementation Details:**
- Use Zod for runtime validation
- Type-safe environment variable access
- Clear error messages for missing variables
- Support for development and production configs

**Key Features:**
- Validation of Supabase URL and API key
- Optional Gemini API key validation
- Environment-specific configurations
- Runtime type safety

**Error Handling:**
- Throw descriptive errors for missing variables
- Validate URL formats
- Check API key patterns

**Testing Strategy:**
- Test with valid environment variables
- Test with missing variables
- Test with invalid formats
- Test environment-specific behavior
