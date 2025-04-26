.PHONY: install setup start clean migrate-up migrate-down docker-up docker-down

install:
	npm install

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

clean: docker-down
	docker-compose down -v
	rm -rf node_modules

# Run database migrations
migrate-up:
	npm run migrate:up

migrate-down:
	npm run migrate:down

# Start the application in development mode
start:
	npm run start

# Complete setup: install dependencies, start containers, and run migrations
setup: install docker-up
	@echo "Waiting for database to be ready..."
	@sleep 5
	@make migrate-up
	@echo "Setup complete! Run 'make start' to start the application."