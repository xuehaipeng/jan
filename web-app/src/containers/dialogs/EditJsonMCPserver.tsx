import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MCPServerConfig } from '@/hooks/useMCPServers'
import CodeEditor from '@uiw/react-textarea-code-editor'
import '@uiw/react-textarea-code-editor/dist.css'
import { useTranslation } from '@/i18n/react-i18next-compat'

interface EditJsonMCPserverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverName: string | null // null means editing all servers
  initialData: MCPServerConfig | Record<string, MCPServerConfig>
  onSave: (data: MCPServerConfig | Record<string, MCPServerConfig>) => void
}

export default function EditJsonMCPserver({
  open,
  onOpenChange,
  serverName,
  initialData,
  onSave,
}: EditJsonMCPserverProps) {
  const { t } = useTranslation()
  const [jsonContent, setJsonContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initialize the editor with the provided data
  useEffect(() => {
    if (open && initialData) {
      try {
        setJsonContent(JSON.stringify(initialData, null, 2))
        setError(null)
      } catch {
        setError(t('mcp-servers:editJson.errorParse'))
      }
    }
  }, [open, initialData, t])

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text')
    try {
      const parsedJson = JSON.parse(pastedText)
      const prettifiedJson = JSON.stringify(parsedJson, null, 2)
      e.preventDefault()
      setJsonContent(prettifiedJson)
      setError(null)
    } catch (error) {
      e.preventDefault()
      setError(t('mcp-servers:editJson.errorPaste'))
      console.error('Paste error:', error)
    }
  }

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(jsonContent)
      onSave(parsedData)
      onOpenChange(false)
      setError(null)
    } catch {
      setError(t('mcp-servers:editJson.errorFormat'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {serverName
              ? t('mcp-servers:editJson.title', { serverName })
              : t('mcp-servers:editJson.titleAll')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="border border-main-view-fg/10 rounded-md overflow-hidden">
            <CodeEditor
              value={jsonContent}
              language="json"
              placeholder={t('mcp-servers:editJson.placeholder')}
              onChange={(e) => setJsonContent(e.target.value)}
              onPaste={handlePaste}
              style={{
                fontFamily: 'ui-monospace',
                backgroundColor: 'transparent',
              }}
              className="w-full !text-sm "
            />
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
        </div>

        <DialogFooter>
          <Button onClick={handleSave}>{t('mcp-servers:editJson.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
