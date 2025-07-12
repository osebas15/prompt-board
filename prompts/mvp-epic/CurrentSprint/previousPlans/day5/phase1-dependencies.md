# Phase 1: Update Dependencies and Fix Imports

## 1.1 Update package.json Dependencies

### Remove deprecated package:
```bash
npm uninstall @google/generative-ai
```

### Install new Google Gen AI SDK:
```bash
npm install @google/genai
```

### Update package.json scripts if needed:
- Ensure test scripts include LLM tests
- Add environment variable validation

## 1.2 Update Environment Variables

### Current (deprecated):
```
VITE_GEMINI_API_KEY=your_key
```

### New SDK supports:
```
VITE_GOOGLE_API_KEY=your_key  # Preferred name
# OR keep existing VITE_GEMINI_API_KEY for compatibility
```

## 1.3 Update Import Statements

### Files to update:
1. `src/lib/llm/providers/gemini/GeminiProvider.ts`
2. `src/lib/llm/types/index.ts` (if needed)
3. All test files importing the old SDK

### Old import:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
```

### New import:
```typescript
import { GoogleGenAI } from '@google/genai';
```

## 1.4 API Changes to Address

### Initialization Changes:
- Old: `new GoogleGenerativeAI(apiKey)`
- New: `new GoogleGenAI({apiKey: apiKey})`

### Method Changes:
- Old: `getGenerativeModel()`
- New: `ai.models.generateContent()` or `ai.models.generateContentStream()`

### Streaming Changes:
- Old: `generateContentStream()` returns result with `.stream`
- New: `generateContentStream()` returns direct async iterator

## 1.5 Type Definition Updates

### Update interfaces to match new SDK:
- Response types may have changed
- Error types may have changed  
- Configuration options may have different names

## Dependencies
- Node.js 20+ (requirement for new SDK)
- Existing project dependencies remain the same

## Success Criteria
- [ ] Package successfully installs
- [ ] No import errors in TypeScript compilation
- [ ] Environment variables load correctly
- [ ] API client initializes without errors
