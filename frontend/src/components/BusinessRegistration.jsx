import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { ShieldCheck, Smartphone, CheckCircle } from 'lucide-react'
import axios from 'axios'

const BusinessRegistration = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [step, setStep] = useState(1)
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('vogue_user')
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Validate Indian Mobile Numbers
  const validateIndianMobile = (num) => {
    const digits = num.replace(/\D/g, '')
    let core = digits
    if (digits.length === 12 && digits.startsWith('91')) {
      core = digits.slice(2)
    } else if (digits.length === 11 && digits.startsWith('0')) {
      core = digits.slice(1)
    }
    const isValid = core.length === 10 && /^[6-9]/.test(core)
    return {
      isValid,
      coreNumber: core,
      formatted: `+91${core}`
    }
  }

  const handleRequestCode = async () => {
    const mobileVal = validateIndianMobile(mobile)
    if (!mobileVal.isValid) {
      alert("Please enter a valid 10-digit Indian mobile number (starts with 6-9).")
      return
    }

    const formattedMobile = mobileVal.formatted
    setLoading(true)
    try {
      // Calling our Flask backend w/ standardized number
      await axios.post('http://localhost:5005/request-verification', { mobile_no: formattedMobile })
      setStep(2)
    } catch (error) {
      alert("Failed to send code. Make sure the Flask server is running on port 5005.")
    }
    setLoading(false)
  }

  const handleVerify = async () => {
    const mobileVal = validateIndianMobile(mobile)
    const formattedMobile = mobileVal.formatted

    setLoading(true)
    try {
      await axios.post('http://localhost:5005/verify', { mobile_no: formattedMobile, code: code })
      setStep(3)
    } catch (error) {
      alert("Invalid code. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '120px' }}>
      <Navbar user={currentUser} />
      <div className="container" style={{ paddingTop: '150px', maxWidth: '600px' }}>
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
          {step === 1 && (
            <>
              <ShieldCheck size={60} color="var(--primary)" style={{ marginBottom: '20px' }} />
              <h1 style={{ marginBottom: '10px' }}>Business Verification</h1>
              <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Enter your registered mobile number to begin the verification process.</p>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ padding: '15px 15px 15px 20px', color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Smartphone size={18} color="var(--primary)" />
                  <span>+91</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Enter 10-digit number" 
                  value={mobile.replace(/^\+91/, '').replace(/^91/, '')}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{
                    flex: 1,
                    padding: '15px 20px',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.1rem',
                    outline: 'none',
                    letterSpacing: '1px'
                  }}
                  required
                />
              </div>
              <button 
                className="btn-primary" 
                style={{ width: '100%' }} 
                onClick={handleRequestCode}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Get Verification Code'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <Smartphone size={60} color="var(--primary)" style={{ marginBottom: '20px' }} />
              <h1 style={{ marginBottom: '10px' }}>Enter Code</h1>
              <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>We've sent a 6-digit code to {mobile}</p>
              <input 
                type="text" 
                placeholder="000000" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  width: '100%', padding: '15px', background: 'var(--glass)',
                  border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px',
                  fontSize: '1.5rem', textAlign: 'center', letterSpacing: '10px', marginBottom: '20px'
                }} 
              />
              <button 
                className="btn-primary" 
                style={{ width: '100%' }} 
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Register'}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <CheckCircle size={80} color="#4CAF50" style={{ marginBottom: '20px' }} />
              <h1 style={{ marginBottom: '10px' }}>Verification Successful</h1>
              <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Your business account is now active. You can start uploading your commercial collections.</p>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => window.location.href = '/'}>
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default BusinessRegistration
