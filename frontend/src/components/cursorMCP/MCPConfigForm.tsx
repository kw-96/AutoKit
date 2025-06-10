/**
 * MCP配置表单组件
 */
import React, { useState, useEffect } from 'react';
import { MCPConfig } from '../../services/cursorMCP/types';
import './MCPConfigForm.css';

interface MCPConfigFormProps {
  initialConfig?: Partial<MCPConfig>;
  onSubmit: (config: Partial<MCPConfig>) => void;
  onCancel?: () => void;
}

const MCPConfigForm: React.FC<MCPConfigFormProps> = ({ initialConfig, onSubmit, onCancel }) => {
  const defaultApiEndpoint = 'https://api.cursor.sh/v1';
  
  const [formData, setFormData] = useState<Partial<MCPConfig>>({
    name: '',
    description: '',
    version: '1.0.0', // 默认版本
    apiEndpoint: defaultApiEndpoint, // 默认API端点
    apiKey: '',
    enabled: true, // 默认启用
    settings: {},
    ...initialConfig
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialConfig) {
      setFormData({
        name: '',
        description: '',
        version: '1.0.0',
        apiEndpoint: defaultApiEndpoint,
        apiKey: '',
        enabled: true,
        settings: {},
        ...initialConfig
      });
    }
  }, [initialConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = '名称不能为空';
    }
    
    if (!formData.apiKey?.trim()) {
      newErrors.apiKey = 'API密钥不能为空';
    }
    
    // 版本和API端点不再是必填项，但如果填写了API端点，需要验证格式
    if (formData.apiEndpoint?.trim() && formData.apiEndpoint !== defaultApiEndpoint) {
      try {
        new URL(formData.apiEndpoint);
      } catch (error) {
        newErrors.apiEndpoint = 'API端点必须是有效的URL';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      // 确保使用默认值
      const submittedData = {
        ...formData,
        version: formData.version || '1.0.0',
        apiEndpoint: formData.apiEndpoint || defaultApiEndpoint,
        enabled: formData.enabled !== undefined ? formData.enabled : true
      };
      
      onSubmit(submittedData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mcp-config-form">
      <div className="form-group">
        <label htmlFor="name">名称 *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="配置名称"
        />
        {errors.name && <div className="error-message">{errors.name}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="description">描述</label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="配置描述（可选）"
        />
      </div>

      <div className="form-group">
        <label htmlFor="version">版本</label>
        <input
          type="text"
          id="version"
          name="version"
          value={formData.version || '1.0.0'}
          onChange={handleChange}
          placeholder="默认为1.0.0"
        />
        <small className="help-text">默认为1.0.0，通常无需修改</small>
      </div>

      <div className="form-group">
        <label htmlFor="apiEndpoint">API端点</label>
        <input
          type="text"
          id="apiEndpoint"
          name="apiEndpoint"
          value={formData.apiEndpoint || defaultApiEndpoint}
          onChange={handleChange}
          className={errors.apiEndpoint ? 'error' : ''}
          placeholder={defaultApiEndpoint}
        />
        {errors.apiEndpoint && <div className="error-message">{errors.apiEndpoint}</div>}
        <small className="help-text">默认为{defaultApiEndpoint}，通常无需修改</small>
      </div>

      <div className="form-group">
        <label htmlFor="apiKey">API密钥 *</label>
        <input
          type="password"
          id="apiKey"
          name="apiKey"
          value={formData.apiKey || ''}
          onChange={handleChange}
          className={errors.apiKey ? 'error' : ''}
          placeholder="输入Cursor API密钥"
        />
        {errors.apiKey && <div className="error-message">{errors.apiKey}</div>}
        <small className="help-text">在Cursor账户设置中获取</small>
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            name="enabled"
            checked={formData.enabled !== undefined ? formData.enabled : true}
            onChange={handleChange}
          />
          启用
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-button">保存</button>
        {onCancel && (
          <button type="button" className="cancel-button" onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </form>
  );
};

export default MCPConfigForm; 