import { createFileRoute } from '@tanstack/react-router'
import { route } from '@/constants/routes'

import { useEffect, useState, useRef } from 'react'
import { parseLogLine, readLogs } from '@/services/app'
import { listen } from '@tauri-apps/api/event'
import { useTranslation } from '@/i18n/react-i18next-compat'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute(route.localApiServerlogs as any)({
  component: LogsViewer,
})

const SERVER_LOG_TARGET = 'app_lib::core::server'
const LOG_EVENT_NAME = 'log://log'

function LogsViewer() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    readLogs().then((logData) => {
      const logs = logData
        .filter((log) => log?.target === SERVER_LOG_TARGET)
        .filter(Boolean) as LogEntry[]
      setLogs(logs)

      // Scroll to bottom after initial logs are loaded
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    })
    let unsubscribe = () => {}
    listen(LOG_EVENT_NAME, (event) => {
      const { message } = event.payload as { message: string }
      const log: LogEntry | undefined = parseLogLine(message)
      if (log?.target === SERVER_LOG_TARGET) {
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, log]
          // Schedule scroll to bottom after state update
          setTimeout(() => {
            scrollToBottom()
          }, 0)
          return newLogs
        })
      }
    }).then((unsub) => {
      unsubscribe = unsub
    })
    return () => {
      unsubscribe()
    }
  }, [])

  // Function to scroll to the bottom of the logs container
  const scrollToBottom = () => {
    if (logsContainerRef.current) {
      const { scrollHeight, clientHeight } = logsContainerRef.current
      logsContainerRef.current.scrollTop = scrollHeight - clientHeight
    }
  }

  // Function to get appropriate color for log level
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500'
      case 'warn':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      case 'debug':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  // Format timestamp to be more readable
  const formatTimestamp = (timestamp: string | number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <div className="flex flex-col h-full bg-main-view">
      <div className="flex-1 overflow-auto" ref={logsContainerRef}>
        <div className="font-mono p-2">
          {logs.length === 0 ? (
            <div className="text-center text-main-view-fg/50 py-8">
              {t('logs:noLogs')}
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 flex">
                <span className="text-muted-foreground mr-2">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span
                  className={`mr-2 font-semibold ${getLogLevelColor(log.level)}`}
                >
                  {log.level.toUpperCase()}
                </span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
