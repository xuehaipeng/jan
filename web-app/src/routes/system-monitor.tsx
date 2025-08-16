/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useHardware } from '@/hooks/useHardware'
import { Progress } from '@/components/ui/progress'
import { route } from '@/constants/routes'
import { formatMegaBytes } from '@/lib/utils'
import { IconDeviceDesktopAnalytics } from '@tabler/icons-react'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { toNumber } from '@/utils/number'
import { useLlamacppDevices } from '@/hooks/useLlamacppDevices'
import { getSystemUsage } from '@/services/hardware'

export const Route = createFileRoute(route.systemMonitor as any)({
  component: SystemMonitor,
})

function SystemMonitor() {
  const { t } = useTranslation()
  const { hardwareData, systemUsage, updateSystemUsage } = useHardware()

  const { devices: llamacppDevices, fetchDevices } = useLlamacppDevices()

  useEffect(() => {
    // Fetch llamacpp devices
    fetchDevices()
  }, [updateSystemUsage, fetchDevices])

  // Poll system usage every 5 seconds
  useEffect(() => {
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
  }, [updateSystemUsage])

  // Calculate RAM usage percentage
  const ramUsagePercentage =
    toNumber(systemUsage.used_memory / hardwareData.total_memory) * 100

  return (
    <div className="flex flex-col h-full bg-main-view overflow-y-auto p-6">
      <div className="flex items-center mb-4 gap-2">
        <IconDeviceDesktopAnalytics className="text-main-view-fg/80 size-6" />
        <h1 className="text-xl font-bold text-main-view-fg">
          {t('system-monitor:title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CPU Usage Card */}
        <div className="bg-main-view-fg/2 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-main-view-fg mb-4">
            {t('system-monitor:cpuUsage')}
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-main-view-fg/70">
                {t('system-monitor:model')}
              </span>
              <span className="text-main-view-fg">{hardwareData.cpu.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-main-view-fg/70">
                {t('system-monitor:cores')}
              </span>
              <span className="text-main-view-fg">
                {hardwareData.cpu.core_count}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-main-view-fg/70">
                {t('system-monitor:architecture')}
              </span>
              <span className="text-main-view-fg">{hardwareData.cpu.arch}</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-main-view-fg/70">
                  {t('system-monitor:currentUsage')}
                </span>
                <span className="text-main-view-fg font-bold">
                  {systemUsage.cpu.toFixed(2)}%
                </span>
              </div>
              <Progress value={systemUsage.cpu} className="h-3 w-full" />
            </div>
          </div>
        </div>

        {/* RAM Usage Card */}
        <div className="bg-main-view-fg/2 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-main-view-fg mb-4">
            {t('system-monitor:memoryUsage')}
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-main-view-fg/70">
                {t('system-monitor:totalRam')}
              </span>
              <span className="text-main-view-fg">
                {formatMegaBytes(hardwareData.total_memory)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-main-view-fg/70">
                {t('system-monitor:availableRam')}
              </span>
              <span className="text-main-view-fg">
                {formatMegaBytes(
                  hardwareData.total_memory - systemUsage.used_memory
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-main-view-fg/70">
                {t('system-monitor:usedRam')}
              </span>
              <span className="text-main-view-fg">
                {formatMegaBytes(systemUsage.used_memory)}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-main-view-fg/70">
                  {t('system-monitor:currentUsage')}
                </span>
                <span className="text-main-view-fg font-bold">
                  {ramUsagePercentage.toFixed(2)}%
                </span>
              </div>
              <Progress value={ramUsagePercentage} className="h-3 w-full" />
            </div>
          </div>
        </div>

        {/* GPU Usage Card */}
        {!IS_MACOS && (
          <div className="bg-main-view-fg/2 rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-semibold text-main-view-fg mb-4">
              {t('system-monitor:activeGpus')}
            </h2>
            <div className="flex flex-col gap-2">
              {llamacppDevices.length > 0 ? (
                llamacppDevices.map((device) => (
                  <div key={device.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-main-view-fg/70">
                        {device.name}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded-md ${
                          device.activated
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'hidden'
                        }`}
                      >
                        {device.activated
                          ? t('system-monitor:active')
                          : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-main-view-fg/70">VRAM:</span>
                      <span className="text-main-view-fg">
                        {formatMegaBytes(device.mem)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-main-view-fg/70">Free:</span>
                      <span className="text-main-view-fg">
                        {formatMegaBytes(device.free)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-main-view-fg/70 text-center py-4">
                  {t('system-monitor:noGpus')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
