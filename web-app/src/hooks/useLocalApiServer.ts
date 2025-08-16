import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { localStorageKey } from '@/constants/localStorage'

type LocalApiServerState = {
  // Run local API server once app opens
  runOnStartup: boolean
  setRunOnStartup: (value: boolean) => void
  // Server host option (127.0.0.1 or 0.0.0.0)
  serverHost: '127.0.0.1' | '0.0.0.0'
  setServerHost: (value: '127.0.0.1' | '0.0.0.0') => void
  // Server port (default 1337)
  serverPort: number
  setServerPort: (value: number) => void
  // API prefix (default /v1)
  apiPrefix: string
  setApiPrefix: (value: string) => void
  // CORS enabled
  corsEnabled: boolean
  setCorsEnabled: (value: boolean) => void
  // Verbose server logs
  verboseLogs: boolean
  setVerboseLogs: (value: boolean) => void
  apiKey: string
  setApiKey: (value: string) => void
  // Trusted hosts
  trustedHosts: string[]
  addTrustedHost: (host: string) => void
  removeTrustedHost: (host: string) => void
  setTrustedHosts: (hosts: string[]) => void
}

export const useLocalApiServer = create<LocalApiServerState>()(
  persist(
    (set) => ({
      runOnStartup: true,
      setRunOnStartup: (value) => set({ runOnStartup: value }),
      serverHost: '127.0.0.1',
      setServerHost: (value) => set({ serverHost: value }),
      serverPort: 1337,
      setServerPort: (value) => set({ serverPort: value }),
      apiPrefix: '/v1',
      setApiPrefix: (value) => set({ apiPrefix: value }),
      corsEnabled: true,
      setCorsEnabled: (value) => set({ corsEnabled: value }),
      verboseLogs: true,
      setVerboseLogs: (value) => set({ verboseLogs: value }),
      trustedHosts: [],
      addTrustedHost: (host) =>
        set((state) => ({
          trustedHosts: [...state.trustedHosts, host],
        })),
      removeTrustedHost: (host) =>
        set((state) => ({
          trustedHosts: state.trustedHosts.filter((h) => h !== host),
        })),
      setTrustedHosts: (hosts) => set({ trustedHosts: hosts }),
      apiKey: '',
      setApiKey: (value) => set({ apiKey: value }),
    }),
    {
      name: localStorageKey.settingLocalApiServer,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
