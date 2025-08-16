import { createFileRoute } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import SettingsMenu from '@/containers/SettingsMenu'
import HeaderPage from '@/containers/HeaderPage'
import { Card, CardItem } from '@/containers/Card'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useHardware } from '@/hooks/useHardware'
import { useLlamacppDevices } from '@/hooks/useLlamacppDevices'
import { useEffect, useState } from 'react'
import { IconDeviceDesktopAnalytics } from '@tabler/icons-react'
import { getHardwareInfo, getSystemUsage } from '@/services/hardware'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { formatMegaBytes } from '@/lib/utils'
import { windowKey } from '@/constants/windows'
import { toNumber } from '@/utils/number'
import { useModelProvider } from '@/hooks/useModelProvider'
import { stopAllModels } from '@/services/models'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute(route.settings.hardware as any)({
  component: Hardware,
})

function Hardware() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const {
    hardwareData,
    systemUsage,
    setHardwareData,
    updateSystemUsage,
    pollingPaused,
  } = useHardware()

  const { providers } = useModelProvider()
  const llamacpp = providers.find((p) => p.provider === 'llamacpp')

  // Llamacpp devices hook
  const llamacppDevicesResult = useLlamacppDevices()

  // Use default values on macOS since llamacpp devices are not relevant
  const {
    devices: llamacppDevices,
    loading: llamacppDevicesLoading,
    error: llamacppDevicesError,
    toggleDevice,
    fetchDevices,
  } = IS_MACOS
    ? {
        devices: [],
        loading: false,
        error: null,
        toggleDevice: () => {},
        fetchDevices: () => {},
      }
    : llamacppDevicesResult

  // Fetch llamacpp devices when component mounts
  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  // Fetch initial hardware info and system usage
  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      getHardwareInfo()
        .then((data) => {
          setHardwareData(data)
        })
        .catch((error) => {
          console.error('Failed to get hardware info:', error)
        }),
      getSystemUsage()
        .then((data) => {
          updateSystemUsage(data)
        })
        .catch((error) => {
          console.error('Failed to get initial system usage:', error)
        }),
    ]).finally(() => {
      setIsLoading(false)
    })
  }, [setHardwareData, updateSystemUsage])



  useEffect(() => {
    if (pollingPaused) return
    const intervalId = setInterval(() => {
      getSystemUsage()
        .then((data) => {
          updateSystemUsage(data)
        })
        .catch((error) => {
          console.error('Failed to get system usage:', error)
        })
    }, 5000)

    return () => clearInterval(intervalId)
  }, [updateSystemUsage, pollingPaused])

  const handleClickSystemMonitor = async () => {
    try {
      // Check if system monitor window already exists
      const existingWindow = await WebviewWindow.getByLabel(
        windowKey.systemMonitorWindow
      )

      if (existingWindow) {
        // If window exists, focus it
        await existingWindow.setFocus()
        console.log('Focused existing system monitor window')
      } else {
        // Create a new system monitor window
        const monitorWindow = new WebviewWindow(windowKey.systemMonitorWindow, {
          url: route.systemMonitor,
          title: 'System Monitor - Jan',
          width: 900,
          height: 600,
          resizable: true,
          center: true,
        })

        // Listen for window creation
        monitorWindow.once('tauri://created', () => {
          console.log('System monitor window created')
        })

        // Listen for window errors
        monitorWindow.once('tauri://error', (e) => {
          console.error('Error creating system monitor window:', e)
        })
      }
    } catch (error) {
      console.error('Failed to open system monitor window:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <HeaderPage>
        <div className="flex items-center gap-2 justify-between w-full pr-3">
          <h1 className="font-medium">{t('common:settings')}</h1>
          <div
            className="flex items-center gap-1 hover:bg-main-view-fg/8 px-1.5 py-0.5 rounded relative z-10 cursor-pointer"
            onClick={handleClickSystemMonitor}
          >
            <IconDeviceDesktopAnalytics className="text-main-view-fg/50 size-5" />
            <p>{t('settings:hardware.systemMonitor')}</p>
          </div>
        </div>
      </HeaderPage>
      <div className="flex h-full w-full">
        <SettingsMenu />
        <div className="p-4 w-full h-[calc(100%-32px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-main-view-fg/50">
                Loading hardware information...
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between gap-4 gap-y-3 w-full">
              {/* OS Information */}
              <Card title={t('settings:hardware.os')}>
                <CardItem
                  title={t('settings:hardware.name')}
                  actions={
                    <span className="text-main-view-fg/80 capitalize">
                      {hardwareData.os_type}
                    </span>
                  }
                />
                <CardItem
                  title={t('settings:hardware.version')}
                  actions={
                    <span className="text-main-view-fg/80">
                      {hardwareData.os_name}
                    </span>
                  }
                />
              </Card>

              {/* CPU Information */}
              <Card title={t('settings:hardware.cpu')}>
                <CardItem
                  title={t('settings:hardware.model')}
                  actions={
                    <span className="text-main-view-fg/80">
                      {hardwareData.cpu?.name}
                    </span>
                  }
                />
                <CardItem
                  title={t('settings:hardware.architecture')}
                  actions={
                    <span className="text-main-view-fg/80">
                      {hardwareData.cpu?.arch}
                    </span>
                  }
                />
                <CardItem
                  title={t('settings:hardware.cores')}
                  actions={
                    <span className="text-main-view-fg/80">
                      {hardwareData.cpu?.core_count}
                    </span>
                  }
                />
                {hardwareData.cpu?.extensions?.join(', ').length > 0 && (
                  <CardItem
                    title={t('settings:hardware.instructions')}
                    column={hardwareData.cpu?.extensions.length > 6}
                    actions={
                      <span className="text-main-view-fg/80 break-words">
                        {hardwareData.cpu?.extensions?.join(', ')}
                      </span>
                    }
                  />
                )}
                <CardItem
                  title={t('settings:hardware.usage')}
                  actions={
                    <div className="flex items-center gap-2">
                      {systemUsage.cpu > 0 && (
                        <>
                          <Progress
                            value={systemUsage.cpu}
                            className="h-2 w-10"
                          />
                          <span className="text-main-view-fg/80">
                            {systemUsage.cpu?.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  }
                />
              </Card>

              {/* RAM Information */}
              <Card title={t('settings:hardware.memory')}>
                <CardItem
                  title={t('settings:hardware.totalRam')}
                  actions={
                    <span className="text-main-view-fg/80">
                      {formatMegaBytes(hardwareData.total_memory)}
                    </span>
                  }
                />
                <CardItem
                  title={t('settings:hardware.availableRam')}
                  actions={
                    <span className="text-main-view-fg/80">
                      {formatMegaBytes(
                        hardwareData.total_memory - systemUsage.used_memory
                      )}
                    </span>
                  }
                />
                <CardItem
                  title={t('settings:hardware.usage')}
                  actions={
                    <div className="flex items-center gap-2">
                      {hardwareData.total_memory > 0 && (
                        <>
                          <Progress
                            value={
                              toNumber(
                                systemUsage.used_memory /
                                  hardwareData.total_memory
                              ) * 100
                            }
                            className="h-2 w-10"
                          />
                          <span className="text-main-view-fg/80">
                            {(
                              toNumber(
                                systemUsage.used_memory /
                                  hardwareData.total_memory
                              ) * 100
                            ).toFixed(2)}
                            %
                          </span>
                        </>
                      )}
                    </div>
                  }
                />
              </Card>

              {/* Llamacpp Devices Information */}
              {!IS_MACOS && llamacpp && (
                <Card title="GPUs">
                  {llamacppDevicesLoading ? (
                    <CardItem title="Loading devices..." actions={<></>} />
                  ) : llamacppDevicesError ? (
                    <CardItem
                      title="Error loading devices"
                      actions={
                        <span className="text-destructive text-sm">
                          {llamacppDevicesError}
                        </span>
                      }
                    />
                  ) : llamacppDevices.length > 0 ? (
                    llamacppDevices.map((device, index) => (
                      <Card key={index}>
                        <CardItem
                          title={device.name}
                          actions={
                            <div className="flex items-center gap-4">
                              {/* <div className="flex flex-col items-end gap-1">
                            <span className="text-main-view-fg/80 text-sm">
                              ID: {device.id}
                            </span>
                            <span className="text-main-view-fg/80 text-sm">
                              Memory: {formatMegaBytes(device.mem)} /{' '}
                              {formatMegaBytes(device.free)} free
                            </span>
                          </div> */}
                              <Switch
                                checked={device.activated}
                                onCheckedChange={() => {
                                  toggleDevice(device.id)
                                  stopAllModels()
                                }}
                              />
                            </div>
                          }
                        />
                        <div className="mt-3">
                          <CardItem
                            title={t('settings:hardware.vram')}
                            actions={
                              <span className="text-main-view-fg/80">
                                {formatMegaBytes(device.free)}{' '}
                                {t('settings:hardware.freeOf')}{' '}
                                {formatMegaBytes(device.mem)}
                              </span>
                            }
                          />
                        </div>
                      </Card>
                    ))
                  ) : (
                    <CardItem title="No devices found" actions={<></>} />
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
