import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import DogCard from './DogCard';
import { renderWithRouter } from '../test/renderWithRouter';

describe('DogCard', () => {
  it('renders the dog name and breed', () => {
    renderWithRouter(
      <DogCard dog={{ id: '1', name: 'Rex', breed: 'Husky', upcoming_events_count: 0 }} />
    );
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('Husky')).toBeInTheDocument();
  });

  it('shows the dog initial as monogram when no photo_url is provided', () => {
    renderWithRouter(
      <DogCard dog={{ id: '1', name: 'Rex', upcoming_events_count: 0 }} />
    );
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('renders an <img> when photo_url is set', () => {
    renderWithRouter(
      <DogCard
        dog={{ id: '1', name: 'Rex', photo_url: '/uploads/dogs/x.jpg', upcoming_events_count: 0 }}
      />
    );
    const img = screen.getByRole('img', { name: 'Rex' });
    expect(img).toHaveAttribute('src', '/uploads/dogs/x.jpg');
  });

  it('shows the upcoming events count when > 0', () => {
    renderWithRouter(
      <DogCard dog={{ id: '1', name: 'Rex', upcoming_events_count: 3 }} />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('à venir')).toBeInTheDocument();
  });

  it('does not render the count when it is 0', () => {
    renderWithRouter(
      <DogCard dog={{ id: '1', name: 'Rex', upcoming_events_count: 0 }} />
    );
    expect(screen.queryByText('à venir')).not.toBeInTheDocument();
  });

  it('links to the dog detail page', () => {
    renderWithRouter(
      <DogCard dog={{ id: 'abc-123', name: 'Rex', upcoming_events_count: 0 }} />
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dogs/abc-123');
  });
});
