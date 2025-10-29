import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UIProvider } from './context/UIContext';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UIProvider>
      <AuthProvider>
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </AuthProvider>
    </UIProvider>
  </React.StrictMode>
);