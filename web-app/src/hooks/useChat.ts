import { useCallback, useEffect, useMemo } from 'react'
import { usePrompt } from './usePrompt'
import { useModelProvider } from './useModelProvider'
import { useThreads } from './useThreads'
import { useAppState } from './useAppState'
import { useMessages } from './useMessages'
import { useRouter } from '@tanstack/react-router'
import { defaultModel } from '@/lib/models'
import { route } from '@/constants/routes'
import {
  emptyThreadContent,
  extractToolCall,
  isCompletionResponse,
  newAssistantThreadContent,
  newUserThreadContent,
  postMessageProcessing,
  sendCompletion,
} from '@/lib/completion'
import { CompletionMessagesBuilder } from '@/lib/messages'
import { ChatCompletionMessageToolCall } from 'openai/resources'
import { useAssistant } from './useAssistant'
import { getTools } from '@/services/mcp'
import { MCPTool } from '@/types/completion'
import { listen } from '@tauri-apps/api/event'
import { SystemEvent } from '@/types/events'
import { stopModel, startModel, stopAllModels } from '@/services/models'

import { useToolApproval } from '@/hooks/useToolApproval'
import { useToolAvailable } from '@/hooks/useToolAvailable'
import { OUT_OF_CONTEXT_SIZE } from '@/utils/error'
import { updateSettings } from '@/services/providers'
import { useContextSizeApproval } from './useModelContextApproval'
import { useModelLoad } from './useModelLoad'
import { useGeneralSetting } from './useGeneralSetting'

export const useChat = () => {
  const { prompt, setPrompt } = usePrompt()
  const { experimentalFeatures } = useGeneralSetting()
  const {
    tools,
    updateTokenSpeed,
    resetTokenSpeed,
    updateTools,
    updateStreamingContent,
    updateLoadingModel,
    setAbortController,
  } = useAppState()
  const { assistants, currentAssistant } = useAssistant()
  const { updateProvider } = useModelProvider()

  const { approvedTools, showApprovalModal, allowAllMCPPermissions } =
    useToolApproval()
  const { showApprovalModal: showIncreaseContextSizeModal } =
    useContextSizeApproval()
  const { getDisabledToolsForThread } = useToolAvailable()

  const { getProviderByName, selectedModel, selectedProvider } =
    useModelProvider()

  const {
    getCurrentThread: retrieveThread,
    createThread,
    updateThreadTimestamp,
  } = useThreads()
  const { getMessages, addMessage } = useMessages()
  const { setModelLoadError } = useModelLoad()
  const router = useRouter()

  const provider = useMemo(() => {
    return getProviderByName(selectedProvider)
  }, [selectedProvider, getProviderByName])

  const currentProviderId = useMemo(() => {
    return provider?.provider || selectedProvider
  }, [provider, selectedProvider])

  const selectedAssistant =
    assistants.find((a) => a.id === currentAssistant.id) || assistants[0]

  useEffect(() => {
    function setTools() {
      getTools().then((data: MCPTool[]) => {
        updateTools(data)
      })
    }
    setTools()

    let unsubscribe = () => {}
    listen(SystemEvent.MCP_UPDATE, setTools).then((unsub) => {
      // Unsubscribe from the event when the component unmounts
      unsubscribe = unsub
    })
    return unsubscribe
  }, [updateTools])

  const getCurrentThread = useCallback(async () => {
    let currentThread = retrieveThread()

    if (!currentThread) {
      currentThread = await createThread(
        {
          id: selectedModel?.id ?? defaultModel(selectedProvider),
          provider: selectedProvider,
        },
        prompt,
        selectedAssistant
      )
      router.navigate({
        to: route.threadsDetail,
        params: { threadId: currentThread.id },
      })
    }
    return currentThread
  }, [
    createThread,
    prompt,
    retrieveThread,
    router,
    selectedModel?.id,
    selectedProvider,
    selectedAssistant,
  ])

  const restartModel = useCallback(
    async (provider: ProviderObject, modelId: string) => {
      await stopAllModels()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      updateLoadingModel(true)
      await startModel(provider, modelId).catch(console.error)
      updateLoadingModel(false)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
    [updateLoadingModel]
  )

  const increaseModelContextSize = useCallback(
    async (modelId: string, provider: ProviderObject) => {
      /**
       * Should increase the context size of the model by 2x
       * If the context size is not set or too low, it defaults to 8192.
       */
      const model = provider.models.find((m) => m.id === modelId)
      if (!model) return undefined
      const ctxSize = Math.max(
        model.settings?.ctx_len?.controller_props.value
          ? typeof model.settings.ctx_len.controller_props.value === 'string'
            ? parseInt(model.settings.ctx_len.controller_props.value as string)
            : (model.settings.ctx_len.controller_props.value as number)
          : 16384,
        16384
      )
      const updatedModel = {
        ...model,
        settings: {
          ...model.settings,
          ctx_len: {
            ...(model.settings?.ctx_len != null ? model.settings?.ctx_len : {}),
            controller_props: {
              ...(model.settings?.ctx_len?.controller_props ?? {}),
              value: ctxSize * 2,
            },
          },
        },
      }

      // Find the model index in the provider's models array
      const modelIndex = provider.models.findIndex((m) => m.id === model.id)

      if (modelIndex !== -1) {
        // Create a copy of the provider's models array
        const updatedModels = [...provider.models]

        // Update the specific model in the array
        updatedModels[modelIndex] = updatedModel as Model

        // Update the provider with the new models array
        updateProvider(provider.provider, {
          models: updatedModels,
        })
      }
      const updatedProvider = getProviderByName(provider.provider)
      if (updatedProvider) await restartModel(updatedProvider, model.id)

      return updatedProvider
    },
    [getProviderByName, restartModel, updateProvider]
  )
  const toggleOnContextShifting = useCallback(
    async (modelId: string, provider: ProviderObject) => {
      const providerName = provider.provider
      const newSettings = [...provider.settings]
      const settingKey = 'ctx_shift'
      // Handle different value types by forcing the type
      // Use type assertion to bypass type checking
      const settingIndex = provider.settings.findIndex(
        (s) => s.key === settingKey
      )
      ;(
        newSettings[settingIndex].controller_props as {
          value: string | boolean | number
        }
      ).value = true

      // Create update object with updated settings
      const updateObj: Partial<ModelProvider> = {
        settings: newSettings,
      }

      await updateSettings(providerName, updateObj.settings ?? [])
      updateProvider(providerName, {
        ...provider,
        ...updateObj,
      })
      const updatedProvider = getProviderByName(providerName)
      if (updatedProvider) await restartModel(updatedProvider, modelId)
      return updatedProvider
    },
    [updateProvider, getProviderByName, restartModel]
  )

  const sendMessage = useCallback(
    async (message: string, troubleshooting = true) => {
      const activeThread = await getCurrentThread()

      resetTokenSpeed()
      let activeProvider = currentProviderId
        ? getProviderByName(currentProviderId)
        : provider
      if (!activeThread || !activeProvider) return
      const messages = getMessages(activeThread.id)
      const abortController = new AbortController()
      setAbortController(activeThread.id, abortController)
      updateStreamingContent(emptyThreadContent)
      // Do not add new message on retry
      if (troubleshooting)
        addMessage(newUserThreadContent(activeThread.id, message))
      updateThreadTimestamp(activeThread.id)
      setPrompt('')
      try {
        if (selectedModel?.id) {
          updateLoadingModel(true)
          await startModel(activeProvider, selectedModel.id)
          updateLoadingModel(false)
        }

        const builder = new CompletionMessagesBuilder(
          messages,
          currentAssistant?.instructions
        )
        if (troubleshooting) builder.addUserMessage(message)

        let isCompleted = false

        // Filter tools based on model capabilities and available tools for this thread
        let availableTools =
          experimentalFeatures && selectedModel?.capabilities?.includes('tools')
            ? tools.filter((tool) => {
                const disabledTools = getDisabledToolsForThread(activeThread.id)
                return !disabledTools.includes(tool.name)
              })
            : []

        // TODO: Later replaced by Agent setup?
        const followUpWithToolUse = true
        while (
          !isCompleted &&
          !abortController.signal.aborted &&
          activeProvider
        ) {
          const modelConfig = activeProvider.models.find(
            (m) => m.id === selectedModel?.id
          )

          const modelSettings = modelConfig?.settings
            ? Object.fromEntries(
                Object.entries(modelConfig.settings)
                  .filter(
                    ([key, value]) =>
                      key !== 'ctx_len' &&
                      key !== 'ngl' &&
                      value.controller_props?.value !== undefined &&
                      value.controller_props?.value !== null &&
                      value.controller_props?.value !== ''
                  )
                  .map(([key, value]) => [key, value.controller_props?.value])
              )
            : undefined

          const completion = await sendCompletion(
            activeThread,
            activeProvider,
            builder.getMessages(),
            abortController,
            availableTools,
            currentAssistant.parameters?.stream === false ? false : true,
            {
              ...modelSettings,
              ...currentAssistant.parameters,
            } as unknown as Record<string, object>
          )

          if (!completion) throw new Error('No completion received')
          let accumulatedText = ''
          const currentCall: ChatCompletionMessageToolCall | null = null
          const toolCalls: ChatCompletionMessageToolCall[] = []
          try {
            if (isCompletionResponse(completion)) {
              accumulatedText =
                (completion.choices[0]?.message?.content as string) || ''
              if (completion.choices[0]?.message?.tool_calls) {
                toolCalls.push(...completion.choices[0].message.tool_calls)
              }
            } else {
              for await (const part of completion) {
                // Error message
                if (!part.choices) {
                  throw new Error(
                    'message' in part
                      ? (part.message as string)
                      : (JSON.stringify(part) ?? '')
                  )
                }
                const delta = part.choices[0]?.delta?.content || ''

                if (part.choices[0]?.delta?.tool_calls) {
                  const calls = extractToolCall(part, currentCall, toolCalls)
                  const currentContent = newAssistantThreadContent(
                    activeThread.id,
                    accumulatedText,
                    {
                      tool_calls: calls.map((e) => ({
                        ...e,
                        state: 'pending',
                      })),
                    }
                  )
                  updateStreamingContent(currentContent)
                  await new Promise((resolve) => setTimeout(resolve, 0))
                }
                if (delta) {
                  accumulatedText += delta
                  // Create a new object each time to avoid reference issues
                  // Use a timeout to prevent React from batching updates too quickly
                  const currentContent = newAssistantThreadContent(
                    activeThread.id,
                    accumulatedText,
                    {
                      tool_calls: toolCalls.map((e) => ({
                        ...e,
                        state: 'pending',
                      })),
                    }
                  )
                  updateStreamingContent(currentContent)
                  updateTokenSpeed(currentContent)
                  await new Promise((resolve) => setTimeout(resolve, 0))
                }
              }
            }
          } catch (error) {
            const errorMessage =
              error && typeof error === 'object' && 'message' in error
                ? error.message
                : error
            if (
              typeof errorMessage === 'string' &&
              errorMessage.includes(OUT_OF_CONTEXT_SIZE) &&
              selectedModel
            ) {
              const method = await showIncreaseContextSizeModal()
              if (method === 'ctx_len') {
                /// Increase context size
                activeProvider = await increaseModelContextSize(
                  selectedModel.id,
                  activeProvider
                )
                continue
              } else if (method === 'context_shift' && selectedModel?.id) {
                /// Enable context_shift
                activeProvider = await toggleOnContextShifting(
                  selectedModel?.id,
                  activeProvider
                )
                continue
              } else throw error
            } else {
              throw error
            }
          }
          // TODO: Remove this check when integrating new llama.cpp extension
          if (
            accumulatedText.length === 0 &&
            toolCalls.length === 0 &&
            activeThread.model?.id &&
            false
          ) {
            /* llama.cpp removed */
            throw new Error('No response received from the model')
          }

          // Create a final content object for adding to the thread
          const finalContent = newAssistantThreadContent(
            activeThread.id,
            accumulatedText,
            {
              tokenSpeed: useAppState.getState().tokenSpeed,
              assistant: currentAssistant,
            }
          )

          builder.addAssistantMessage(accumulatedText, undefined, toolCalls)
          const updatedMessage = await postMessageProcessing(
            toolCalls,
            builder,
            finalContent,
            abortController,
            approvedTools,
            allowAllMCPPermissions ? undefined : showApprovalModal,
            allowAllMCPPermissions
          )
          addMessage(updatedMessage ?? finalContent)
          updateStreamingContent(emptyThreadContent)
          updateThreadTimestamp(activeThread.id)

          isCompleted = !toolCalls.length
          // Do not create agent loop if there is no need for it
          if (!followUpWithToolUse) availableTools = []
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          if (error && typeof error === 'object' && 'message' in error) {
            setModelLoadError(error as ErrorObject)
          } else {
            setModelLoadError(`${error}`)
          }
        }
      } finally {
        updateLoadingModel(false)
        updateStreamingContent(undefined)
      }
    },
    [
      getCurrentThread,
      resetTokenSpeed,
      currentProviderId,
      getProviderByName,
      provider,
      getMessages,
      setAbortController,
      updateStreamingContent,
      addMessage,
      updateThreadTimestamp,
      setPrompt,
      selectedModel,
      currentAssistant,
      experimentalFeatures,
      tools,
      updateLoadingModel,
      getDisabledToolsForThread,
      approvedTools,
      allowAllMCPPermissions,
      showApprovalModal,
      updateTokenSpeed,
      showIncreaseContextSizeModal,
      increaseModelContextSize,
      toggleOnContextShifting,
      setModelLoadError,
    ]
  )

  return { sendMessage }
}
