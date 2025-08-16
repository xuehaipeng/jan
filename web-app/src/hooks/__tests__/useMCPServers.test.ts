import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMCPServers } from '../useMCPServers'
import type { MCPServerConfig } from '../useMCPServers'

// Mock the MCP service functions
vi.mock('@/services/mcp', () => ({
  updateMCPConfig: vi.fn().mockResolvedValue(undefined),
  restartMCPServers: vi.fn().mockResolvedValue(undefined),
}))

describe('useMCPServers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state to defaults
    useMCPServers.setState({
      open: true,
      mcpServers: {},
      loading: false,
      deletedServerKeys: [],
    })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMCPServers())

    expect(result.current.open).toBe(true)
    expect(result.current.mcpServers).toEqual({})
    expect(result.current.loading).toBe(false)
    expect(result.current.deletedServerKeys).toEqual([])
    expect(typeof result.current.getServerConfig).toBe('function')
    expect(typeof result.current.setLeftPanel).toBe('function')
    expect(typeof result.current.addServer).toBe('function')
    expect(typeof result.current.editServer).toBe('function')
    expect(typeof result.current.deleteServer).toBe('function')
    expect(typeof result.current.setServers).toBe('function')
    expect(typeof result.current.syncServers).toBe('function')
    expect(typeof result.current.syncServersAndRestart).toBe('function')
  })

  describe('setLeftPanel', () => {
    it('should set left panel open state', () => {
      const { result } = renderHook(() => useMCPServers())

      act(() => {
        result.current.setLeftPanel(false)
      })

      expect(result.current.open).toBe(false)

      act(() => {
        result.current.setLeftPanel(true)
      })

      expect(result.current.open).toBe(true)
    })
  })

  describe('getServerConfig', () => {
    it('should return server config if exists', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const serverConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: { NODE_ENV: 'production' },
        active: true,
      }

      act(() => {
        result.current.addServer('test-server', serverConfig)
      })

      const config = result.current.getServerConfig('test-server')
      expect(config).toEqual(serverConfig)
    })

    it('should return undefined if server does not exist', () => {
      const { result } = renderHook(() => useMCPServers())

      const config = result.current.getServerConfig('nonexistent-server')
      expect(config).toBeUndefined()
    })
  })

  describe('addServer', () => {
    it('should add a new server', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const serverConfig: MCPServerConfig = {
        command: 'python',
        args: ['main.py', '--port', '8080'],
        env: { PYTHONPATH: '/app' },
        active: true,
      }

      act(() => {
        result.current.addServer('python-server', serverConfig)
      })

      expect(result.current.mcpServers).toEqual({
        'python-server': serverConfig,
      })
    })

    it('should update existing server with same key', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const initialConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: {},
        active: false,
      }

      const updatedConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js', '--production'],
        env: { NODE_ENV: 'production' },
        active: true,
      }

      act(() => {
        result.current.addServer('node-server', initialConfig)
      })

      expect(result.current.mcpServers['node-server']).toEqual(initialConfig)

      act(() => {
        result.current.addServer('node-server', updatedConfig)
      })

      expect(result.current.mcpServers['node-server']).toEqual(updatedConfig)
    })

    it('should add multiple servers', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const serverA: MCPServerConfig = {
        command: 'node',
        args: ['serverA.js'],
        env: {},
      }

      const serverB: MCPServerConfig = {
        command: 'python',
        args: ['serverB.py'],
        env: { PYTHONPATH: '/app' },
      }

      act(() => {
        result.current.addServer('server-a', serverA)
        result.current.addServer('server-b', serverB)
      })

      expect(result.current.mcpServers).toEqual({
        'server-a': serverA,
        'server-b': serverB,
      })
    })
  })

  describe('editServer', () => {
    it('should edit existing server', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const initialConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: {},
        active: false,
      }

      const updatedConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js', '--debug'],
        env: { DEBUG: 'true' },
        active: true,
      }

      act(() => {
        result.current.addServer('test-server', initialConfig)
      })

      act(() => {
        result.current.editServer('test-server', updatedConfig)
      })

      expect(result.current.mcpServers['test-server']).toEqual(updatedConfig)
    })

    it('should not modify state if server does not exist', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const initialState = result.current.mcpServers

      const config: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: {},
      }

      act(() => {
        result.current.editServer('nonexistent-server', config)
      })

      expect(result.current.mcpServers).toEqual(initialState)
    })
  })

  describe('setServers', () => {
    it('should merge servers with existing ones', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const existingServer: MCPServerConfig = {
        command: 'node',
        args: ['existing.js'],
        env: {},
      }

      const newServers = {
        'new-server-1': {
          command: 'python',
          args: ['new1.py'],
          env: { PYTHONPATH: '/app1' },
        },
        'new-server-2': {
          command: 'python',
          args: ['new2.py'],
          env: { PYTHONPATH: '/app2' },
        },
      }

      act(() => {
        result.current.addServer('existing-server', existingServer)
      })

      act(() => {
        result.current.setServers(newServers)
      })

      expect(result.current.mcpServers).toEqual({
        'existing-server': existingServer,
        ...newServers,
      })
    })

    it('should overwrite existing servers with same keys', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const originalServer: MCPServerConfig = {
        command: 'node',
        args: ['original.js'],
        env: {},
      }

      const updatedServer: MCPServerConfig = {
        command: 'node',
        args: ['updated.js'],
        env: { NODE_ENV: 'production' },
      }

      act(() => {
        result.current.addServer('test-server', originalServer)
      })

      act(() => {
        result.current.setServers({ 'test-server': updatedServer })
      })

      expect(result.current.mcpServers['test-server']).toEqual(updatedServer)
    })
  })

  describe('deleteServer', () => {
    it('should delete existing server', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const serverConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: {},
      }

      act(() => {
        result.current.addServer('test-server', serverConfig)
      })

      expect(result.current.mcpServers['test-server']).toEqual(serverConfig)

      act(() => {
        result.current.deleteServer('test-server')
      })

      expect(result.current.mcpServers['test-server']).toBeUndefined()
      expect(result.current.deletedServerKeys).toContain('test-server')
    })

    it('should add server key to deletedServerKeys even if server does not exist', () => {
      const { result } = renderHook(() => useMCPServers())

      act(() => {
        result.current.deleteServer('nonexistent-server')
      })

      expect(result.current.deletedServerKeys).toContain('nonexistent-server')
    })

    it('should handle multiple deletions', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const serverA: MCPServerConfig = {
        command: 'node',
        args: ['serverA.js'],
        env: {},
      }

      const serverB: MCPServerConfig = {
        command: 'python',
        args: ['serverB.py'],
        env: {},
      }

      act(() => {
        result.current.addServer('server-a', serverA)
        result.current.addServer('server-b', serverB)
      })

      act(() => {
        result.current.deleteServer('server-a')
        result.current.deleteServer('server-b')
      })

      expect(result.current.mcpServers).toEqual({})
      expect(result.current.deletedServerKeys).toEqual(['server-a', 'server-b'])
    })
  })

  describe('syncServers', () => {
    it('should call updateMCPConfig with current servers', async () => {
      const { updateMCPConfig } = await import('@/services/mcp')
      const { result } = renderHook(() => useMCPServers())
      
      const serverConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: { NODE_ENV: 'production' },
      }

      act(() => {
        result.current.addServer('test-server', serverConfig)
      })

      await act(async () => {
        await result.current.syncServers()
      })

      expect(updateMCPConfig).toHaveBeenCalledWith(
        JSON.stringify({
          mcpServers: {
            'test-server': serverConfig,
          },
        })
      )
    })

    it('should call updateMCPConfig with empty servers object', async () => {
      const { updateMCPConfig } = await import('@/services/mcp')
      const { result } = renderHook(() => useMCPServers())

      await act(async () => {
        await result.current.syncServers()
      })

      expect(updateMCPConfig).toHaveBeenCalledWith(
        JSON.stringify({
          mcpServers: {},
        })
      )
    })
  })

  describe('syncServersAndRestart', () => {
    it('should call updateMCPConfig and then restartMCPServers', async () => {
      const { updateMCPConfig, restartMCPServers } = await import('@/services/mcp')
      const { result } = renderHook(() => useMCPServers())
      
      const serverConfig: MCPServerConfig = {
        command: 'python',
        args: ['server.py'],
        env: { PYTHONPATH: '/app' },
      }

      act(() => {
        result.current.addServer('python-server', serverConfig)
      })

      await act(async () => {
        await result.current.syncServersAndRestart()
      })

      expect(updateMCPConfig).toHaveBeenCalledWith(
        JSON.stringify({
          mcpServers: {
            'python-server': serverConfig,
          },
        })
      )
      expect(restartMCPServers).toHaveBeenCalled()
    })
  })

  describe('state management', () => {
    it('should maintain state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useMCPServers())
      const { result: result2 } = renderHook(() => useMCPServers())

      const serverConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: {},
      }

      act(() => {
        result1.current.addServer('shared-server', serverConfig)
      })

      expect(result2.current.mcpServers['shared-server']).toEqual(serverConfig)
    })
  })

  describe('complex scenarios', () => {
    it('should handle complete server lifecycle', () => {
      const { result } = renderHook(() => useMCPServers())
      
      const initialConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js'],
        env: {},
        active: false,
      }

      const updatedConfig: MCPServerConfig = {
        command: 'node',
        args: ['server.js', '--production'],
        env: { NODE_ENV: 'production' },
        active: true,
      }

      // Add server
      act(() => {
        result.current.addServer('lifecycle-server', initialConfig)
      })

      expect(result.current.mcpServers['lifecycle-server']).toEqual(initialConfig)

      // Edit server
      act(() => {
        result.current.editServer('lifecycle-server', updatedConfig)
      })

      expect(result.current.mcpServers['lifecycle-server']).toEqual(updatedConfig)

      // Delete server
      act(() => {
        result.current.deleteServer('lifecycle-server')
      })

      expect(result.current.mcpServers['lifecycle-server']).toBeUndefined()
      expect(result.current.deletedServerKeys).toContain('lifecycle-server')
    })
  })
})