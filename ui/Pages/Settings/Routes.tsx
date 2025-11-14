import ConnectionPage from './Connections/ConnectionPage';
import LLMModelPage from './LLMModels/LLMModelPage';
import EmbeddingModelPage from './EmbeddingModels/EmbeddingModelPage';

const SettingsRoutes = [
  {
    index: true,
    element: <ConnectionPage />,
  },
  {
    path: 'connections',
    element: <ConnectionPage />,
  },
  {
    path: 'llm-models',
    element: <LLMModelPage />,
  },
  {
    path: 'embedding-models',
    element: <EmbeddingModelPage />,
  },

];

export default SettingsRoutes;
