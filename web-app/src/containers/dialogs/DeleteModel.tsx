import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useModelProvider } from '@/hooks/useModelProvider'
import { deleteModel } from '@/services/models'
import { getProviders } from '@/services/providers'

import { IconTrash } from '@tabler/icons-react'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/react-i18next-compat'

type DialogDeleteModelProps = {
  provider: ModelProvider
  modelId?: string
}

export const DialogDeleteModel = ({
  provider,
  modelId,
}: DialogDeleteModelProps) => {
  const { t } = useTranslation()
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const { setProviders, deleteModel: deleteModelCache } = useModelProvider()

  const removeModel = async () => {
    deleteModelCache(selectedModelId)
    deleteModel(selectedModelId).then(() => {
      getProviders().then((providers) => {
        // Filter out the deleted model from all providers
        const filteredProviders = providers.map((provider) => ({
          ...provider,
          models: provider.models.filter(
            (model) => model.id !== selectedModelId
          ),
        }))
        setProviders(filteredProviders)
      })
      toast.success(
        t('providers:deleteModel.title', { modelId: selectedModel?.id }),
        {
          id: `delete-model-${selectedModel?.id}`,
          description: t('providers:deleteModel.success', {
            modelId: selectedModel?.id,
          }),
        }
      )
    })
  }

  // Initialize with the provided model ID or the first model if available
  useEffect(() => {
    if (modelId) {
      setSelectedModelId(modelId)
    } else if (provider.models && provider.models.length > 0) {
      setSelectedModelId(provider.models[0].id)
    }
  }, [provider, modelId])

  // Get the currently selected model
  const selectedModel = provider.models.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => m.id === selectedModelId
  )

  if (!selectedModel) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out">
          <IconTrash size={18} className="text-main-view-fg/50" />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('providers:deleteModel.title', { modelId: selectedModel.id })}
          </DialogTitle>
          <DialogDescription>
            {t('providers:deleteModel.description')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="link" size="sm" className="hover:no-underline">
              {t('providers:deleteModel.cancel')}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" size="sm" onClick={removeModel}>
              {t('providers:deleteModel.delete')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
