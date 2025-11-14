/**
 * Polly.js verification test
 *
 * Simple test to verify Polly.js setup works correctly
 */

import { describe, it, expect } from 'vitest';
import { setupPolly } from './helpers';

describe('Polly.js Setup', () => {
  const pollyContext = setupPolly({
    recordingName: 'polly-verification',
  });

  it('should create Polly instance', () => {
    expect(pollyContext.polly).toBeDefined();
    expect(pollyContext.polly?.recordingName).toBe('polly-verification');
  });

  it('should record and replay fetch requests', async () => {
    // Make a simple fetch request
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data.id).toBe(1);
  });

  it('should replay the same request', async () => {
    // This should be replayed from the recording
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(1);
  });
});
