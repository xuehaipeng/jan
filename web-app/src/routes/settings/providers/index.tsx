import { createFileRoute } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import SettingsMenu from '@/containers/SettingsMenu'
import HeaderPage from '@/containers/HeaderPage'
import { Button } from '@/components/ui/button'
import { Card, CardItem } from '@/containers/Card'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useModelProvider } from '@/hooks/useModelProvider'
import { useNavigate } from '@tanstack/react-router'
import { IconCirclePlus, IconSettings } from '@tabler/icons-react'
import { getProviderTitle } from '@/lib/utils'
import ProvidersAvatar from '@/containers/ProvidersAvatar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useCallback, useState } from 'react'
import { openAIProviderSettings } from '@/consts/providers'
import cloneDeep from 'lodash/cloneDeep'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute(route.settings.model_providers as any)({
  component: ModelProviders,
})

function ModelProviders() {
  const { t } = useTranslation()
  const { providers, addProvider, updateProvider } = useModelProvider()
  const navigate = useNavigate()
  const [name, setName] = useState('')

  const createProvider = useCallback(() => {
    if (
      providers.some((e) => e.provider.toLowerCase() === name.toLowerCase())
    ) {
      toast.error(t('providerAlreadyExists', { name }))
      return
    }
    const newProvider = {
      provider: name,
      active: true,
      models: [],
      settings: cloneDeep(openAIProviderSettings) as ProviderSetting[],
      api_key: '',
      base_url: 'https://api.openai.com/v1',
    }
    addProvider(newProvider)
    setTimeout(() => {
      navigate({
        to: route.settings.providers,
        params: {
          providerName: name,
        },
      })
    }, 0)
  }, [providers, name, addProvider, t, navigate])

  return (
    <div className="flex flex-col h-full">
      <HeaderPage>
        <h1 className="font-medium">{t('common:settings')}</h1>
      </HeaderPage>
      <div className="flex h-full w-full flex-col sm:flex-row">
        <SettingsMenu />
        <div className="p-4 w-full h-[calc(100%-32px)] overflow-y-auto">
          <div className="flex flex-col justify-between gap-4 gap-y-3 w-full">
            {/* Model Providers */}
            <Card
              header={
                <div className="flex items-center justify-between w-full mb-6">
                  <span className="text-main-view-fg font-medium text-base">
                    {t('common:modelProviders')}
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <div className="cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/15 bg-main-view-fg/10 transition-all duration-200 ease-in-out p-1.5 py-1 gap-1 -mr-2">
                          <IconCirclePlus size={16} />
                          <span>{t('provider:addProvider')}</span>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t('provider:addOpenAIProvider')}
                        </DialogTitle>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-2"
                          placeholder={t('provider:enterNameForProvider')}
                          onKeyDown={(e) => {
                            // Prevent key from being captured by parent components
                            e.stopPropagation()
                          }}
                        />
                        <DialogFooter className="mt-2 flex items-center">
                          <DialogClose asChild>
                            <Button
                              variant="link"
                              size="sm"
                              className="hover:no-underline"
                            >
                              {t('common:cancel')}
                            </Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button disabled={!name} onClick={createProvider}>
                              {t('common:create')}
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              }
            >
              {providers.map((provider, index) => (
                <CardItem
                  key={index}
                  title={
                    <div className="flex items-center gap-3">
                      <ProvidersAvatar provider={provider} />
                      <div>
                        <h3 className="font-medium">
                          {getProviderTitle(provider.provider)}
                        </h3>
                        <p className="text-xs text-main-view-fg/70">
                          {provider.models.length} Models
                        </p>
                      </div>
                    </div>
                  }
                  actions={
                    <div className="flex items-center gap-2">
                      {provider.active && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 w-6 p-0 bg-transparent hover:bg-main-view-fg/10 border-none shadow-none"
                          onClick={() => {
                            navigate({
                              to: route.settings.providers,
                              params: {
                                providerName: provider.provider,
                              },
                            })
                          }}
                        >
                          <IconSettings
                            className="text-main-view-fg/60"
                            size={16}
                          />
                        </Button>
                      )}
                      <Switch
                        checked={provider.active}
                        onCheckedChange={(e) => {
                          updateProvider(provider.provider, {
                            ...provider,
                            active: e,
                          })
                        }}
                      />
                    </div>
                  }
                />
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
