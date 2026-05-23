import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Shield, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { supabase } from '../supabaseClient'
import backgroundVideo from '../assets/mp_.mp4'


const API_BASE = 'http://localhost:8000'
const FLASK_BASE = 'http://localhost:5005'

const Auth = ({ onLoginSuccess }) => {
  const [step, setStep] = useState('select')
  const [emailTab, setEmailTab] = useState('signin') // 'signin' | 'signup'
  
  // Supabase Auth Email/Password States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Google User / Session State
  const [googleUser, setGoogleUser] = useState(null)
  
  // Profile creation state
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('Fashion Enthusiast & Creator')
  const [profilePic, setProfilePic] = useState('')

  // UI States
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

  // Monitor Supabase Auth changes & automatically sync
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && session.user) {
        const sbUser = session.user
        setLoading(true)
        try {
          let userRes = await axios.post(`${API_BASE}/auth/check-google`, { google_id: sbUser.id })
          
          if (userRes && userRes.data.exists) {
            const loggedUser = userRes.data.user
            localStorage.setItem('vogue_user', JSON.stringify(loggedUser))
            onLoginSuccess(loggedUser)
          } else {
            // New user registered via real Supabase Auth -> direct to profile creation
            setGoogleUser({
              name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
              email: sbUser.email,
              id: sbUser.id,
              pic: sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${sbUser.email}`
            })
            setUsername((sbUser.email || 'designer').split('@')[0] + Math.floor(Math.random() * 100))
            setProfilePic(sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${sbUser.email}`)
            setStep('profile-create')
          }
        } catch (err) {
          console.error('Error syncing Supabase user with local database:', err)
        }
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        await checkSession()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle real Google Sign-In via Supabase OAuth
  const handleRealGoogleSignIn = async () => {
    setLoading(true)
    setGeneralError('')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (err) {
      setGeneralError('Real Google Sign-In failed: ' + err.message)
    }
    setLoading(false)
  }

  // Handle Email & Password Sign-In
  const handleSignIn = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setGeneralError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      if (data.user) {
        // Check if user exists in our FastAPI database
        const res = await axios.post(`${API_BASE}/auth/check-google`, { google_id: data.user.id })
        if (res.data.exists) {
          const loggedUser = res.data.user
          localStorage.setItem('vogue_user', JSON.stringify(loggedUser))
          onLoginSuccess(loggedUser)
        } else {
          // If they exist in Supabase but not in FastAPI, direct to profile creation!
          setGoogleUser({
            name: email.split('@')[0],
            email: email,
            id: data.user.id,
            pic: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
          })
          setUsername(email.split('@')[0] + Math.floor(Math.random() * 100))
          setProfilePic(`https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`)
          setStep('profile-create')
        }
      }
    } catch (err) {
      setGeneralError(err.message)
    }
    setLoading(false)
  }

  // Handle Email & Password Sign-Up
  const handleSignUp = async (e) => {
    if (e) e.preventDefault()
    if (password.length < 6) {
      setGeneralError("Password must be at least 6 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setGeneralError("Passwords do not match.")
      return
    }
    setLoading(true)
    setGeneralError('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      
      if (data.user) {
        if (data.session) {
          // User logged in immediately (auto-confirm is ON)
          setGoogleUser({
            name: email.split('@')[0],
            email: email,
            id: data.user.id,
            pic: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
          })
          setUsername(email.split('@')[0] + Math.floor(Math.random() * 100))
          setProfilePic(`https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`)
          setStep('profile-create')
        } else {
          // Email verification required or successful sign-up
          setGeneralError("Registration successful! Please check your inbox to verify your email.")
        }
      }
    } catch (err) {
      setGeneralError(err.message)
    }
    setLoading(false)
  }

  // Create User Profile & Complete Registration for Google Flow
  const handleCreateProfile = async (e) => {
    if (e) e.preventDefault()
    if (!username || username.trim().length < 3) {
      setGeneralError('Username must be at least 3 characters long')
      return
    }

    setLoading(true)
    setGeneralError('')
    try {
      const regRes = await axios.post(`${API_BASE}/auth/register`, {
        username: username.trim(),
        email: googleUser ? googleUser.email : null,
        google_id: googleUser ? googleUser.id : null,
        bio: bio,
        profile_pic: profilePic
      })
      const newUser = regRes.data.user
      localStorage.setItem('vogue_user', JSON.stringify(newUser))
      onLoginSuccess(newUser)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setGeneralError(err.response.data.detail)
      } else {
        setGeneralError('Failed to register username. Make sure it is unique.')
      }
    }
    setLoading(false)
  }

  // Helper for Google Icon SVG
  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  )

  return (
    <div className="auth-container">
      {/* Sidebar background banner */}
      <div className="auth-sidebar">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="auth-sidebar-overlay" />
        <div className="auth-sidebar-content">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ fontFamily: 'Playfair Display, serif', fontSize: '3.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}
          >
            Welcome to Fassicana
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '30px' }}
          >
            where your creative fashion ideas turned in to fashion
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.6 }}
            style={{ display: 'flex', gap: '15px', alignItems: 'center' }}
          >
            <Shield size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem' }}>Secured by Atelier Cryptographic Protocol</span>
          </motion.div>
        </div>
      </div>

      {/* Interactive Authentication Form Side */}
      <div className="auth-card-container">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div 
              key="select"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="auth-glass-card"
            >
              <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                <h2 style={{ fontSize: '2.2rem', marginBottom: '10px', color: 'white', textTransform: 'capitalize' }}>proceed to fessicana</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>Access premium verified portfolios and commercial fashion items.</p>
              </div>

              {generalError && (
                <div style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)', padding: '12px', borderRadius: '10px', marginBottom: '25px', display: 'flex', gap: '10px', color: '#EA4335', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Tab Selector */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '25px', gap: '20px' }}>
                <button
                  onClick={() => { setEmailTab('signin'); setGeneralError(''); }}
                  style={{
                    background: 'none', border: 'none', color: emailTab === 'signin' ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                    paddingBottom: '10px', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
                    borderBottom: emailTab === 'signin' ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s', outline: 'none'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setEmailTab('signup'); setGeneralError(''); }}
                  style={{
                    background: 'none', border: 'none', color: emailTab === 'signup' ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                    paddingBottom: '10px', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
                    borderBottom: emailTab === 'signup' ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s', outline: 'none'
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* Form content based on tab */}
              <form onSubmit={emailTab === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>

                {emailTab === 'signup' && (
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input"
                      required
                    />
                  </div>
                )}

                <button type="submit" className="auth-btn-luxury auth-btn-phone" style={{ background: 'white', color: 'black', marginTop: '10px', padding: '15px' }} disabled={loading}>
                  {loading ? 'Processing...' : emailTab === 'signin' ? 'Sign In with Email' : 'Create Account'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              {/* OR Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'rgba(255,255,255,0.15)', margin: '20px 0' }}>
                <hr style={{ flex: 1, borderColor: 'currentColor' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
                <hr style={{ flex: 1, borderColor: 'currentColor' }} />
              </div>

              {/* Google OAuth Login */}
              <button 
                className="auth-btn-luxury auth-btn-google" 
                onClick={handleRealGoogleSignIn}
                disabled={loading}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            </motion.div>
          )}


          {step === 'profile-create' && (
            <motion.div 
              key="profile-create"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="auth-glass-card"
            >
              <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                <CheckCircle2 size={32} color="#4CAF50" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1.8rem', color: 'white' }}>Complete Profile</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '5px' }}>
                  Configure your high-fashion designer identifier
                </p>
              </div>

              {generalError && (
                <div style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)', padding: '12px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px', color: '#EA4335', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProfile}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {profilePic ? (
                        <img src={profilePic} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 600 }}>No Photo</span>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => setProfilePic(`https://api.dicebear.com/7.x/adventurer/svg?seed=${Math.random().toString()}`)}
                      style={{
                        position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)',
                        color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                        cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title="Generate new avatar"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Profile photos are optional to configure.</span>
                    {profilePic && (
                      <button 
                        type="button" 
                        onClick={() => setProfilePic('')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', marginTop: '4px', fontWeight: 600 }}
                      >
                        Clear Optional Photo
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Username <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'lowercase' }}>(max 20 characters)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. NeoAtelier" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                    className="auth-input"
                    maxLength={20}
                    required
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Designer Bio
                  </label>
                  <textarea 
                    placeholder="Short bio about your style..." 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="auth-input"
                    style={{ height: '80px', resize: 'none' }}
                  />
                </div>

                <button type="submit" className="auth-btn-luxury auth-btn-phone" disabled={loading}>
                  {loading ? 'Creating account...' : 'Complete & Log In'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Auth
