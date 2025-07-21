# Day 1 Implementation Plan: Database Schema Enhancement for Sprint 2

## Overview
We need to enhance the existing database schema to support Sprint 2's core prompt management requirements. The current schema is missing organizations, full-text search, and proper visibility controls.

## Analysis of Current State
✅ **Already implemented:**
- Basic prompts table with categories, tags, rating, etc.
- Categories table with user ownership
- Row Level Security (RLS) policies
- Basic indexes for performance

❌ **Missing for Sprint 2:**
- Organizations table for team collaboration
- Full-text search (tsvector column) on prompts
- Visibility enum (private/team/public) instead of boolean
- Organization_id on prompts table for team prompts
- Updated TypeScript types

## Implementation Steps

### 1. Create Organizations Table
**File:** `migration_01_organizations.sql`
- Organizations table with name, created_by, settings
- RLS policies for organization access
- Indexes for performance

### 2. Enhance Prompts Table for Sprint 2
**File:** `migration_02_enhance_prompts.sql`
- Add organization_id column to prompts
- Replace is_public boolean with visibility enum
- Add tsvector column for full-text search
- Create GIN index for full-text search
- Update RLS policies for team visibility

### 3. Update Categories for Organizations
**File:** `migration_03_categories_organizations.sql`
- Add organization_id to categories table
- Update constraints for org-specific categories
- Update RLS policies

### 4. Generate Updated TypeScript Types
**File:** `update_database_types.ts`
- Generate new types from enhanced schema
- Create type-safe query helpers
- Export proper Database interface

### 5. Create Database Test Utilities
**File:** `database_test_utils.ts`
- Helper functions for test setup/teardown
- Mock data generators
- Common test patterns

## Performance Considerations
- Full-text search with GIN indexes for <50ms queries
- Proper indexing strategy for organization queries
- Optimized RLS policies to prevent performance issues

## Security Requirements
- Organization-based access control
- Proper RLS policies for team collaboration
- Data isolation between organizations

## Breaking Changes
- is_public → visibility enum migration
- New organization_id requirements
- Updated TypeScript types

## Success Criteria
- All tests pass with new schema
- Full-text search performs under 50ms
- Organization isolation works correctly
- Type safety maintained throughout
