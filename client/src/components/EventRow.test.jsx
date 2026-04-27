import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventRow from './EventRow';

describe('EventRow', () => {
  it('renders the title and the localized type label', () => {
    render(
      <EventRow
        event={{
          id: '1',
          type: 'vaccine',
          title: 'Vaccin rage',
          event_date: '2025-06-15T10:00:00Z',
        }}
      />
    );
    expect(screen.getByText('Vaccin rage')).toBeInTheDocument();
    expect(screen.getByText('Vaccin')).toBeInTheDocument();
  });

  it.each([
    ['walk', 'Balade'],
    ['meal', 'Repas'],
    ['vet', 'Vétérinaire'],
  ])('maps type "%s" to label "%s"', (type, label) => {
    render(
      <EventRow
        event={{
          id: '1',
          type,
          title: 'X',
          event_date: '2025-06-15T10:00:00Z',
        }}
      />
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <EventRow
        event={{
          id: '1',
          type: 'walk',
          title: 'Balade',
          event_date: '2025-06-15T10:00:00Z',
          description: 'Forêt de Saint-Germain',
        }}
      />
    );
    expect(screen.getByText('Forêt de Saint-Germain')).toBeInTheDocument();
  });

  it('omits the description when missing', () => {
    render(
      <EventRow
        event={{
          id: '1',
          type: 'walk',
          title: 'Balade',
          event_date: '2025-06-15T10:00:00Z',
        }}
      />
    );
    expect(screen.queryByText('Forêt de Saint-Germain')).not.toBeInTheDocument();
  });

  it('falls back to the raw type when type is unknown', () => {
    render(
      <EventRow
        event={{
          id: '1',
          type: 'mystery',
          title: 'X',
          event_date: '2025-06-15T10:00:00Z',
        }}
      />
    );
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });
});
