// Jest setup file for integration tests.
//
// Jest 30's `setupFiles` does NOT have access to `beforeAll`/`afterAll`,
// so we export helper functions that each test file must call explicitly
// in its own top-level `beforeAll`/`afterAll`/`afterEach`.
//
// Usage in each test file:
//   const setup = require("./setup");
//   beforeAll(() => setup.connect(), 30000);
//   afterAll(() => setup.disconnect(), 15000);
//   afterEach(() => setup.clean());

const setup = require("./setup");

// Export the setup instance so test files can use it.
// Each test file should call these in their global hook blocks.
module.exports = {
  connect: () => setup.connect(),
  disconnect: () => setup.disconnect(),
  clean: () => setup.clean(),
};
