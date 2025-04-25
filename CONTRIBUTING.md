# Contributing to Crossword AI

Thank you for considering contributing to Crossword AI! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
  - [Setting Up Your Environment](#setting-up-your-environment)
  - [Making Changes](#making-changes)
  - [Testing](#testing)
  - [Submitting a Pull Request](#submitting-a-pull-request)
- [Coding Standards](#coding-standards)
  - [Backend (Python)](#backend-python)
  - [Frontend (JavaScript/React)](#frontend-javascriptreact)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

Please note that this project follows a Code of Conduct. By participating in this project, you agree to abide by its terms.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Set up your development environment as described in [README.md](README.md)
4. Create a new branch for your changes: `git checkout -b your-feature-branch`

## Development Process

### Setting Up Your Environment

Follow the setup instructions in the README.md file to configure your local development environment.

### Making Changes

1. Ensure you're working on a new branch, not the main branch
2. Make your changes, focusing on a single feature or bug fix per branch
3. Add tests for new functionality
4. Update documentation as needed

### Testing

Before submitting your changes, ensure that:

1. All existing tests pass
2. You've added tests for new functionality
3. The application works as expected in local development

**Backend Testing:**
```bash
# Run backend tests
pytest
```

**Frontend Testing:**
```bash
# Navigate to client directory
cd crossword-client

# Run frontend tests
npm test
```

### Submitting a Pull Request

1. Push your changes to your fork on GitHub
2. Create a pull request from your branch to the main project
3. Provide a clear description of the changes and any related issue numbers
4. Wait for review and address any feedback

## Coding Standards

### Backend (Python)

- Follow PEP 8 style guide
- Use type hints where appropriate
- Include docstrings for all functions and classes
- Use meaningful variable and function names

### Frontend (JavaScript/React)

- Follow the Airbnb JavaScript Style Guide
- Use functional components with hooks over class components
- Use meaningful component and variable names
- Separate concerns between UI components and business logic

## Documentation

- Update the README.md if your changes affect setup or usage
- Update ARCHITECTURE.md if your changes affect the project structure
- Include JSDoc or docstrings for new functions and components

## Issue Reporting

When reporting issues, please include:

1. A clear description of the issue
2. Steps to reproduce the problem
3. Expected vs. actual behavior
4. Screenshots if applicable
5. Your environment information (browser, OS, etc.)

## Feature Requests

Feature requests are welcome! Please include:

1. A clear description of the proposed feature
2. The motivation for adding this feature
3. How it would benefit the project
4. Any implementation ideas you may have

Thank you for contributing to Crossword AI!