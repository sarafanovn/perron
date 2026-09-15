.DEFAULT_GOAL := help

.PHONY: help up down restart rebuild logs ps install dev build test

help: ## Show this help
	@echo "Docker (no local Node/npm required):"
	@echo "  make up       Build and start the site at http://localhost:8080"
	@echo "  make down     Stop and remove the container"
	@echo "  make restart  Restart the running container"
	@echo "  make rebuild  Rebuild the image from scratch and restart"
	@echo "  make logs     Follow container logs"
	@echo "  make ps       Show container status"
	@echo ""
	@echo "Local development (requires Node.js):"
	@echo "  make install  Install npm dependencies"
	@echo "  make dev      Start the Vite dev server"
	@echo "  make build    Production build (dist/)"
	@echo "  make test     Run the test suite"

up: ## Build and start the site via Docker
	docker compose up --build -d

down: ## Stop and remove the Docker container
	docker compose down

restart: ## Restart the running container
	docker compose restart

rebuild: ## Rebuild the image from scratch and restart
	docker compose up --build -d --force-recreate

logs: ## Follow container logs
	docker compose logs -f

ps: ## Show container status
	docker compose ps

install: ## Install npm dependencies (requires Node.js)
	npm install

dev: ## Start the Vite dev server (requires Node.js)
	npm run dev

build: ## Production build into dist/ (requires Node.js)
	npm run build

test: ## Run the test suite (requires Node.js)
	npm run test
