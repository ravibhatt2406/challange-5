// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/client/App';

/** Covers the routed shell and the most important wizard navigation behaviors. */
describe('application shell and event wizard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => [],
      }),
    );
  });

  it('renders the product landing page and clear planning entry points', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /eventcraft ai home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /your big moments deserve/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start planning/i })).toBeInTheDocument();
  });

  it('renders the event workspace from the dashboard route', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /your events/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new event/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/no events yet/i)).toBeInTheDocument());
  });

  it('validates the first required field before moving forward', () => {
    render(
      <MemoryRouter initialEntries={['/events/new?step=2']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText(/event name is required/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /set the essentials/i })).toBeInTheDocument();
  });

  it('preserves values when navigating backward through the wizard', () => {
    render(
      <MemoryRouter initialEntries={['/events/new?step=1']}>
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.change(screen.getByLabelText(/event name/i), { target: { value: 'Riya birthday' } });
    fireEvent.change(screen.getByLabelText(/event date/i), { target: { value: '2026-12-10' } });
    fireEvent.change(screen.getByLabelText(/expected guests/i), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('heading', { name: /what are you planning/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByDisplayValue('Riya birthday')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-12-10')).toBeInTheDocument();
  });
});
