import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/tests/test-utils';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('shows validation errors for an empty submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactForm />);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('accepts a valid submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactForm />);

    await user.type(screen.getByLabelText('Name'), 'Mia Frei');
    await user.type(screen.getByLabelText('Email'), 'mia.frei@example.ch');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    // On success the form resets; no validation errors remain.
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
  });
});
