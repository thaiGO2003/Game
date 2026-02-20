// Test setup file for vitest
// This file runs before all tests

// Mock Phaser if needed
global.Phaser = {
  Math: {
    Clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  },
};
