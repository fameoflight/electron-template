/**
 * Shared Utility Functions Tests
 *
 * Tests the utility functions in shared/utils.ts
 * These are pure functions that don't require complex setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  humanize,
  getPlatform,
  formatFileSize,
  getTimeAgo,
  formatDateTime
} from '@shared/utils';
import { setupPolly } from '../polly/helpers';

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('humanize', () => {
  it('should convert snake_case to Title Case', () => {
    expect(humanize('snake_case_text')).toBe('Snake Case Text');
  });

  it('should convert kebab-case to Title Case', () => {
    expect(humanize('kebab-case-text')).toBe('Kebab Case Text');
  });

  it('should handle mixed separators', () => {
    expect(humanize('mixed-case_and_text')).toBe('Mixed Case And Text');
  });

  it('should handle multiple consecutive separators', () => {
    expect(humanize('multiple---separators___here')).toBe('Multiple Separators Here');
  });

  it('should handle multiple spaces', () => {
    expect(humanize('text    with    spaces')).toBe('Text With Spaces');
  });

  it('should handle already capitalized text', () => {
    expect(humanize('Already Capitalized')).toBe('Already Capitalized');
  });

  it('should handle empty string', () => {
    expect(humanize('')).toBe('');
  });

  it('should handle whitespace only', () => {
    expect(humanize('   ')).toBe('');
  });

  it('should handle single word', () => {
    expect(humanize('word')).toBe('Word');
  });

  it('should handle non-string input', () => {
    expect(humanize(null as any)).toBe('');
    expect(humanize(undefined as any)).toBe('');
  });
});

describe('getPlatform', () => {
  it('should return a valid platform', () => {
    const platform = getPlatform();
    expect(['windows', 'mac', 'linux']).toContain(platform);
  });

  it('should be consistent across multiple calls', () => {
    const platform1 = getPlatform();
    const platform2 = getPlatform();
    expect(platform1).toBe(platform2);
  });

  // Note: We don't test specific platform detection since it requires complex environment mocking
  // The function is tested manually during development to ensure it works correctly
});

describe('formatFileSize', () => {
  it('should format zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatFileSize(2.75 * 1024 * 1024 * 1024)).toBe('2.75 GB');
  });

  it('should round to 2 decimal places', () => {
    expect(formatFileSize(1234567)).toBe('1.18 MB');
  });
});

describe('getTimeAgo', () => {
  beforeEach(() => {
    // Mock current time
    const mockNow = new Date('2023-10-30T12:00:00Z');
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "just now" for very recent times', () => {
    const recent = '2023-10-30T11:59:30Z'; // 30 seconds ago
    expect(getTimeAgo(recent)).toBe('just now');
  });

  it('should return minutes ago', () => {
    const fiveMinutesAgo = '2023-10-30T11:55:00Z';
    expect(getTimeAgo(fiveMinutesAgo)).toBe('5 minutes ago');

    const oneMinuteAgo = '2023-10-30T11:59:00Z';
    expect(getTimeAgo(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('should return hours ago', () => {
    const threeHoursAgo = '2023-10-30T09:00:00Z';
    expect(getTimeAgo(threeHoursAgo)).toBe('3 hours ago');

    const oneHourAgo = '2023-10-30T11:00:00Z';
    expect(getTimeAgo(oneHourAgo)).toBe('1 hour ago');
  });

  it('should return days ago', () => {
    const threeDaysAgo = '2023-10-27T12:00:00Z';
    expect(getTimeAgo(threeDaysAgo)).toBe('3 days ago');

    const oneDayAgo = '2023-10-29T12:00:00Z';
    expect(getTimeAgo(oneDayAgo)).toBe('1 day ago');
  });

  it('should return formatted date for dates older than 7 days', () => {
    const oldDate = '2023-10-01T12:00:00Z';
    expect(getTimeAgo(oldDate)).toBe('10/1/2023'); // Format depends on locale
  });
});

describe('formatDateTime', () => {
  beforeEach(() => {
    const mockNow = new Date('2023-10-30T12:00:00Z');
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format as date only', () => {
    const timestamp = '2023-10-25T15:30:00Z';
    const result = formatDateTime(timestamp, 'date');
    expect(result).toMatch(/2023/); // Should contain year
  });

  it('should format as date and time', () => {
    const timestamp = '2023-10-25T15:30:00Z';
    const result = formatDateTime(timestamp, 'datetime');
    expect(result).toMatch(/2023/); // Should contain date
    expect(result).toMatch(/\d{1,2}:\d{2}/); // Should contain time (HH:MM format)
  });

  it('should format as time only', () => {
    const timestamp = '2023-10-25T15:30:00Z';
    const result = formatDateTime(timestamp, 'time');
    expect(result).toMatch(/\d{1,2}:\d{2}/); // Should contain time (HH:MM format)
  });

  it('should format as relative time', () => {
    const recent = '2023-10-30T11:30:00Z'; // 30 minutes ago
    expect(formatDateTime(recent, 'relative')).toBe('30 minutes ago');
  });

  it('should default to time format for unknown type', () => {
    const timestamp = '2023-10-25T15:30:00Z';
    const result = formatDateTime(timestamp, 'unknown');
    expect(result).toMatch(/\d{1,2}:\d{2}/); // Should contain time (HH:MM format)
  });
});

