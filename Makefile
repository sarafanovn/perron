.DEFAULT_GOAL := help

.PHONY: help up down restart rebuild logs ps print-url install dev build test

help: ## Show this help
	@echo "Docker (no local Node/npm required):"
	@echo "  make up       Build and start the site, then print its URL"
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
	@$(MAKE) --no-print-directory print-url

down: ## Stop and remove the Docker container
	docker compose down

restart: ## Restart the running container
	docker compose restart
	@$(MAKE) --no-print-directory print-url

rebuild: ## Rebuild the image from scratch and restart
	docker compose up --build -d --force-recreate
	@$(MAKE) --no-print-directory print-url

print-url:
	@port=$$(docker compose port web 80 2>/dev/null | sed 's/.*://'); \
	if [ -n "$$port" ]; then \
		echo "Perron is running at http://localhost:$$port"; \
	else \
		echo "Could not determine the port — check 'make ps' or 'make logs'."; \
	fi

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
