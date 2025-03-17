#!/bin/sh

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run database migrations
echo "Running database migrations..."
npm run migrate:up

# Start the application
echo "Starting the application..."
npm start