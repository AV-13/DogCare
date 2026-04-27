import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import VaccineAlertBanner from './VaccineAlertBanner';
import * as dogService from '../services/dogService';

describe('VaccineAlertBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when there are no reminders', async () => {
    vi.spyOn(dogService, 'getUpcomingVaccines').mockResolvedValue({ data: [] });
    const { container } = renderWithRouter(<VaccineAlertBanner />);
    await waitFor(() => {
      expect(dogService.getUpcomingVaccines).toHaveBeenCalled();
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders an "overdue" alert with negative days_remaining', async () => {
    vi.spyOn(dogService, 'getUpcomingVaccines').mockResolvedValue({
      data: [
        {
          dog_name: 'Rex',
          dog_id: 'd1',
          event_id: 'e1',
          title: 'Vaccin rage',
          next_due_date: '2025-01-01',
          days_remaining: -3,
          status: 'overdue',
        },
      ],
    });

    renderWithRouter(<VaccineAlertBanner />);
    expect(await screen.findByText('Vaccins en retard :')).toBeInTheDocument();
    expect(screen.getByText(/Rex — Vaccin rage \(retard de 3 jours\)/)).toBeInTheDocument();
  });

  it('renders an "upcoming" alert with positive days_remaining', async () => {
    vi.spyOn(dogService, 'getUpcomingVaccines').mockResolvedValue({
      data: [
        {
          dog_name: 'Bella',
          dog_id: 'd2',
          event_id: 'e2',
          title: 'Vaccin lepto',
          next_due_date: '2026-05-15',
          days_remaining: 5,
          status: 'upcoming',
        },
      ],
    });

    renderWithRouter(<VaccineAlertBanner />);
    expect(await screen.findByText('Vaccins à venir :')).toBeInTheDocument();
    expect(screen.getByText(/Bella — Vaccin lepto \(dans 5 jours\)/)).toBeInTheDocument();
  });

  it('renders both sections when both kinds are present', async () => {
    vi.spyOn(dogService, 'getUpcomingVaccines').mockResolvedValue({
      data: [
        {
          dog_name: 'Rex',
          dog_id: 'd1',
          event_id: 'e1',
          title: 'A',
          days_remaining: -1,
          status: 'overdue',
        },
        {
          dog_name: 'Bella',
          dog_id: 'd2',
          event_id: 'e2',
          title: 'B',
          days_remaining: 1,
          status: 'upcoming',
        },
      ],
    });

    renderWithRouter(<VaccineAlertBanner />);
    expect(await screen.findByText('Vaccins en retard :')).toBeInTheDocument();
    expect(screen.getByText('Vaccins à venir :')).toBeInTheDocument();
  });

  it('renders nothing when the API call fails', async () => {
    vi.spyOn(dogService, 'getUpcomingVaccines').mockRejectedValue(new Error('boom'));
    const { container } = renderWithRouter(<VaccineAlertBanner />);
    await waitFor(() => {
      expect(dogService.getUpcomingVaccines).toHaveBeenCalled();
    });
    expect(container.firstChild).toBeNull();
  });
});
