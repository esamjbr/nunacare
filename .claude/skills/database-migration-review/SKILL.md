---
name: database-migration-review
description: Review database schema changes and migrations for safety, correctness, and production risk.
---

# Database Migration Review

Check:

- Entity/model changes
- Migration contents
- Nullability
- Foreign keys
- Indexes
- Constraints
- Data backfill
- Destructive operations
- Rollback risk
- Production safety
- Query performance impact
- Compatibility with existing data

Output:

1. Safe/unsafe verdict
2. Risky operations
3. Data-loss risks
4. Missing indexes or constraints
5. Required changes
6. Suggested test queries
7. Rollback considerations

Do not edit migrations unless explicitly asked.

