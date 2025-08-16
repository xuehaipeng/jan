import { HardwareData, SystemUsage } from '@/hooks/useHardware'
import { invoke } from '@tauri-apps/api/core'

// Device list interface for llamacpp extension
export interface DeviceList {
  id: string
  name: string
  mem: number
  free: number
  activated: boolean
}

/**
 * Get hardware information from the HardwareManagementExtension.
 * @returns {Promise<HardwareInfo>} A promise that resolves to the hardware information.
 */
export const getHardwareInfo = async () => {
  throw new Error('Hardware info unavailable on mobile remote-only build')
  return invoke('plugin:hardware|get_system_info') as Promise<HardwareData>
}

/**
 * Get hardware information from the HardwareManagementExtension.
 * @returns {Promise<HardwareInfo>} A promise that resolves to the hardware information.
 */
export const getSystemUsage = async () => {
  throw new Error('System usage unavailable on mobile remote-only build')
  return invoke('plugin:hardware|get_system_usage') as Promise<SystemUsage>
}

/**
 * Get devices from the llamacpp extension.
 * @returns {Promise<DeviceList[]>} A promise that resolves to the list of available devices.
 */
export const getLlamacppDevices = async (): Promise<DeviceList[]> => {
  throw new Error('llamacpp devices unsupported in remote-only build')
} //
  const extensionManager = window.core.extensionManager
  const llamacppExtension = extensionManager.getByName(
    '@janhq/llamacpp-extension'
  )

  if (!llamacppExtension) {
    throw new Error('llamacpp extension not found')
  }

  return llamacppExtension.getDevices()
}

/**
 * Set gpus activate
 * @returns A Promise that resolves set gpus activate.
 */
export const setActiveGpus = async (data: { gpus: number[] }) => {
  // no-op in remote-only build
} //
  // TODO: llama.cpp extension should handle this
  console.log(data)
}
