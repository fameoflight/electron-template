import React from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import App from '@ui/App'


// Function to hide loading screen and show React app
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen')
  const root = document.getElementById('root')

  if (loadingScreen) {
    loadingScreen.classList.add('hidden')

    // Remove loading screen from DOM after transition
    setTimeout(() => {
      if (loadingScreen.parentNode) {
        loadingScreen.parentNode.removeChild(loadingScreen)
      }
    }, 500) // Match the CSS transition duration
  }

  if (root) {
    root.classList.add('loaded')
  }
}



hideLoadingScreen();

const rootElement = document.getElementById('root');

createRoot(rootElement!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
