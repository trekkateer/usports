# USports Coding Standard

## Languages and frameworks

- Use TypeScript for client and server code.
- Use Expo and React Native for the client.
- Use Express for the server API.
- Use Jest for automated tests.

## Formatting and naming

- Use two spaces for indentation.
- Use semicolons.
- Use double quotes.
- Use `PascalCase` for React components, classes, and types.
- Use `camelCase` for variables, functions, and object properties.
- Use descriptive names instead of abbreviations.
- Keep functions focused on one responsibility. Functions should be easy to read, test, and explain. Split complex logic into smaller helper functions when applicable.

## Automated enforcement

- Before submitting a pull request, run `npm run lint --prefix client`, `npm test`, and `npm run build:server` from the repository root.
- Resolve linting, testing, and server build failures before submitting the pull request.
- Do not disable or bypass a style rule without explaining the reason in the pull request.

## API conventions

- Use nouns for REST resource paths, such as `/api/events`.
- Use HTTP methods according to their standard meanings.
- Return JSON responses.
- Use appropriate HTTP status codes.
- Return errors with the shape `{ "error": "Description" }`.
- Validate request bodies before changing server state.

## Testing

- Add tests for every new endpoint.
- Test successful and unsuccessful requests.
- Test invalid input and missing resources.
- Reset mock data between tests.
- Tests must pass before a pull request is submitted.

## Mock data

- Keep mock data in the server data layer.
- Do not connect to a real database for the initial server milestone.
- Keep mock data deterministic so tests remain reliable.

## Security

- Never commit passwords, API keys, tokens, or other secrets.
- Do not log sensitive user information.
- Validate external input.
- Review dependency changes before applying automatic upgrades.

## Git and pull requests

- Keep commits focused on one logical change.
- Use the commit format `<type>(<scope>): <description>`. Example: `fix(server): reject invalid event dates`.
- Use an imperative, present-tense description.
- Recommended types include `feat`, `fix`, `docs`, `test`, `refactor`, and `chore`.
- Keep the commit subject at or below 72 characters.
- Explain behavior changes in pull requests.
- Do not commit `node_modules`, build output, local environment files, or logs.
- Do not open a pull request while required client lint, test, or server build checks are failing.
- Add or update tests whenever a behavior change requires test coverage.
- Pull requests must include a summary, related issue number when applicable, testing details, and any known limitations.
- Add appropriate labels and request review from relevant team members.
