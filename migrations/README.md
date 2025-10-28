# Database Migration Guide

## Migration: Add Courses of Interest and Location Interests

### Overview
This migration adds two new JSONB columns to the `mentora_ref.ref_mas_student` table:
- `courses_of_interest`: Stores array of course preferences
- `location_interests`: Stores array of preferred UK locations

### Prerequisites
- PostgreSQL 12+ (JSONB support)
- Access to `mentora_consulting` database
- User with ALTER TABLE privileges on `mentora_ref` schema

### Running the Migration

#### Option 1: Using psql command line
```bash
psql -U postgres -d mentora_consulting -f migrations/001_add_courses_locations_fields.sql
```

#### Option 2: Using pgAdmin
1. Open pgAdmin and connect to your database
2. Open Query Tool
3. Load the migration file: `migrations/001_add_courses_locations_fields.sql`
4. Execute the query

#### Option 3: Using Node.js script
```bash
node migrations/runMigration.js
```

### What This Migration Does

1. **Adds `courses_of_interest` column**
   - Type: JSONB
   - Default: `[]` (empty array)
   - Stores: `[{courseName: string, level: string, university: string}]`

2. **Adds `location_interests` column**
   - Type: JSONB
   - Default: `[]` (empty array)
   - Stores: `[string, string, ...]` (array of city names)

3. **Updates `sp_ref_student_insert` stored procedure**
   - Adds parameters for new fields
   - Handles insertion of courses and locations

4. **Updates `sp_ref_student_modify` stored procedure**
   - Adds parameters for new fields
   - Handles updating of courses and locations

### Rollback (if needed)

To rollback this migration:

```sql
-- Remove columns
ALTER TABLE mentora_ref.ref_mas_student DROP COLUMN IF EXISTS courses_of_interest;
ALTER TABLE mentora_ref.ref_mas_student DROP COLUMN IF EXISTS location_interests;

-- Restore original stored procedures (run the original SP definitions)
```

### Verification

After running the migration, verify:

```sql
-- Check columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'mentora_ref'
AND table_name = 'ref_mas_student'
AND column_name IN ('courses_of_interest', 'location_interests');

-- Check stored procedure parameters
SELECT 
    routine_name,
    parameter_name,
    data_type
FROM information_schema.parameters
WHERE specific_schema = 'mentora_ref'
AND routine_name IN ('sp_ref_student_insert', 'sp_ref_student_modify')
AND parameter_name IN ('p_courses_of_interest', 'p_location_interests');
```

### Example Data

#### Courses of Interest
```json
[
  {
    "courseName": "Computer Science",
    "level": "Master's",
    "university": "University of Oxford"
  },
  {
    "courseName": "Data Science",
    "level": "Master's",
    "university": "Imperial College London"
  }
]
```

#### Location Interests
```json
["London", "Oxford", "Cambridge", "Edinburgh"]
```

### Testing

After migration, test the API:

```bash
# Register a student
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Update profile with courses and locations
curl -X PUT http://localhost:5001/api/v1/students/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "coursesOfInterest": [
      {"courseName": "Computer Science", "level": "Master'\''s", "university": "Oxford"}
    ],
    "locationInterests": ["London", "Oxford"]
  }'
```

### Troubleshooting

**Error: column already exists**
- Migration has already been run
- Check if columns exist before running again

**Error: function does not exist**
- Ensure you're connected to the correct database
- Check schema name is `mentora_ref`

**Error: permission denied**
- User needs ALTER TABLE and CREATE FUNCTION privileges
- Grant necessary permissions:
  ```sql
  GRANT ALL ON SCHEMA mentora_ref TO your_user;
  GRANT ALL ON ALL TABLES IN SCHEMA mentora_ref TO your_user;
  ```

### Support

For issues or questions:
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
- Verify database connection: `psql -U postgres -d mentora_consulting -c "\conninfo"`
- Contact: support@mentoraconsulting.com
