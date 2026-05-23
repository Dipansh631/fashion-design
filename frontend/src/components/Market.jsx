import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { ShoppingBag, RefreshCw, AlertCircle, Heart, Tag, Sparkles, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

const Market = () => {
  const [marketDesigns, setMarketDesigns] = useState([])
  const [inStockItems, setInStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [currentUser, setCurrentUser] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const API_BASE = 'http://localhost:8000'

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

  const fetchMarketData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch designer items ready to sell
      const designsRes = await axios.get(`${API_BASE}/designs/market`)
      setMarketDesigns(designsRes.data)

      // 2. Fetch standard in-stock wholesale items
      const stockRes = await axios.get(`${API_BASE}/in-stock-items`)
      setInStockItems(stockRes.data)
    } catch (err) {
      console.error('Error fetching market items:', err)
      setError('Could not load marketplace creations. Verify backend is active.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
  }, [])

  const handleDelete = async (design) => {
    if (!currentUser || currentUser.id !== design.creator_id) return
    if (!window.confirm(`Delete "${design.title}" from the Marketplace? This cannot be undone.`)) return
    setDeletingId(design.id)
    try {
      await axios.delete(`http://localhost:8000/designs/${design.id}?requester_id=${currentUser.id}`)
      setMarketDesigns(prev => prev.filter(d => d.id !== design.id))
    } catch (err) {
      console.error('Delete failed:', err)
      alert(err.response?.data?.detail || 'Could not delete design.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '120px' }}>
      <Navbar user={currentUser} />

      <div className="container" style={{ paddingTop: '120px' }}>
        {/* Market Title Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '45px' }}>
          <div>
            <h1 style={{ fontSize: '3rem', color: 'white', fontFamily: 'Playfair Display, serif' }}>Atelier Marketplace</h1>
            <p style={{ color: 'var(--text-dim)', marginTop: '5px' }}>Shop exclusive couture and purchase directly from certified independent fashion designers.</p>
          </div>
          <div style={{ background: 'rgba(184, 150, 62, 0.08)', border: '1px solid rgba(184, 150, 62, 0.2)', padding: '10px 20px', borderRadius: '25px', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <Sparkles size={16} /> DIRECT FROM CREATORS
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <RefreshCw className="floating" size={40} color="var(--primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '15px' }} />
            <p style={{ color: 'var(--text-dim)', letterSpacing: '1px' }}>Loading luxury catalog...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(234,67,53,0.05)', border: '1px dashed rgba(234,67,53,0.2)', borderRadius: '20px' }}>
            <AlertCircle size={40} color="#EA4335" style={{ margin: '0 auto 15px auto' }} />
            <p style={{ color: '#EA4335' }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Designer Creations Listed for Sale */}
            <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Playfair Display, serif' }}>
              🧵 Designer Couture Listings
            </h2>

            {marketDesigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px', marginBottom: '60px' }}>
                <p style={{ color: 'var(--text-dim)' }}>No designer items currently listed for sale. Be the first to list a creation!</p>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px', marginBottom: '60px' }}>
                {marketDesigns.map(design => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      borderRadius: '20px', overflow: 'hidden',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      position: 'relative',
                      transition: 'transform 0.25s, box-shadow 0.25s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 18px 48px rgba(0,0,0,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                  >
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img src={design.image_url} alt={design.title}
                        style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {/* Gradient overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
                      {/* Price badge */}
                      <span style={{
                        position: 'absolute', top: '14px', left: '14px',
                        background: 'var(--primary)', color: 'black',
                        padding: '5px 13px', borderRadius: '20px',
                        fontSize: '0.82rem', fontWeight: '800',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        boxShadow: '0 4px 15px rgba(184,150,62,0.4)'
                      }}>
                        <Tag size={13} /> ${design.price?.toFixed(2)}
                      </span>
                      {/* Type badge */}
                      <span style={{
                        position: 'absolute', top: '14px', right: '14px',
                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '5px 13px', borderRadius: '20px',
                        fontSize: '0.72rem', color: 'white', fontWeight: '700'
                      }}>
                        {design.is_ai_generated ? '✨ AI' : '🧵 Couture'}
                      </span>
                      {/* Delete button - owner only */}
                      {currentUser && currentUser.id === design.creator_id && (
                        <button
                          onClick={() => handleDelete(design)}
                          disabled={deletingId === design.id}
                          title="Remove from marketplace"
                          style={{
                            position: 'absolute', bottom: '14px', right: '14px',
                            background: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', borderRadius: '50%',
                            width: '36px', height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            opacity: deletingId === design.id ? 0.5 : 1
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.85)'}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div style={{ padding: '20px 22px' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'white', fontFamily: 'Playfair Display, serif', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {design.title}
                      </h3>
                      <Link to={`/profile/${design.creator_username}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
                        @{design.creator_username}
                      </Link>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.87rem', marginTop: '10px', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {design.description}
                      </p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button
                          onClick={() => alert(`Added "${design.title}" to cart!`)}
                          className="btn-primary"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 15px' }}
                        >
                          <ShoppingBag size={16} /> Buy Now
                        </button>
                        <button
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onClick={() => alert('Liked!')}
                        >
                          <Heart size={18} fill="var(--primary)" color="var(--primary)" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Curated Wholesale Boutique Partners Section */}
            <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Playfair Display, serif', borderTop: '1px solid var(--glass-border)', paddingTop: '50px' }}>
              🏢 Wholesale Store Stock
            </h2>

            {inStockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px' }}>
                <p style={{ color: 'var(--text-dim)' }}>Wholesale items are currently out of stock.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {inStockItems.map(item => (
                  <motion.div 
                    key={item.id} 
                    className="glass-card" 
                    whileHover={{ y: -8 }}
                    style={{ overflow: 'hidden', position: 'relative' }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: '15px', 
                      left: '15px', 
                      background: 'rgba(0,0,0,0.7)', 
                      backdropFilter: 'blur(5px)',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      border: '1px solid rgba(255,255,255,0.1)',
                      zIndex: 2
                    }}>
                      {item.category}
                    </div>

                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
                    
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '1.3rem', color: 'white' }}>{item.name}</h3>
                      <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.4rem', margin: '8px 0 20px 0' }}>
                        ${item.price.toFixed(2)}
                      </p>

                      <button 
                        onClick={() => alert(`Added "${item.name}" to cart!`)}
                        className="btn-primary" 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <ShoppingBag size={18} /> Buy Wholesale
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default Market
