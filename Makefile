.DEFAULT_GOAL := help

.PHONY: help up down restart rebuild logs ps print-url install dev build extension sign test

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
	@echo "  make extension Build and package the Firefox extension"
	@echo "  make sign     Build and sign the extension for self-install (needs AMO API keys)"
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

extension: ## Build and package the Firefox extension into web-ext-artifacts/
	npm run build:extension
	npm run package:extension

# AMO API keys for `make sign`, kept out of git (see README).
-include .amo-keys
export WEB_EXT_API_KEY WEB_EXT_API_SECRET

sign: ## Build and sign the Firefox extension as an unlisted .xpi (needs AMO API keys)
	@if [ -z "$$WEB_EXT_API_KEY" ] || [ -z "$$WEB_EXT_API_SECRET" ]; then \
		echo "Missing AMO API keys. Create .amo-keys in the project root with:"; \
		echo "  WEB_EXT_API_KEY=<JWT issuer>"; \
		echo "  WEB_EXT_API_SECRET=<JWT secret>"; \
		echo "Get them at https://addons.mozilla.org/developers/addon/api/key/"; \
		exit 1; \
	fi
	npm run build:extension
	npm run sign:extension

test: ## Run the test suite (requires Node.js)
	npm run test
