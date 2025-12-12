.PHONY: help dev build test docker-up docker-down migrate-up migrate-down

help:
	@echo "Available commands:"
	@echo "  make dev          - Run the API server locally"
	@echo "  make build        - Build the Go binary"
	@echo "  make test         - Run tests"
	@echo "  make docker-up    - Start all services with Docker Compose"
	@echo "  make docker-down  - Stop all Docker services"
	@echo "  make migrate-up   - Run database migrations"
	@echo "  make migrate-down - Rollback database migrations"

dev:
	go run cmd/api/main.go

build:
	go build -o bin/playforge cmd/api/main.go

test:
	go test -v ./...

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f api

migrate-up:
	@echo "Running migrations..."
	psql $(DATABASE_URL) -f migrations/init.sql

migrate-down:
	@echo "Rolling back migrations..."
	psql $(DATABASE_URL) -f migrations/down.sql


