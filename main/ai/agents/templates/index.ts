import titleTemplate from './title.json';

interface AgentTemplate {
  name: string;
  description: string;
  content: string[]; // Array of strings representing the template content
}

export const agentTemplates: Record<string, AgentTemplate> = {
  titleGeneration: titleTemplate as AgentTemplate
};