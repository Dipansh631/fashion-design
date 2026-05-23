import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Profile from './components/Profile'
import Gallery from './components/Gallery'
import Market from './components/Market'
import BusinessRegistration from './components/BusinessRegistration'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/market" element={<Market />} />
        <Route path="/business" element={<BusinessRegistration />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
