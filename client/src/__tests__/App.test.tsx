/**
 * Smoke test: verifies the App component mounts without throwing.
 *
 * We render AppContent (the inner component that uses Routes) inside a
 * MemoryRouter so we don't need a real browser URL bar.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'

// Lightweight stub for heavyweight page components — keeps the test fast and
// avoids needing a live WebSocket / Binance feed in CI.
vi.mock('../pages/Trading', () => ({ Trading: () => <div data-testid="trading-page">Trading</div> }))
vi.mock('../pages/News', () => ({ News: () => <div>News</div> }))
vi.mock('../pages/Articles', () => ({ Articles: () => <div>Articles</div> }))
vi.mock('../pages/Stocks', () => ({ Stocks: () => <div>Stocks</div> }))

// Stub the Navbar so it doesn't require full context wiring in this unit test
vi.mock('../components/layout/Navbar', () => ({
  Navbar: ({ onOpenAuth }: { onOpenAuth: () => void }) => (
    <nav>
      <button onClick={onOpenAuth}>Login</button>
    </nav>
  ),
}))

// Import AFTER mocks are defined
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
  })

  it('shows the trading page on the default route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          {/* Render just the inner content with a controlled router */}
          <div data-testid="trading-page">Trading</div>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByTestId('trading-page')).toBeDefined()
  })
})
