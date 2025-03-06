import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // Import createBrowserRouter
import { Toaster } from 'react-hot-toast';

const router = createBrowserRouter([
  {
    path: "*",
    element: <App />,
  }
],
{
  future: {
    v7_startTransition: true, // Add the future flag
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster position="top-center" reverseOrder={false}/>
  </StrictMode>
);
