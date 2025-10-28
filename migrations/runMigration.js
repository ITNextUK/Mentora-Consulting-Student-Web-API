require('dotenv').config();
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Run database migration
 */
const runMigration = async () => {
  try {
    logger.info('Starting database migration...');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '001_add_courses_locations_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    // Execute migration
    await sequelize.query(migrationSQL);
    logger.info('Migration executed successfully');

    // Verify columns were added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'mentora_ref'
      AND table_name = 'ref_mas_student'
      AND column_name IN ('courses_of_interest', 'location_interests')
      ORDER BY column_name
    `);

    if (results.length === 2) {
      logger.info('Verification successful - New columns added:');
      results.forEach(col => {
        logger.info(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      logger.warn('Verification warning - Expected 2 columns, found:', results.length);
    }

    await sequelize.close();
    logger.info('Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
runMigration();
