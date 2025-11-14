import { humanize } from "@shared/utils";

const PROVIDER_PRESETS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    kind: 'OPENAI',
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    kind: 'ANTHROPIC',
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    kind: 'OPENAI',
  },
  lmstudio: {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    kind: 'OPENAI',
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    kind: 'OPENAI',
  },
  xai: {
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    kind: 'OPENAI',
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    kind: 'OPENAI',
  },
  custom: {
    name: 'Custom',
    baseUrl: '',
    kind: 'OPENAI',
  }
};

/**
 * Simple model interface
 */
export interface SimpleModel {
  id: string;
  name: string;
}

/**
 * Parse models from API response - simple and clean
 */
export function parseModels(models: readonly any[] | undefined | null): SimpleModel[] {
  if (!models || !Array.isArray(models)) {
    return [];
  }

  return models.map(model => ({
    id: model.id || model.model || '',
    name: model.name || humanize(model.id || model.model || '')
  })).filter(model => model.id); // Remove any models without ID
}

/**
 * Convert model ID to human-readable name
 */


/**
 * Filter models to only show embedding models
 */
export function getEmbeddingModels(models: readonly SimpleModel[]): SimpleModel[] {
  return models.filter(model =>
    model.id.toLowerCase().includes('embedding') ||
    model.name.toLowerCase().includes('embedding')
  );
}

/**
 * Filter models to only show LLM models (non-embedding)
 */
export function getLLMModels(models: readonly SimpleModel[]): SimpleModel[] {
  return models.filter(model =>
    !model.id.toLowerCase().includes('embedding') &&
    !model.name.toLowerCase().includes('embedding')
  );
}

export { PROVIDER_PRESETS };