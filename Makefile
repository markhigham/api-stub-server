SHELL := /bin/bash
APPLICATION_NAME="api-stub-server"
APPLICATION_VERSION=1.0

# Colour coding for output
COLOUR_NONE=\033[0m
COLOUR_GREEN=\033[1;36m
COLOUR_YELLOW=\033[33;01m

.PHONY: help test
help:
	@echo -e "$(COLOUR_GREEN)|--- $(APPLICATION_NAME) [$(APPLICATION_VERSION)] ---|$(COLOUR_NONE)"
	@echo -e "$(COLOUR_YELLOW)make up$(COLOUR_NONE) : launches containers in the background"

.PHONY: up
up:
	@docker compose up

.PHONY: build
build:
	@docker build -t markhigham/api-stub-server:latest .
