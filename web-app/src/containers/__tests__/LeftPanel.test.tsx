import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeftPanel from '../LeftPanel'
import { useLeftPanel } from '@/hooks/useLeftPanel'

// Mock global constants
Object.defineProperty(global, 'IS_WINDOWS', { value: false, writable: true })
Object.defineProperty(global, 'IS_LINUX', { value: false, writable: true })
Object.defineProperty(global, 'IS_TAURI', { value: false, writable: true })
Object.defineProperty(global, 'IS_MACOS', { value: false, writable: true })

// Mock all dependencies
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className} data-testid={`link-${to}`}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouterState: vi.fn((options) => {
    if (options && options.select) {
      return options.select({ location: { pathname: '/' } })
    }
    return { location: { pathname: '/' } }
  }),
}))

vi.mock('@/hooks/useLeftPanel', () => ({
  useLeftPanel: vi.fn(() => ({
    open: true,
    setLeftPanel: vi.fn(),
    toggle: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('@/hooks/useThreads', () => ({
  useThreads: vi.fn(() => ({
    threads: [],
    searchTerm: '',
    setSearchTerm: vi.fn(),
    deleteThread: vi.fn(),
    deleteAllThreads: vi.fn(),
    unstarAllThreads: vi.fn(),
    clearThreads: vi.fn(),
    getFilteredThreads: vi.fn(() => []),
    filteredThreads: [],
    currentThreadId: null,
  })),
}))

vi.mock('@/hooks/useMediaQuery', () => ({
  useSmallScreen: vi.fn(() => false),
}))

vi.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: () => null,
}))

vi.mock('./ThreadList', () => ({
  default: () => <div data-testid="thread-list">ThreadList</div>,
}))

vi.mock('@/containers/DownloadManegement', () => ({
  DownloadManagement: () => <div data-testid="download-management">DownloadManagement</div>,
}))

vi.mock('@/i18n/react-i18next-compat', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/hooks/useEvent', () => ({
  useEvent: () => ({
    on: vi.fn(),
    off: vi.fn(),
  }),
}))

// Mock the store
vi.mock('@/store/useAppState', () => ({
  useAppState: () => ({
    setLeftPanel: vi.fn(),
  }),
}))

// Mock route constants
vi.mock('@/constants/routes', () => ({
  route: {
    home: '/',
    assistant: '/assistant',
    hub: {
      index: '/hub',
    },
    settings: {
      general: '/settings',
      index: '/settings',
    },
  },
}))

describe('LeftPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when panel is open', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: true,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })
    
    render(<LeftPanel />)
    
    // Check that the panel is rendered (it should contain some basic elements)
    expect(screen.getByPlaceholderText('common:search')).toBeDefined()
  })

  it('should hide panel when closed', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: false,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })

    render(<LeftPanel />)
    
    // When closed, panel should have hidden styling
    const panel = document.querySelector('aside')
    expect(panel).not.toBeNull()
    expect(panel?.className).toContain('visibility-hidden')
  })

  it('should render main menu items', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: true,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })
    
    render(<LeftPanel />)
    
    expect(screen.getByText('common:newChat')).toBeDefined()
    expect(screen.getByText('common:assistants')).toBeDefined()
    expect(screen.getByText('common:hub')).toBeDefined()
    expect(screen.getByText('common:settings')).toBeDefined()
  })

  it('should render search input', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: true,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })
    
    render(<LeftPanel />)
    
    const searchInput = screen.getByPlaceholderText('common:search')
    expect(searchInput).toBeDefined()
    expect(searchInput).toHaveAttribute('type', 'text')
  })

  it('should render download management component', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: true,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })
    
    render(<LeftPanel />)
    
    expect(screen.getByTestId('download-management')).toBeDefined()
  })

  it('should have proper structure when open', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: true,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })
    
    render(<LeftPanel />)
    
    // Check that basic structure exists
    const searchInput = screen.getByPlaceholderText('common:search')
    expect(searchInput).toBeDefined()
    
    const downloadComponent = screen.getByTestId('download-management')
    expect(downloadComponent).toBeDefined()
  })

  it('should render menu navigation links', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: true,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })
    
    render(<LeftPanel />)
    
    // Check for navigation elements  
    expect(screen.getByText('common:newChat')).toBeDefined()
    expect(screen.getByText('common:assistants')).toBeDefined()
    expect(screen.getByText('common:hub')).toBeDefined()
    expect(screen.getByText('common:settings')).toBeDefined()
  })

  it('should have sidebar toggle functionality', () => {
    vi.mocked(useLeftPanel).mockReturnValue({
      open: true,
      setLeftPanel: vi.fn(),
      toggle: vi.fn(),
      close: vi.fn(),
    })
    
    render(<LeftPanel />)
    
    // Check that the sidebar toggle icon is present by looking for the IconLayoutSidebar
    const toggleButton = document.querySelector('svg.tabler-icon-layout-sidebar')
    expect(toggleButton).not.toBeNull()
  })
})