#!/bin/bash

# Store the original DATABASE_URL
ORIGINAL_DB_URL=$DATABASE_URL

# Set production DATABASE_URL
export DATABASE_URL="postgresql://acta_database_user:mUgwjgBhzu4kHvihRKtKnrt6LTvucgWQ@dpg-cvhvh2bv2p9s738n0lg0-a.frankfurt-postgres.render.com/acta_database"

echo "Attempting to run migrations..."
NODE_ENV=production npm run migration:run

# Check if migration failed
if [ $? -ne 0 ]; then
    echo "Migration failed. Resetting database..."
    
    # Drop and recreate database using TypeORM
    NODE_ENV=production npm run typeorm schema:drop -- -d typeorm.config.ts
    
    echo "Database reset. Running migrations again..."
    NODE_ENV=production npm run migration:run
    
    if [ $? -ne 0 ]; then
        echo "Migration failed again. Please check the errors above."
        # Restore original DATABASE_URL
        export DATABASE_URL=$ORIGINAL_DB_URL
        exit 1
    fi

    echo "Running seeder..."
    NODE_ENV=production npm run seed:run
fi

# Restore original DATABASE_URL
export DATABASE_URL=$ORIGINAL_DB_URL

echo "Database reset and seeding completed successfully!" 