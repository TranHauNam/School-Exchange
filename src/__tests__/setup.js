// Setup / teardown for API integration tests.
// Uses mongodb-memory-server for isolated database.
//
// Must be imported via jest.config.js setupFiles.
// In Jest 30, setupFiles run BEFORE the test environment, so beforeAll/afterAll
// are NOT available here. We use the globalSetup/globalTeardown pattern instead.
//
// This file is loaded as a setup file — we export nothing, just set globals
// that persist across the test run.

// Must be set BEFORE any backend code loads (JWT signing needs this)
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-12345";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { createApp } = require("./testApp");

// Store state in global to survive across test files
let mongoServer;

// eslint-disable-next-line no-empty-function
const noop = () => {};

// Expose setup/teardown as a module for manual use in test files
const setup = {
  _mongoServer: null,

  async connect() {
    if (global.__BASE__) return; // already set up
    this._mongoServer = await MongoMemoryServer.create();
    const uri = this._mongoServer.getUri();
    await mongoose.connect(uri);
    global.__APP__ = createApp();
    global.__SERVER__ = global.__APP__.listen(0);
    global.__BASE__ = `http://localhost:${global.__SERVER__.address().port}`;
  },

  async disconnect() {
    if (global.__SERVER__) {
      await new Promise((r) => global.__SERVER__.close(r));
      global.__SERVER__ = null;
    }
    await mongoose.disconnect();
    if (this._mongoServer) {
      await this._mongoServer.stop();
      this._mongoServer = null;
    }
    global.__BASE__ = null;
    global.__APP__ = null;
  },

  async clean() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  },
};

module.exports = setup;
