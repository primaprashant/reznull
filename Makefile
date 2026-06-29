.PHONY: help install dev format lint check clean

help:
	@echo "Common commands:"
	@echo "  make install  Sync the UV environment"
	@echo "  make dev      Run the Flask development server"
	@echo "  make format   Format Python files with Ruff"
	@echo "  make lint     Lint Python files with Ruff"
	@echo "  make check    Run formatting check and lint"
	@echo "  make clean    Remove local Python caches"

install:
	uv sync

dev:
	uv run flask --app app run --host 127.0.0.1 --port 5000 --debug

format:
	uv run ruff format .

lint:
	uv run ruff check .

check:
	uv run ruff format --check .
	uv run ruff check .

clean:
	rm -rf __pycache__ .ruff_cache
