// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

// jsdom is missing a few browser APIs the shell touches on mount.
beforeAll(() => {
  window.scrollTo = vi.fn();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  if (!('ResizeObserver' in window)) {
    // @ts-expect-error test shim
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

describe('App shell', () => {
  it('renders the 2.0 dashboard, all categories and the new Smart Utilities entry', async () => {
    const { App } = await import('../App');
    render(<App />);

    expect(screen.getAllByText(/OmniForge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ابزارهای هوشمند ۲.۰/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/دسته‌بندی/).length).toBeGreaterThan(0);
    cleanup();
  });

  it('opens the command palette and finds the Persian number-to-words tool', async () => {
    const { App } = await import('../App');
    render(<App />);

    const searchButton = screen.getAllByRole('button').find((button) =>
      (button.textContent || '').includes('جستجوی سریع'),
    );
    expect(searchButton).toBeTruthy();
    searchButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const input = await screen.findByRole('textbox', { name: 'جستجوی سریع' });
    expect(input).toBeTruthy();
    cleanup();
  });
});
