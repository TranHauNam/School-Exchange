/**
 * Vitest setup — runs before each test file with jsdom environment.
 * - Extends expect with @testing-library/jest-dom matchers.
 * - jsdom provides `window` / `localStorage` natively (no shim needed).
 */
import '@testing-library/jest-dom/vitest';
