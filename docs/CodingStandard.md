# USports Coding Standard
(this is a draft)

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
- Keep functions focused and reasonably small.

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

- Keep commits focused.
- Explain behavior changes in pull requests.
- Include tests for behavior changes.
- Do not commit `node_modules`, build output, local environment files, or logs.
