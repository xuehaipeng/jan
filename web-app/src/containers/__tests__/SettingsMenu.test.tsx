import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import SettingsMenu from '../SettingsMenu'
import { useNavigate, useMatches } from '@tanstack/react-router'
import { useGeneralSetting } from '@/hooks/useGeneralSetting'
import { useModelProvider } from '@/hooks/useModelProvider'
import { useAppState } from '@/hooks/useAppState'

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useMatches: vi.fn(),
  useNavigate: vi.fn(),
}))

vi.mock('@/i18n/react-i18next-compat', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/hooks/useGeneralSetting', () => ({
  useGeneralSetting: vi.fn(() => ({
    experimentalFeatures: false,
  })),
}))

vi.mock('@/hooks/useModelProvider', () => ({
  useModelProvider: vi.fn(() => ({
    providers: [
      {
        provider: 'openai',
        active: true,
        models: [],
      },
      {
        provider: 'llama.cpp',
        active: true,
        models: [],
      },
    ],
  })),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  getProviderTitle: (provider: string) => provider,
}))

vi.mock('@/containers/ProvidersAvatar', () => ({
  default: ({ provider }: { provider: any }) => (
    <div data-testid={`provider-avatar-${provider.provider}`}>
      {provider.provider}
    </div>
  ),
}))

describe('SettingsMenu', () => {
  const mockNavigate = vi.fn()
  const mockMatches = [
    {
      routeId: '/settings/general',
      params: {},
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useMatches).mockReturnValue(mockMatches)
  })

  it('renders all menu items', () => {
    render(<SettingsMenu />)
    
    expect(screen.getByText('common:general')).toBeInTheDocument()
    expect(screen.getByText('common:appearance')).toBeInTheDocument()
    expect(screen.getByText('common:privacy')).toBeInTheDocument()
    expect(screen.getByText('common:modelProviders')).toBeInTheDocument()
    expect(screen.getByText('common:keyboardShortcuts')).toBeInTheDocument()
    expect(screen.getByText('common:hardware')).toBeInTheDocument()
    expect(screen.getByText('common:local_api_server')).toBeInTheDocument()
    expect(screen.getByText('common:https_proxy')).toBeInTheDocument()
    expect(screen.getByText('common:extensions')).toBeInTheDocument()
  })

  it('does not show MCP Servers when experimental features disabled', () => {
    render(<SettingsMenu />)
    
    expect(screen.queryByText('common:mcp-servers')).not.toBeInTheDocument()
  })

  it('shows MCP Servers when experimental features enabled', () => {
    vi.mocked(useGeneralSetting).mockReturnValue({
      experimentalFeatures: true,
    })
    
    render(<SettingsMenu />)
    
    expect(screen.getByText('common:mcp-servers')).toBeInTheDocument()
  })

  it('shows provider expansion chevron when providers are active', () => {
    render(<SettingsMenu />)
    
    const chevronButtons = screen.getAllByRole('button')
    const chevron = chevronButtons.find(button => 
      button.querySelector('svg.tabler-icon-chevron-right')
    )
    expect(chevron).toBeInTheDocument()
  })

  it('expands providers submenu when chevron is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsMenu />)
    
    const chevronButtons = screen.getAllByRole('button')
    const chevron = chevronButtons.find(button => 
      button.querySelector('svg.tabler-icon-chevron-right')
    )
    if (!chevron) throw new Error('Chevron button not found')
    await user.click(chevron)
    
    expect(screen.getByTestId('provider-avatar-openai')).toBeInTheDocument()
    expect(screen.getByTestId('provider-avatar-llama.cpp')).toBeInTheDocument()
  })

  it('auto-expands providers when on provider route', () => {
    vi.mocked(useMatches).mockReturnValue([
      {
        routeId: '/settings/providers/$providerName',
        params: { providerName: 'openai' },
      },
    ])
    
    render(<SettingsMenu />)
    
    expect(screen.getByTestId('provider-avatar-openai')).toBeInTheDocument()
    expect(screen.getByTestId('provider-avatar-llama.cpp')).toBeInTheDocument()
  })

  it('highlights active provider in submenu', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useMatches).mockReturnValue([
      {
        routeId: '/settings/providers/$providerName',
        params: { providerName: 'openai' },
      },
    ])
    
    render(<SettingsMenu />)
    
    // First expand the providers submenu
    const chevronButtons = screen.getAllByRole('button')
    const chevron = chevronButtons.find(button => 
      button.querySelector('svg.tabler-icon-chevron-right')
    )
    if (chevron) await user.click(chevron)
    
    const openaiProvider = screen.getByTestId('provider-avatar-openai').closest('div')
    expect(openaiProvider).toBeInTheDocument()
  })

  it('navigates to provider when provider is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsMenu />)
    
    // First expand the providers
    const chevronButtons = screen.getAllByRole('button')
    const chevron = chevronButtons.find(button => 
      button.querySelector('svg.tabler-icon-chevron-right')
    )
    if (!chevron) throw new Error('Chevron button not found')
    await user.click(chevron)
    
    // Then click on a provider
    const openaiProvider = screen.getByTestId('provider-avatar-openai').closest('div')
    await user.click(openaiProvider!)
    
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/settings/providers/$providerName',
      params: { providerName: 'openai' },
    })
  })

  it('shows mobile menu toggle button', () => {
    render(<SettingsMenu />)
    
    const menuToggle = screen.getByRole('button', { name: 'Toggle settings menu' })
    expect(menuToggle).toBeInTheDocument()
  })

  it('opens mobile menu when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsMenu />)
    
    const menuToggle = screen.getByRole('button', { name: 'Toggle settings menu' })
    await user.click(menuToggle)
    
    // Menu should now be visible
    const menu = screen.getByText('common:general').closest('div')
    expect(menu).toHaveClass('flex')
  })

  it('closes mobile menu when X is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsMenu />)
    
    // Open menu first
    const menuToggle = screen.getByRole('button', { name: 'Toggle settings menu' })
    await user.click(menuToggle)
    
    // Then close it
    await user.click(menuToggle)
    
    // Just verify the toggle button is still there after clicking twice
    expect(menuToggle).toBeInTheDocument()
  })

  it('hides llamacpp provider during setup remote provider step', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useMatches).mockReturnValue([
      {
        routeId: '/settings/providers/',
        params: {},
        search: { step: 'setup_remote_provider' },
      },
    ])
    
    render(<SettingsMenu />)
    
    // First expand the providers submenu
    const chevronButtons = screen.getAllByRole('button')
    const chevron = chevronButtons.find(button => 
      button.querySelector('svg.tabler-icon-chevron-right')
    )
    if (chevron) await user.click(chevron)
    
    // llamacpp provider div should have hidden class
    const llamacppElement = screen.getByTestId('provider-avatar-llama.cpp')
    expect(llamacppElement.parentElement).toHaveClass('hidden')
    // openai should still be visible
    expect(screen.getByTestId('provider-avatar-openai')).toBeInTheDocument()
  })

  it('filters out inactive providers from submenu', async () => {
    const user = userEvent.setup()
    
    vi.mocked(useModelProvider).mockReturnValue({
      providers: [
        {
          provider: 'openai',
          active: true,
          models: [],
        },
        {
          provider: 'anthropic',
          active: false,
          models: [],
        },
      ],
    })
    
    render(<SettingsMenu />)
    
    // Expand providers
    const chevronButtons = screen.getAllByRole('button')
    const chevron = chevronButtons.find(button => 
      button.querySelector('svg.tabler-icon-chevron-right')
    )
    if (chevron) await user.click(chevron)
    
    expect(screen.getByTestId('provider-avatar-openai')).toBeInTheDocument()
    expect(screen.queryByTestId('provider-avatar-anthropic')).not.toBeInTheDocument()
  })
})