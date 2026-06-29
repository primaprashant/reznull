.PHONY: help install dev format lint check clean

help:
	@echo "Common commands:"
	@echo "  make install  Install Node dependencies"
	@echo "  make dev      Run the UserGhost Arena server"
	@echo "  make format   No formatter configured"
	@echo "  make lint     Run JavaScript syntax checks"
	@echo "  make check    Run JavaScript syntax checks"
	@echo "  make clean    Remove local caches and logs"

install:
	npm install
	npx playwright install chromium

dev:
	npm run dev

format:
	@echo "No formatter configured for this no-build Node demo."

lint:
	npm run check

check:
	npm run check

clean:
	rm -rf __pycache__ .ruff_cache node_modules *.log
