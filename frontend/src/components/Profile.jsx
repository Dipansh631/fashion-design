import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { Heart, MessageCircle, Grid, UserPlus, FileQuestion, AlertCircle, RefreshCw, Camera, X, Check, Eye, Upload, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Profile = () => {
  const { username } = useParams()
  const [profileUser, setProfileUser] = useState(null)
  const [designs, setDesigns] = useState([])
  const [showContact, setShowContact] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messageText, setMessageText] = useState('')

  const [currentUser, setCurrentUser] = useState(null)
  
  // Avatar Zoom / Change Modal States
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarMode, setAvatarMode] = useState('view') // 'view' | 'change'
  const [newAvatarUrl, setNewAvatarUrl] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  // Profile Edit States
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editProfilePic, setEditProfilePic] = useState('')
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const editFileInputRef = useRef(null)

  // Profile Uploader & Tabs States
  const [activeTab, setActiveTab] = useState('')
  const [followersCount, setFollowersCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('Couture')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadImageUrl, setUploadImageUrl] = useState('')
  const [uploadIsAi, setUploadIsAi] = useState(false)
  const [uploadIsReady, setUploadIsReady] = useState(false)
  const [uploadPrice, setUploadPrice] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const API_BASE = 'http://localhost:8000'
  const fileInputRef = useRef(null)
  const designFileInputRef = useRef(null)

  const handleDesignFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('Image is too large. Please select an image under 1.5MB.')
      return
    }

    setUploadLoading(true)
    setUploadError('')
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadImageUrl(reader.result)
      setUploadLoading(false)
    }
    reader.onerror = () => {
      setUploadError('Failed to read file from computer.')
      setUploadLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    setUploadError('')

    if (!uploadTitle.trim() || !uploadDescription.trim() || !uploadImageUrl.trim()) {
      setUploadError('All fields are required. Please upload or paste a design image.')
      return
    }

    setUploadLoading(true)
    try {
      await axios.post(`${API_BASE}/designs/`, {
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        image_url: uploadImageUrl.trim(),
        is_ai_generated: uploadIsAi,
        is_ready_to_sell: uploadIsReady,
        price: uploadIsReady ? parseFloat(uploadPrice) || 0.0 : 0.0,
        category: uploadCategory.trim() || 'Couture',
        creator_id: currentUser.id
      })
      
      // Reset Form and Modal
      setUploadTitle('')
      setUploadDescription('')
      setUploadImageUrl('')
      setUploadIsAi(false)
      setUploadIsReady(false)
      setUploadPrice('')
      setUploadCategory('Couture')
      setShowUpload(false)
      
      // Refresh Profile Data
      fetchProfileData()
    } catch (err) {
      console.error('Error uploading design:', err)
      setUploadError(err.response?.data?.detail || 'Failed to publish design.')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDesignDelete = async (design) => {
    if (!currentUser || currentUser.id !== design.creator_id) return
    if (!window.confirm(`Delete "${design.title}"? This cannot be undone.`)) return
    setDeletingId(design.id)
    try {
      await axios.delete(`${API_BASE}/designs/${design.id}?requester_id=${currentUser.id}`)
      setDesigns(prev => prev.filter(d => d.id !== design.id))
    } catch (err) {
      console.error('Delete failed:', err)
      alert(err.response?.data?.detail || 'Could not delete design.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUser) return
    try {
      const res = await axios.post(`${API_BASE}/users/${username}/follow`, {
        follower_username: currentUser.username
      })
      if (res.data.action === 'followed') {
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
      } else {
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
      }
    } catch (e) {
      console.error('Error toggling follow:', e)
    }
  }

  const handleEditProfileFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 1.5 * 1024 * 1024) {
      setEditError('Image is too large. Please select an image under 1.5MB.')
      return
    }

    setEditLoading(true)
    setEditError('')
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditProfilePic(reader.result)
      setEditLoading(false)
    }
    reader.onerror = () => {
      setEditError('Failed to read file from computer.')
      setEditLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault()
    setEditError('')

    const cleanUsername = editUsername.trim()
    if (!cleanUsername) {
      setEditError('Username is required.')
      return
    }

    if (cleanUsername.length > 20) {
      setEditError('Username must not exceed 20 characters.')
      return
    }

    setEditLoading(true)
    try {
      const res = await axios.put(`${API_BASE}/users/${username}/profile`, {
        username: cleanUsername,
        bio: editBio.trim(),
        profile_pic: editProfilePic.trim() || null
      })

      // Update current user context and localStorage
      const updatedUser = {
        ...currentUser,
        username: res.data.user.username,
        profile_pic: res.data.user.profile_pic
      }
      localStorage.setItem('vogue_user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)

      // Close modal & route if username changed
      setShowEditProfile(false)
      if (username !== res.data.user.username) {
        window.location.href = `/profile/${res.data.user.username}`
      } else {
        // Refresh local state without reload
        setProfileUser(res.data.user)
      }
    } catch (err) {
      console.error(err)
      setEditError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setEditLoading(false)
    }
  }

  // Curated High-Fashion Unsplash Avatar Presets
  const avatarPresets = [
    { name: 'Editorial Portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop' },
    { name: 'Silhouette Model', url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=300&auto=format&fit=crop' },
    { name: 'Minimalist Style', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
    { name: 'Avant-Garde Look', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop' }
  ]

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

  const fetchProfileData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch User profile details
      const userRes = await axios.get(`${API_BASE}/users/${username}`)
      setProfileUser(userRes.data)

      // Fetch User designs
      const designsRes = await axios.get(`${API_BASE}/users/${username}/designs`)
      setDesigns(designsRes.data)

      // Select first category dynamically
      const uniqueCats = Array.from(new Set(designsRes.data.map(d => d.category || 'Couture')))
      if (uniqueCats.length > 0) {
        setActiveTab(prev => prev || uniqueCats[0])
      } else {
        setActiveTab(prev => prev || 'Couture')
      }

      // Fetch followers count
      const followersRes = await axios.get(`${API_BASE}/users/${username}/followers/count`)
      setFollowersCount(followersRes.data.count)

      // Fetch following state
      const stored = localStorage.getItem('vogue_user')
      if (stored) {
        const activeMe = JSON.parse(stored)
        const followingRes = await axios.get(`${API_BASE}/users/${activeMe.username}/following`)
        setIsFollowing(followingRes.data.includes(username))
      }
    } catch (err) {
      console.error('Error fetching profile details:', err)
      setError(err.response?.data?.detail || 'Designer profile not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (username) {
      fetchProfileData()
      
      const incrementViews = async () => {
        const stored = localStorage.getItem('vogue_user')
        if (stored) {
          try {
            const activeMe = JSON.parse(stored)
            if (activeMe.username !== username) {
              await axios.post(`${API_BASE}/users/${username}/view`)
            }
          } catch (e) {
            console.error('Error incrementing views:', e)
          }
        }
      }
      incrementViews()
    }
  }, [username])

  const isOwner = currentUser && currentUser.username === username

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Restrict file size to < 1.5MB to ensure high-performance DB storage
    if (file.size > 1.5 * 1024 * 1024) {
      setAvatarError('Image is too large. Please select an image under 1.5MB.')
      return
    }

    setAvatarLoading(true)
    setAvatarError('')
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setNewAvatarUrl(reader.result) // Set Base64 Data URL as the source
      setAvatarLoading(false)
    }
    reader.onerror = () => {
      setAvatarError('Failed to read file from computer.')
      setAvatarLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarUpdate = async (e) => {
    e.preventDefault()
    if (!newAvatarUrl.trim()) {
      setAvatarError('Please enter a URL or choose a file from your computer.')
      return
    }

    setAvatarLoading(true)
    setAvatarError('')
    try {
      const res = await axios.put(`${API_BASE}/users/${username}/profile-pic`, {
        profile_pic: newAvatarUrl.trim()
      })
      
      // Update local profile state
      setProfileUser(prev => ({ ...prev, profile_pic: res.data.profile_pic }))

      // Update session localStorage
      const updatedSession = { ...currentUser, profile_pic: res.data.profile_pic }
      localStorage.setItem('vogue_user', JSON.stringify(updatedSession))
      setCurrentUser(updatedSession)

      // Close modal
      setShowAvatarModal(false)
    } catch (err) {
      console.error('Error updating profile picture:', err)
      setAvatarError(err.response?.data?.detail || 'Failed to update avatar.')
    } finally {
      setAvatarLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'var(--text-main)' }}>
        <RefreshCw className="floating" size={40} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '20px' }} />
        <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Loading Designer Portfolio...</p>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'var(--text-main)', padding: '20px' }}>
        <Navbar user={currentUser} />
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <AlertCircle size={48} color="#EA4335" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Designer Not Found</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>The requested designer profile "@{username}" does not exist in the Fassicana database.</p>
          <button className="btn-primary" onClick={() => window.location.href = '/'}>Go to Home Dashboard</button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '120px' }}>
      <Navbar user={currentUser} />
      
      {showContact && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex',
          justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-card" style={{ padding: '40px', maxWidth: '500px', width: '90%', background: 'var(--bg-dark)' }}>
            <h2 style={{ color: 'var(--text-main)' }}>Contact {profileUser.username}</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>Interested in a collaboration or custom design?</p>
            <textarea 
              placeholder="Your message..." 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{
                width: '100%', height: '150px', background: 'var(--glass)',
                border: '1px solid var(--glass-border)', color: 'var(--text-main)',
                borderRadius: '10px', padding: '15px', marginBottom: '20px',
                fontFamily: 'inherit', resize: 'none', outline: 'none'
              }}
            ></textarea>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-primary" onClick={() => { setShowContact(false); setMessageText(''); alert('Message sent successfully!'); }}>Send Message</button>
              <button style={{ background: 'transparent', border: '1px solid var(--text-main)', color: 'var(--text-main)', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer' }} onClick={() => setShowContact(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Block */}
      <div className="container" style={{ paddingTop: '120px' }}>
        <div className="glass-card" style={{ padding: '40px', display: 'flex', gap: '40px', alignItems: 'center' }}>
          
          {/* Dynamic Avatar Container with interactive trigger overlay */}
          <div 
            onClick={() => { setShowAvatarModal(true); setAvatarMode('view'); }}
            style={{ 
              width: '180px', 
              height: '180px', 
              borderRadius: '50%', 
              background: 'var(--gradient)', 
              padding: '5px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              background: `url(${profileUser.profile_pic || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + profileUser.username}) center/cover`,
              border: '4px solid var(--bg-dark)'
            }}></div>
            {isOwner && (
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'var(--primary)',
                color: 'white',
                border: '3px solid var(--bg-dark)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}>
                <Camera size={16} />
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '15px', fontFamily: 'Playfair Display, serif' }}>
                  @{profileUser.username}
                  {profileUser.is_verified_business && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '4px 10px', borderRadius: '20px', fontWeight: '800' }}>
                      Verified Business
                    </span>
                  )}
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '5px' }}>Designer Portfolio</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {isOwner ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        setEditUsername(profileUser.username);
                        setEditBio(profileUser.bio || '');
                        setEditProfilePic(profileUser.profile_pic || '');
                        setEditError('');
                        setShowEditProfile(true);
                      }}
                      style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '12px 24px', borderRadius: '30px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => setShowUpload(true)}
                      className="btn-primary" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Upload size={18} /> Upload Post
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={handleFollowToggle}
                      className="btn-primary" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isFollowing ? 'rgba(184, 150, 62, 0.15)' : 'var(--primary)', color: isFollowing ? 'var(--primary)' : 'black', border: isFollowing ? '1px solid var(--primary)' : 'none' }}
                    >
                      <UserPlus size={18} /> {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button 
                      onClick={() => setShowContact(true)}
                      style={{ background: 'transparent', border: '1px solid var(--text-main)', color: 'var(--text-main)', padding: '12px 24px', borderRadius: '30px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <MessageCircle size={18} /> Contact
                    </button>
                  </>
                )}
              </div>
            </div>
            <p style={{ marginTop: '20px', fontSize: '1.1rem', maxWidth: '600px', color: 'var(--text-dim)' }}>
              {profileUser.bio || 'This designer has not written their bio yet.'}
            </p>
            <div style={{ display: 'flex', gap: '30px', marginTop: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div><strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{designs.length}</strong> <span style={{ color: 'var(--text-dim)' }}>Designs</span></div>
              <div><strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{followersCount}</strong> <span style={{ color: 'var(--text-dim)' }}>Followers</span></div>
              {isOwner && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '6px 14px', borderRadius: '20px' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>👁 Monthly Visits:</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{profileUser.profile_views || 0}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Active</span>
                </div>
              )}
              {profileUser.is_verified_business && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4CAF50', fontWeight: 'bold', fontSize: '1rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>✓</span> Verified Partner
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collections Tab */}
        <div style={{ marginTop: '50px' }}>
          <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginBottom: '30px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {(() => {
              const uniqueCats = Array.from(new Set(designs.map(d => d.category || 'Couture')));
              if (uniqueCats.length === 0) uniqueCats.push('Couture');
              
              return uniqueCats.map((cat, idx) => {
                const isActive = activeTab === cat || (activeTab === '' && idx === 0);
                const count = designs.filter(d => (d.category || 'Couture') === cat).length;
                return (
                  <div 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    style={{ 
                      color: isActive ? 'var(--primary)' : 'var(--text-dim)', 
                      fontWeight: '800', 
                      borderBottom: isActive ? '2px solid var(--primary)' : 'none', 
                      paddingBottom: '13px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Grid size={16} /> {cat} ({count})
                  </div>
                );
              });
            })()}
          </div>
 
          {designs.filter(d => (d.category || 'Couture') === (activeTab || 'Couture')).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.01)', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '20px', marginTop: '20px' }}>
              <FileQuestion size={48} color="rgba(0,0,0,0.2)" style={{ marginBottom: '15px' }} />
              <h3 style={{ color: 'var(--text-main)', fontSize: '1.4rem', marginBottom: '8px' }}>No Creational Sketches</h3>
              <p style={{ color: 'var(--text-dim)' }}>This designer hasn't posted any creations in this category yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {designs
                .filter(d => (d.category || 'Couture') === (activeTab || 'Couture'))
                .map(design => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      borderRadius: '20px',
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      position: 'relative',
                      transition: 'transform 0.25s, box-shadow 0.25s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 18px 48px rgba(0,0,0,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                  >
                    {/* Image with overlays */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={design.image_url}
                        alt={design.title}
                        style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {/* Gradient overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
                      {/* Type badge */}
                      <span style={{
                        position: 'absolute', top: '12px', left: '12px',
                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '4px 11px', borderRadius: '20px',
                        fontSize: '0.72rem', color: 'white', fontWeight: '700'
                      }}>
                        {design.is_ai_generated ? '✨ AI Silhouette' : '🧵 Crafted Couture'}
                      </span>
                      {/* Price badge */}
                      {design.is_ready_to_sell && (
                        <span style={{
                          position: 'absolute', top: '12px', right: '12px',
                          background: 'var(--primary)', color: 'black',
                          padding: '4px 11px', borderRadius: '20px',
                          fontSize: '0.78rem', fontWeight: '800'
                        }}>
                          ${design.price?.toFixed(2)}
                        </span>
                      )}
                      {/* Delete button - owner only */}
                      {isOwner && (
                        <button
                          onClick={() => handleDesignDelete(design)}
                          disabled={deletingId === design.id}
                          title="Delete this post"
                          style={{
                            position: 'absolute', bottom: '12px', right: '12px',
                            background: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', borderRadius: '50%',
                            width: '34px', height: '34px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: deletingId === design.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: deletingId === design.id ? 0.5 : 1
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.85)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '18px 20px' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'white', fontWeight: '700', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {design.title}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {design.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <Heart size={15} fill="var(--primary)" color="var(--primary)" />
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: '0.85rem' }}>{design.likes} likes</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Avatar Zoom & Uploader Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex',
            justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                width: '90%', maxWidth: '440px', background: 'rgba(20,20,20,0.95)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '30px',
                position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', textAlign: 'center'
              }}
            >
              <button 
                onClick={() => setShowAvatarModal(false)}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <AnimatePresence mode="wait">
                {avatarMode === 'view' ? (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '20px', fontFamily: 'Playfair Display, serif' }}>
                      @{profileUser.username}'s Avatar
                    </h3>
                    
                    {/* Zoom HD Avatar Showcase */}
                    <div style={{ 
                      width: '240px', 
                      height: '240px', 
                      borderRadius: '50%', 
                      border: '4px solid var(--primary)',
                      background: `url(${profileUser.profile_pic || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + profileUser.username}) center/cover`,
                      margin: '0 auto 30px auto',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }} />

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => setShowAvatarModal(false)}
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Close View
                      </button>
                      {isOwner && (
                        <button 
                          onClick={() => { setAvatarMode('change'); setNewAvatarUrl(profileUser.profile_pic || ''); }}
                          className="btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Camera size={16} /> Change Photo
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="change"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>
                      Update Avatar
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '20px' }}>Upload a photo from your computer, paste a URL, or pick a preset.</p>

                    {avatarError && (
                      <div style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)', padding: '10px', borderRadius: '10px', color: '#EA4335', fontSize: '0.85rem', marginBottom: '15px' }}>
                        {avatarError}
                      </div>
                    )}

                    <form onSubmit={handleAvatarUpdate}>
                      
                      {/* Computer Upload Area */}
                      <div style={{ marginBottom: '15px' }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          ref={fileInputRef} 
                          style={{ display: 'none' }} 
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px dashed rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'var(--primary)' }}
                          onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
                        >
                          <Upload size={16} /> Choose Image from Computer
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0', color: 'rgba(255,255,255,0.2)' }}>
                        <hr style={{ flex: 1, borderColor: 'currentColor' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>OR</span>
                        <hr style={{ flex: 1, borderColor: 'currentColor' }} />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', textAlign: 'left', fontWeight: 600 }}>Image URL</label>
                        <input 
                          type="url" 
                          placeholder="Paste custom photo URL..." 
                          value={newAvatarUrl.startsWith('data:') ? 'Local Image Loaded (Base64)' : newAvatarUrl}
                          onChange={(e) => setNewAvatarUrl(e.target.value)}
                          style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }}
                          disabled={newAvatarUrl.startsWith('data:')}
                        />
                        {newAvatarUrl.startsWith('data:') && (
                          <button 
                            type="button" 
                            onClick={() => setNewAvatarUrl('')}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'block', marginTop: '6px', fontWeight: 600 }}
                          >
                            Clear Local Image to Paste URL
                          </button>
                        )}
                      </div>

                      <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                        <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 600 }}>Select High-Fashion Presets:</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {avatarPresets.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewAvatarUrl(preset.url)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: newAvatarUrl === preset.url ? 'rgba(184, 150, 62, 0.15)' : 'rgba(255,255,255,0.02)',
                                border: '1px solid',
                                borderColor: newAvatarUrl === preset.url ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '0.75rem',
                                transition: 'all 0.2s',
                                fontWeight: 600
                              }}
                            >
                              <img src={preset.url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          onClick={() => setAvatarMode('view')}
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Back
                        </button>
                        <button 
                          type="submit"
                          className="btn-primary"
                          disabled={avatarLoading}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {avatarLoading ? 'Saving...' : 'Save Photo'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Profile Design Uploader Modal */}
      <AnimatePresence>
        {showUpload && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex',
            justifyContent: 'center', alignItems: 'flex-start', backdropFilter: 'blur(10px)',
            overflowY: 'auto', padding: '40px 0'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '90%', maxWidth: '560px', background: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '35px',
                position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                margin: 'auto'
              }}
            >
              <button 
                onClick={() => setShowUpload(false)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Playfair Display, serif' }}>
                ✨ Publish Creation
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '25px' }}>Upload your exclusive hand-crafted atelier files or AI generated styles.</p>

              {uploadError && (
                <div style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)', padding: '12px', borderRadius: '10px', color: '#EA4335', fontSize: '0.9rem', marginBottom: '20px' }}>
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cyberpunk Trenchcoat" 
                    value={uploadTitle} 
                    onChange={(e) => setUploadTitle(e.target.value)} 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    required 
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Atelier Description</label>
                  <textarea 
                    placeholder="Describe the fabric, cut, and creative thought process..." 
                    value={uploadDescription} 
                    onChange={(e) => setUploadDescription(e.target.value)} 
                    style={{ width: '100%', height: '80px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none', resize: 'none' }}
                    required 
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Collection Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cyber-Streetwear, Evening Gowns, Summer Blend" 
                    value={uploadCategory} 
                    onChange={(e) => setUploadCategory(e.target.value)} 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Type</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      type="button" 
                      onClick={() => setUploadIsAi(false)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid', borderColor: !uploadIsAi ? 'var(--primary)' : 'var(--glass-border)', background: !uploadIsAi ? 'rgba(184,150,62,0.08)' : 'transparent', color: 'white', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
                    >
                      🧵 Hand-crafted Couture
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setUploadIsAi(true)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid', borderColor: uploadIsAi ? 'var(--primary)' : 'var(--glass-border)', background: uploadIsAi ? 'rgba(184,150,62,0.08)' : 'transparent', color: 'white', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
                    >
                      ✨ AI Silhouette
                    </button>
                  </div>
                </div>

                {/* Ready to Sell Toggle */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block', color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Ready to Sell</span>
                      <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '2px' }}>List this piece directly on the public Marketplace</span>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={uploadIsReady} 
                        onChange={(e) => setUploadIsReady(e.target.checked)} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: uploadIsReady ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        transition: '.3s', borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px',
                          left: uploadIsReady ? '24px' : '3px', bottom: '3px',
                          backgroundColor: uploadIsReady ? 'black' : 'white',
                          transition: '.3s', borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>

                {uploadIsReady && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ textAlign: 'left' }}
                  >
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Wholesale Price ($)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 299.00" 
                      value={uploadPrice} 
                      onChange={(e) => setUploadPrice(e.target.value)} 
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                      required={uploadIsReady}
                    />
                  </motion.div>
                )}

                {/* Computer Upload Area */}
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Artwork</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleDesignFileChange} 
                    ref={designFileInputRef} 
                    style={{ display: 'none' }} 
                  />
                  <button
                    type="button"
                    onClick={() => designFileInputRef.current.click()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px dashed rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  >
                    <Upload size={16} /> Choose Sketch from Computer
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '5px 0', color: 'rgba(255,255,255,0.2)' }}>
                  <hr style={{ flex: 1, borderColor: 'currentColor' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>OR</span>
                  <hr style={{ flex: 1, borderColor: 'currentColor' }} />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Artwork URL</label>
                  <input 
                    type="url" 
                    placeholder="Paste a luxury image link..." 
                    value={uploadImageUrl.startsWith('data:') ? 'Local Image Loaded (Base64)' : uploadImageUrl} 
                    onChange={(e) => setUploadImageUrl(e.target.value)} 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none', marginBottom: '12px' }}
                    required={!uploadImageUrl} 
                    disabled={uploadImageUrl.startsWith('data:')}
                  />
                  {uploadImageUrl.startsWith('data:') && (
                    <button 
                      type="button" 
                      onClick={() => setUploadImageUrl('')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'block', marginTop: '-6px', marginBottom: '10px', fontWeight: 600 }}
                    >
                      Clear Local Image to Paste URL
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setShowUpload(false)}
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary"
                    disabled={uploadLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 30px' }}
                  >
                    {uploadLoading ? 'Publishing...' : 'Publish Creation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex',
            justifyContent: 'center', alignItems: 'flex-start', backdropFilter: 'blur(10px)',
            overflowY: 'auto', padding: '40px 0'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '90%', maxWidth: '500px', background: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '35px',
                position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                margin: 'auto'
              }}
            >
              <button 
                onClick={() => setShowEditProfile(false)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px', fontFamily: 'Playfair Display, serif', textAlign: 'left' }}>
                ✏️ Edit Profile
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '25px', textAlign: 'left' }}>Customize your designer identity and presentation bio.</p>

              {editError && (
                <div style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)', padding: '12px', borderRadius: '10px', color: '#EA4335', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Optional Avatar Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid var(--primary)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
                    {editProfilePic ? (
                      <img src={editProfilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>No Photo</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleEditProfileFileChange} 
                      ref={editFileInputRef} 
                      style={{ display: 'none' }} 
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current.click()}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '6px 12px', borderRadius: '15px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Choose File
                    </button>
                    {editProfilePic && (
                      <button 
                        type="button" 
                        onClick={() => setEditProfilePic('')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Image URL</label>
                  <input 
                    type="url" 
                    placeholder="Paste a profile picture URL..." 
                    value={editProfilePic.startsWith('data:') ? 'Local Image Loaded (Base64)' : editProfilePic} 
                    onChange={(e) => setEditProfilePic(e.target.value)} 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    disabled={editProfilePic.startsWith('data:')}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                    Username <span style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'lowercase' }}>(max 20 characters)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. NeoAtelier" 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))} 
                    maxLength={20}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    required 
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Bio</label>
                  <textarea 
                    placeholder="Describe your design focus, philosophy..." 
                    value={editBio} 
                    onChange={(e) => setEditBio(e.target.value)} 
                    style={{ width: '100%', height: '80px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary"
                    disabled={editLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 30px' }}
                  >
                    {editLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}

export default Profile
