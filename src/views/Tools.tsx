import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SubTool {
  name: string
  description?: string
  enabled: boolean
}

interface Tool {
  name: string
  description?: string
  icon?: string
  tools?: SubTool[]
  enabled: boolean
}

const Tools = () => {
  const { t } = useTranslation()
  const [tools, setTools] = useState<Tool[]>([])
  const [error, setError] = useState<string>('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [mcpConfig, setMcpConfig] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTools()
    fetchMCPConfig()
  }, [])

  const fetchTools = async () => {
    try {
      const response = await fetch("/api/tools")
      const data = await response.json()

      if (data.success) {
        setTools(data.tools)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch tools')
    }
  }

  const fetchMCPConfig = async () => {
    try {
      const response = await fetch("/api/config/mcpserver")
      const data = await response.json()
      if (data.success) {
        setMcpConfig(data.config || {})
      }
    } catch (error) {
      console.error('Failed to fetch MCP config:', error)
    }
  }

  const handleConfigSubmit = async (newConfig: Record<string, any>) => {
    try {
      const response = await fetch("/api/config/mcpserver", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      })
      const data = await response.json()
      if (data.success) {
        setMcpConfig(newConfig)
        setShowConfigModal(false)
        fetchTools()
      }
    } catch (error) {
      console.error('Failed to update MCP config:', error)
    }
  }

  const toggleTool = async (toolIndex: number) => {
    try {
      setIsLoading(true)
      const tool = tools[toolIndex]
      const currentEnabled = tool.enabled

      const newConfig = JSON.parse(JSON.stringify(mcpConfig))
      newConfig.mcpServers[tool.name].enabled = !currentEnabled

      const response = await fetch('/api/config/mcpserver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      })

      const data = await response.json()
      if (data.success) {
        setMcpConfig(newConfig)
        await fetchTools()
      }
    } catch (error) {
      console.error('Failed to toggle tool:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleToolSection = (index: number) => {
    const toolElement = document.getElementById(`tool-${index}`)
    toolElement?.classList.toggle('expanded')
  }

  return (
    <div className="tools-page">
      <div className="tools-container">
        <div className="tools-header">
          <div>
            <h1>{t('tools.title')}</h1>
            <p className="subtitle">{t('tools.subtitle')}</p>
          </div>
          <button 
            className="edit-config-btn"
            onClick={() => setShowConfigModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            {t('tools.editConfig')}
          </button>
        </div>

        <div className="tools-list">
          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            tools.map((tool, index) => (
              <div key={index} id={`tool-${index}`} className="tool-section">
                <div className="tool-header">
                  <div className="tool-header-content" onClick={() => toggleToolSection(index)}>
                    {tool.icon ? (
                      <img src={tool.icon} alt="" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                      </svg>
                    )}
                    <span className="tool-name">{tool.name}</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tool.enabled}
                      onChange={() => toggleTool(index)}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className="tool-toggle">▼</span>
                </div>
                <div className="tool-content">
                  {tool.description && (
                    <div className="tool-description">{tool.description}</div>
                  )}
                  {tool.tools && (
                    <div className="sub-tools">
                      {tool.tools.map((subTool, subIndex) => (
                        <div key={subIndex} className="sub-tool">
                          <div className="sub-tool-content">
                            <div className="sub-tool-name">{subTool.name}</div>
                            {subTool.description && (
                              <div className="sub-tool-description">
                                {subTool.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isLoading && (
        <div className="global-loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{t('tools.configTitle')}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowConfigModal(false)}
              >
                ×
              </button>
            </div>
            <ConfigForm
              config={mcpConfig}
              onSubmit={handleConfigSubmit}
              onCancel={() => setShowConfigModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface ConfigFormProps {
  config: Record<string, any>
  onSubmit: (config: Record<string, any>) => void
  onCancel: () => void
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  config,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation()
  const [jsonString, setJsonString] = useState(JSON.stringify(config, null, 2))
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const parsedConfig = JSON.parse(jsonString)
      setIsSubmitting(true)
      await onSubmit(parsedConfig)
      alert(t('tools.saveSuccess'))
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format')
      } else {
        setError(t('tools.saveFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="config-form">
      {error && <div className="error-message">{error}</div>}
      <textarea
        value={jsonString}
        onChange={e => {
          setJsonString(e.target.value)
          setError('')
        }}
        className="config-textarea"
        rows={20}
      />
      <div className="form-actions">
        <button 
          type="button" 
          onClick={onCancel} 
          className="cancel-btn"
          disabled={isSubmitting}
        >
          {t('tools.cancel')}
        </button>
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="loading-spinner"></div>
          ) : t('tools.save')}
        </button>
      </div>
    </form>
  )
}

export default React.memo(Tools) 