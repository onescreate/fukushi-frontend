import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 画面切り替え機能（BrowserRouter）を追加
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)