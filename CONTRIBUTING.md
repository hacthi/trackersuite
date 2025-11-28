# Contributing to Tracker Suite

Thank you for your interest in contributing to Tracker Suite! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check if the feature has been suggested
2. Create an issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes following our coding standards:
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update tests as needed

4. Run quality checks:
   ```bash
   npm run lint
   npm run format
   npm test run
   npm run check
   ```

5. Commit your changes:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a Pull Request with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots/videos if UI changes

## Development Setup

See [README.md](./README.md) for detailed setup instructions.

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Avoid `any` types when possible
- Define proper interfaces and types
- Use strict mode

### React
- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable
- Use proper prop types

### Styling
- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure responsive design
- Test in both light and dark modes

### Testing
- Write tests for new features
- Maintain or improve code coverage
- Test edge cases
- Use descriptive test names

## Project Structure

- `client/` - Frontend React application
- `server/` - Backend Express API
- `shared/` - Shared types and schemas
- `docs/` - Documentation

## Questions?

Feel free to ask questions by:
- Opening an issue
- Reaching out to maintainers
- Joining our community discussions

Thank you for contributing! 🎉
