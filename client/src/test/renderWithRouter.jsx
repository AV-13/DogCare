import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

/**
 * Render a component wrapped in a MemoryRouter for tests that use
 * react-router-dom hooks or components like <Link>.
 *
 * @param {React.ReactElement} ui
 * @param {{ route?: string }} [options]
 */
export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
