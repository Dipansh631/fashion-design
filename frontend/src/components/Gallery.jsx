import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { Upload, Info, Heart, X, Sparkles, Wand2, RefreshCw, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Gallery = () => {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  
  // Modal & Form State
  const [showUpload, setShowUpload] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [isReadyToSell, setIsReadyToSell] = useState(false)
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Couture')
  const [formError, setFormError] = useState('')

  const API_BASE = 'http://localhost:8000'
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Restrict file size to < 1.5MB to ensure high-performance DB storage
    if (file.size > 1.5 * 1024 * 1024) {
      setFormError('Image is too large. Please select an image under 1.5MB.')
      return
    }

    setUploadLoading(true)
    setFormError('')
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageUrl(reader.result) // Set Base64 Data URL as the source
      setUploadLoading(false)
    }
    reader.onerror = () => {
      setFormError('Failed to read file from computer.')
      setUploadLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const fetchDesigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/designs`)
      setDesigns(res.data)
    } catch (err) {
      console.error('Error fetching designs:', err)
      setError('Could not load gallery creations. Ensure API is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDesigns()
    const stored = localStorage.getItem('vogue_user')
    if (stored) setCurrentUser(JSON.parse(stored))
  }, [])

  const handleDelete = async (design) => {
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

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const storedUser = localStorage.getItem('vogue_user')
    if (!storedUser) {
      setFormError('You must be logged in to upload a design.')
      return
    }

    const user = JSON.parse(storedUser)

    if (!title.trim() || !description.trim() || !imageUrl.trim()) {
      setFormError('All fields are required. Please select or paste an image.')
      return
    }

    setUploadLoading(true)
    try {
      await axios.post(`${API_BASE}/designs/`, {
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl.trim(),
        is_ai_generated: isAiGenerated,
        is_ready_to_sell: isReadyToSell,
        price: isReadyToSell ? parseFloat(price) || 0.0 : 0.0,
        category: category.trim() || 'Couture',
        creator_id: user.id
      })
      
      // Reset Form and Modal
      setTitle('')
      setDescription('')
      setImageUrl('')
      setIsAiGenerated(false)
      setIsReadyToSell(false)
      setPrice('')
      setCategory('Couture')
      setShowUpload(false)
      
      // Refresh Stream
      fetchDesigns()
    } catch (err) {
      console.error('Error uploading design:', err)
      setFormError(err.response?.data?.detail || 'Failed to publish design.')
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '120px' }}>
      <Navbar />
      
      <div className="container" style={{ paddingTop: '120px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '3rem', color: 'white' }}>Design Hub</h1>
            <p style={{ color: 'var(--text-dim)' }}>Share your creativity. AI-generated or hand-crafted, all are welcome.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setShowUpload(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Upload size={20} /> Upload Design
          </button>
        </div>

        <div className="glass-card" style={{ padding: '20px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Info size={24} color="var(--primary)" />
          <p style={{ color: 'var(--text-dim)' }}>Designs with the most <strong>Likes</strong> are featured on the home page and help us identify upcoming fashion trends.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw className="floating" size={40} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '15px' }} />
            <p style={{ color: 'var(--text-dim)' }}>Loading real collections...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(234,67,53,0.05)', border: '1px dashed rgba(234,67,53,0.2)', borderRadius: '20px' }}>
            <p style={{ color: '#EA4335' }}>{error}</p>
          </div>
        ) : designs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
            <p style={{ color: 'var(--text-dim)' }}>No designs registered yet. Be the first to upload!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
            {designs.map(design => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  position: 'relative',
                  transition: 'transform 0.25s, box-shadow 0.25s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 18px 48px rgba(0,0,0,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
              >
                {/* Image */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <img src={design.image_url} alt={design.title} style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
                  {/* Type badge */}
                  <span style={{
                    position: 'absolute', top: '14px', left: '14px',
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '5px 13px', borderRadius: '20px',
                    fontSize: '0.75rem', color: 'white', fontWeight: '700', letterSpacing: '0.5px'
                  }}>
                    {design.is_ai_generated ? '✨ AI Silhouette' : '🧵 Couture'}
                  </span>
                  {/* Price badge */}
                  {design.is_ready_to_sell && (
                    <span style={{
                      position: 'absolute', top: '14px', right: '14px',
                      background: 'var(--primary)', color: 'black',
                      padding: '5px 13px', borderRadius: '20px',
                      fontSize: '0.8rem', fontWeight: '800'
                    }}>
                      ${design.price?.toFixed(2)}
                    </span>
                  )}
                  {/* Delete button - owner only */}
                  {currentUser && currentUser.id === design.creator_id && (
                    <button
                      onClick={() => handleDelete(design)}
                      disabled={deletingId === design.id}
                      title="Delete this post"
                      style={{
                        position: 'absolute', bottom: '14px', right: '14px',
                        background: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white', borderRadius: '50%',
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                        opacity: deletingId === design.id ? 0.6 : 1
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.85)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '20px 22px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'white', fontWeight: '700', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {design.title}
                  </h3>
                  <Link to={`/profile/${design.creator_username}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
                    @{design.creator_username}
                  </Link>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', marginTop: '10px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {design.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Heart size={17} fill="var(--primary)" color="var(--primary)" />
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: '0.9rem' }}>{design.likes}</span>
                    </div>
                    <Link to={`/profile/${design.creator_username}`}>
                      <button style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.75)',
                        padding: '6px 16px', borderRadius: '20px',
                        fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                      >
                        View Profile
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Glassmorphic Upload Modal */}
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

              <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="var(--primary)" /> Publish Creation
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '25px' }}>Upload your exclusive hand-crafted atelier files or AI generated styles.</p>

              {formError && (
                <div style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)', padding: '12px', borderRadius: '10px', color: '#EA4335', fontSize: '0.9rem', marginBottom: '20px' }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cyberpunk Trenchcoat" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Atelier Description</label>
                  <textarea 
                    placeholder="Describe the fabric, cut, and creative thought process..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    style={{ width: '100%', height: '80px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none', resize: 'none' }}
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Collection Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cyber-Streetwear, Evening Gowns, Summer Blend" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Type</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      type="button" 
                      onClick={() => setIsAiGenerated(false)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid', borderColor: !isAiGenerated ? 'var(--primary)' : 'var(--glass-border)', background: !isAiGenerated ? 'rgba(184,150,62,0.08)' : 'transparent', color: 'white', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
                    >
                      🧵 Hand-crafted Couture
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAiGenerated(true)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid', borderColor: isAiGenerated ? 'var(--primary)' : 'var(--glass-border)', background: isAiGenerated ? 'rgba(184,150,62,0.08)' : 'transparent', color: 'white', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
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
                        checked={isReadyToSell} 
                        onChange={(e) => setIsReadyToSell(e.target.checked)} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: isReadyToSell ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        transition: '.3s', borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px',
                          left: isReadyToSell ? '24px' : '3px', bottom: '3px',
                          backgroundColor: isReadyToSell ? 'black' : 'white',
                          transition: '.3s', borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>

                {isReadyToSell && (
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
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                      required={isReadyToSell}
                    />
                  </motion.div>
                )}

                {/* Computer Upload Area */}
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Artwork</label>
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

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Design Artwork URL</label>
                  <input 
                    type="url" 
                    placeholder="Paste a luxury image link..." 
                    value={imageUrl.startsWith('data:') ? 'Local Image Loaded (Base64)' : imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none', marginBottom: '12px' }}
                    required={!imageUrl} 
                    disabled={imageUrl.startsWith('data:')}
                  />
                  {imageUrl.startsWith('data:') && (
                    <button 
                      type="button" 
                      onClick={() => setImageUrl('')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'block', marginTop: '-6px', marginBottom: '10px', fontWeight: 600 }}
                    >
                      Clear Local Image to Paste URL
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="auth-btn-luxury auth-btn-phone" 
                  disabled={uploadLoading}
                  style={{ background: 'white', color: 'black', width: '100%', padding: '14px', borderRadius: '30px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                  {uploadLoading ? 'Uploading creation...' : 'Publish in Gallery Hub'}
                  {!uploadLoading && <Wand2 size={16} />}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}

export default Gallery
