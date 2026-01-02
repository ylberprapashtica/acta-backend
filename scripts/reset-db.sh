#!/bin/bash

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

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
        exit 1
    fi

    echo "Running seeder..."
    NODE_ENV=production npm run seed:run
fi

echo "Database reset and seeding completed successfully!" 