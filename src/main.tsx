import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Add preconnect/dns-prefetch links
const addHint = (url: string, rel: string, crossOrigin?: boolean) => {
  const link = document.createElement('link')
  link.rel = rel
  link.href = url
  if (crossOrigin) link.crossOrigin = ''
  document.head.appendChild(link)
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {      
      addHint('https://api.dabablane.com', 'preconnect', true)
      addHint('https://fonts.googleapis.com', 'dns-prefetch')
      addHint('https://fonts.gstatic.com', 'dns-prefetch')
    }, 500)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  process.env.NODE_ENV === 'production' ? <App /> : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
)
