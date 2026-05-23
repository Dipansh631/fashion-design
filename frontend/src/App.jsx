import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import Auth from './components/Auth'
import BottomNav from './components/BottomNav'
import { Heart, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('vogue_user')
    return stored ? JSON.parse(stored) : null
  })

  const [trendingDesigns, setTrendingDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Social & Feed States
  const [feedDesigns, setFeedDesigns] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [activeComments, setActiveComments] = useState({})
  const [expandedComments, setExpandedComments] = useState(new Set())
  const [commentInputs, setCommentInputs] = useState({})
  const [shareTooltip, setShareTooltip] = useState(null)

  const API_BASE = 'http://localhost:8000'

  const slides = [
    {
      id: 1,
      title: "EXCLUSIVE ATELIER BLENDS",
      subtitle: "25% OFF ACTIVE DEALS",
      description: "Source premium cashmere, technical silk, and organic cotton for your commercial runs.",
      image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1200&auto=format&fit=crop",
      badge: "ACTIVE DEAL"
    },
    {
      id: 2,
      title: "DIGITAL COUTURE SUITE",
      subtitle: "MAXIMIZE PRODUCTIVITY",
      description: "Harness next-generation AI-assisted silhouette generation to create and catalog patterns instantly.",
      image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop",
      badge: "PRODUCTIVITY HUB"
    },
    {
      id: 3,
      title: "CYBER-KIMONO LIMITED DROP",
      subtitle: "PRE-ORDER DEALS ACTIVE",
      description: "Secure high-performance modular outerwear designed by @NeoTokyo with direct wholesale pricing.",
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
      badge: "EXCLUSIVE DROP"
    }
  ]

  const fetchHomeData = async () => {
    setLoading(true)
    try {
      const trendingRes = await axios.get(`${API_BASE}/trending-designs`)
      setTrendingDesigns(trendingRes.data)

      // Fetch customized instagram feed
      const feedRes = await axios.get(`${API_BASE}/users/${user.username}/feed`)
      setFeedDesigns(feedRes.data)

      // Fetch leaderboard
      const leadRes = await axios.get(`${API_BASE}/users/leaderboard`)
      setLeaderboard(leadRes.data)

      // Fetch active following list
      const followRes = await axios.get(`${API_BASE}/users/${user.username}/following`)
      setFollowingList(followRes.data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchHomeData()
  }, [user])

  useEffect(() => {
    if (!user) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [user])

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_BASE}/designs/${postId}/like`)
      setFeedDesigns(prev => prev.map(d => d.id === postId ? { ...d, likes: d.likes + 1 } : d))
      setTrendingDesigns(prev => prev.map(d => d.id === postId ? { ...d, likes: d.likes + 1 } : d))
    } catch (e) {
      console.error(e)
    }
  }

  const toggleComments = async (postId) => {
    const nextExpanded = new Set(expandedComments)
    if (nextExpanded.has(postId)) {
      nextExpanded.delete(postId)
    } else {
      nextExpanded.add(postId)
      try {
        const res = await axios.get(`${API_BASE}/designs/${postId}/comments`)
        setActiveComments(prev => ({ ...prev, [postId]: res.data }))
      } catch (e) {
        console.error(e)
      }
    }
    setExpandedComments(nextExpanded)
  }

  const submitComment = async (postId) => {
    const commentText = commentInputs[postId] || ''
    if (!commentText.trim()) return

    try {
      const res = await axios.post(`${API_BASE}/designs/${postId}/comments`, {
        username: user.username,
        text: commentText.trim()
      })
      setActiveComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data]
      }))
      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
    } catch (e) {
      console.error(e)
    }
  }

  const handleFollowFromHome = async (designerUsername) => {
    try {
      const res = await axios.post(`${API_BASE}/users/${designerUsername}/follow`, {
        follower_username: user.username
      })
      
      if (res.data.action === 'followed') {
        setFollowingList(prev => [...prev, designerUsername])
      } else {
        setFollowingList(prev => prev.filter(u => u !== designerUsername))
      }
      
      const feedRes = await axios.get(`${API_BASE}/users/${user.username}/feed`)
      setFeedDesigns(feedRes.data)
      
      const leadRes = await axios.get(`${API_BASE}/users/leaderboard`)
      setLeaderboard(leadRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleShare = (designerUsername, postId) => {
    const directLink = `${window.location.origin}/profile/${designerUsername}`
    navigator.clipboard.writeText(directLink).then(() => {
      setShareTooltip(postId)
      setTimeout(() => {
        setShareTooltip(null)
      }, 2000)
    })
  }

  if (!user) {
    return <Auth onLoginSuccess={(u) => setUser(u)} />
  }

  return (
    <div className="app" style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingBottom: '120px' }}>
      <Navbar user={user} />

      {/* Interactive Photo Carousel Hero */}
      <section className="container" style={{ paddingTop: '120px', paddingBottom: '40px' }}>
        <div style={{ marginBottom: '30px' }}>
          <p style={{
            fontSize: '1rem',
            color: 'var(--primary)',
            fontWeight: '600',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: '5px'
          }}>
            Welcome to Fassicana
          </p>
          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: '800',
            color: 'var(--text-main)',
            fontFamily: 'Playfair Display, serif',
            letterSpacing: '1px'
          }}>
            Hot Deals & News
          </h1>
        </div>

        <div style={{
          position: 'relative',
          height: '520px',
          borderRadius: '30px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, rgba(0, 0, 0, 0.9) 35%, rgba(0, 0, 0, 0.4) 65%, transparent 100%), url(${slides[currentSlide].image}) center/cover`,
                display: 'flex',
                alignItems: 'center',
                padding: '60px'
              }}
            >
              <div style={{ maxWidth: '550px', zIndex: 2 }}>
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    display: 'inline-block',
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    letterSpacing: '1px',
                    marginBottom: '20px'
                  }}
                >
                  {slides[currentSlide].badge}
                </motion.span>
                
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    color: 'white',
                    lineHeight: '1.2',
                    marginBottom: '10px',
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  {slides[currentSlide].title}
                </motion.h1>

                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontSize: '1.5rem',
                    color: 'var(--primary)',
                    fontWeight: '600',
                    marginBottom: '20px'
                  }}
                >
                  {slides[currentSlide].subtitle}
                </motion.h2>

                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    fontSize: '1.1rem',
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: '1.6'
                  }}
                >
                  {slides[currentSlide].description}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Left Arrow */}
          <button 
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            style={{
              position: 'absolute',
              left: '25px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              backdropFilter: 'blur(5px)',
              transition: 'background 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            ❮
          </button>

          {/* Right Arrow */}
          <button 
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            style={{
              position: 'absolute',
              right: '25px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              backdropFilter: 'blur(5px)',
              transition: 'background 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            ❯
          </button>

          {/* Dots Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            zIndex: 3
          }}>
            {slides.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? '30px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: currentSlide === idx ? 'var(--primary)' : 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="container" style={{ padding: '60px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <p style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '6px' }}>Most Loved</p>
            <h2 style={{ fontSize: '2.8rem', color: 'white', fontFamily: 'Playfair Display, serif', margin: 0 }}>Trending Designs</h2>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '4px' }}>Our community's most-liked creations</p>
        </div>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--primary), transparent)', marginBottom: '40px', borderRadius: '2px' }} />
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RefreshCw className="floating" size={35} color="var(--primary)" style={{ animation: 'spin 2s linear infinite' }} />
          </div>
        ) : trendingDesigns.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>No designs in the trending list yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
            {trendingDesigns.map((design, idx) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                style={{
                  borderRadius: '22px',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)'; }}
              >
                {/* Image with overlays */}
                <div style={{ position: 'relative', overflow: 'hidden', height: '340px' }}>
                  <img
                    src={design.image_url}
                    alt={design.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                  {/* Rank badge */}
                  <div style={{
                    position: 'absolute', top: '15px', left: '15px',
                    background: idx === 0 ? 'linear-gradient(135deg, #d4af37, #f5e17a)' : idx === 1 ? 'linear-gradient(135deg, #a8a8a8, #e0e0e0)' : idx === 2 ? 'linear-gradient(135deg, #cd7f32, #e5a55a)' : 'rgba(0,0,0,0.6)',
                    color: idx < 3 ? 'black' : 'white',
                    backdropFilter: idx >= 3 ? 'blur(8px)' : 'none',
                    border: idx >= 3 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: '0.85rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}>
                    #{idx + 1}
                  </div>
                  {/* Type badge */}
                  <span style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '5px 12px', borderRadius: '20px',
                    fontSize: '0.72rem', color: 'white', fontWeight: '700'
                  }}>
                    {design.is_ai_generated ? '✨ AI' : '🧵 Couture'}
                  </span>
                  {/* Likes overlay bottom */}
                  <div style={{
                    position: 'absolute', bottom: '15px', right: '15px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '5px 12px', borderRadius: '20px'
                  }}>
                    <Heart size={14} fill="var(--primary)" color="var(--primary)" />
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '0.82rem' }}>{design.likes.toLocaleString()}</span>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '20px 22px 22px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'white', fontFamily: 'Playfair Display, serif', fontWeight: '700', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {design.title}
                  </h3>
                  <Link to={`/profile/${design.creator_username}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
                    @{design.creator_username}
                  </Link>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleLike(design.id)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                        background: 'rgba(184,150,62,0.12)', border: '1px solid rgba(184,150,62,0.3)',
                        color: 'var(--primary)', padding: '9px', borderRadius: '30px',
                        fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'black'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,150,62,0.12)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    >
                      <Heart size={15} fill="currentColor" /> Like
                    </button>
                    <Link to={`/profile/${design.creator_username}`} style={{ flex: 1 }}>
                      <button style={{
                        width: '100%', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.8)', padding: '9px', borderRadius: '30px',
                        fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
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
      </section>

      {/* Famous Designers Leaderboard Section */}
      <section className="container" style={{ padding: '60px 20px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '50px', marginBottom: '10px' }}>
          <p style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '6px' }}>Leaderboard</p>
          <h2 style={{ fontSize: '2.8rem', color: 'white', fontFamily: 'Playfair Display, serif', margin: 0 }}>👑 Famous Artisans</h2>
        </div>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #d4af37, transparent)', marginBottom: '14px', borderRadius: '2px' }} />
        <p style={{ color: 'var(--text-dim)', marginBottom: '40px', fontSize: '0.95rem' }}>Ranked by verified follows & monthly profile views.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RefreshCw className="floating" size={35} color="var(--primary)" style={{ animation: 'spin 2s linear infinite' }} />
          </div>
        ) : leaderboard.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>No famous designers registered in database yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {leaderboard.map((art, idx) => {
              const isF = followingList.includes(art.username);
              const rankColors = ['#d4af37', '#c0c0c0', '#cd7f32'];
              const rankColor = rankColors[idx] || 'rgba(255,255,255,0.15)';
              const isTop3 = idx < 3;
              return (
                <motion.div
                  key={art.username}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.07 }}
                  style={{
                    borderRadius: '24px',
                    padding: '28px 22px 22px',
                    position: 'relative',
                    background: isTop3
                      ? `linear-gradient(145deg, rgba(15,15,15,0.95), rgba(25,20,10,0.9))`
                      : 'rgba(255,255,255,0.04)',
                    border: isTop3 ? `1.5px solid ${rankColor}` : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isTop3 ? `0 0 30px ${rankColor}25, 0 12px 40px rgba(0,0,0,0.5)` : '0 8px 30px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 0.25s, box-shadow 0.25s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Rank badge */}
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: isTop3 ? `linear-gradient(135deg, ${rankColor}, ${rankColor}cc)` : 'rgba(30,30,30,0.9)',
                    color: isTop3 ? 'black' : 'rgba(255,255,255,0.6)',
                    border: isTop3 ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    padding: '4px 14px', borderRadius: '20px',
                    fontSize: '0.78rem', fontWeight: '900',
                    boxShadow: isTop3 ? `0 4px 15px ${rankColor}60` : 'none',
                    whiteSpace: 'nowrap'
                  }}>
                    {idx === 0 ? '🥇 #1 Top Designer' : idx === 1 ? '🥈 #2 Rising Star' : idx === 2 ? '🥉 #3 Contender' : `#${idx + 1}`}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: isTop3 ? `linear-gradient(135deg, ${rankColor}, white)` : 'var(--gradient)',
                    padding: '3px', marginTop: '12px', marginBottom: '16px',
                    boxShadow: isTop3 ? `0 0 20px ${rankColor}50` : '0 4px 15px rgba(0,0,0,0.4)'
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: `url(${art.profile_pic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${art.username}`}) center/cover`,
                      border: '3px solid rgba(0,0,0,0.8)'
                    }} />
                  </div>

                  {/* Name */}
                  <div style={{ textAlign: 'center', width: '100%', marginBottom: '6px' }}>
                    <Link
                      to={`/profile/${art.username}`}
                      style={{ color: 'white', textDecoration: 'none', fontWeight: '800', fontSize: '1.1rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={`@${art.username}`}
                    >
                      @{art.username}
                    </Link>
                    {art.is_verified_business && (
                      <span style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: '700', display: 'block', marginTop: '2px' }}>✓ Verified Partner</span>
                    )}
                  </div>

                  {/* Bio */}
                  <p style={{
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', textAlign: 'center',
                    lineHeight: '1.5', marginBottom: '18px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {art.bio || 'Fashion Enthusiast & Creator'}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'flex', width: '100%',
                    background: 'rgba(255,255,255,0.04)', borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden', marginBottom: '16px'
                  }}>
                    <div style={{ flex: 1, padding: '12px 10px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)' }}>{art.followers_count}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Followers</span>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1, padding: '12px 10px', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>{art.profile_views}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Views</span>
                    </div>
                  </div>

                  {/* Follow button */}
                  {user.username !== art.username && (
                    <button
                      onClick={() => handleFollowFromHome(art.username)}
                      style={{
                        width: '100%',
                        background: isF ? 'rgba(184,150,62,0.1)' : 'var(--primary)',
                        color: isF ? 'var(--primary)' : 'black',
                        border: isF ? '1px solid var(--primary)' : 'none',
                        fontWeight: '700', padding: '11px',
                        borderRadius: '30px', cursor: 'pointer',
                        fontSize: '0.9rem', transition: 'all 0.2s'
                      }}
                    >
                      {isF ? '✓ Following' : '+ Follow'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dynamic Instagram-style customized feed */}
      <section style={{ padding: '40px 20px 60px', maxWidth: '660px', margin: '0 auto' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '50px', marginBottom: '10px', textAlign: 'center' }}>
          <p style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '6px' }}>Personalized</p>
          <h2 style={{ fontSize: '2.5rem', color: 'white', fontFamily: 'Playfair Display, serif', margin: 0 }}>✨ Your Atelier Feed</h2>
        </div>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', marginBottom: '14px', borderRadius: '2px' }} />
        <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: '40px' }}>Custom stream compiled dynamically from followed fashion creators.</p>

        {feedDesigns.length === 0 ? (
          <div style={{
            padding: '50px 30px', textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '24px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧵</div>
            <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: 600, marginBottom: '10px' }}>Your Fashion Feed is Empty</p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '25px' }}>Follow certified independent designers from the leaderboard above to build your custom stream.</p>
            <div style={{ background: 'rgba(184, 150, 62, 0.08)', border: '1px solid rgba(184, 150, 62, 0.2)', padding: '14px 20px', borderRadius: '15px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>Click "+ Follow" on designers above!</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {feedDesigns.map(post => {
              const isCommentsOpen = expandedComments.has(post.id);
              const postComments = activeComments[post.id] || [];
              const commentText = commentInputs[post.id] || '';
              
              return (
                <div key={post.id} style={{
                  borderRadius: '24px', overflow: 'hidden',
                  background: 'rgba(15,15,15,0.8)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 12px 50px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)'
                }}>
                  
                  {/* Creator header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--gradient)', padding: '2.5px', flexShrink: 0 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `url(https://api.dicebear.com/7.x/adventurer/svg?seed=${post.creator_username}) center/cover`, border: '2px solid rgba(0,0,0,0.8)' }}></div>
                      </div>
                      <div>
                        <Link to={`/profile/${post.creator_username}`} style={{ color: 'white', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', display: 'block' }}>
                          @{post.creator_username}
                        </Link>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {post.category || 'Couture'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowFromHome(post.creator_username)}
                      style={{
                        background: followingList.includes(post.creator_username) ? 'rgba(184,150,62,0.1)' : 'var(--primary)',
                        color: followingList.includes(post.creator_username) ? 'var(--primary)' : 'black',
                        border: followingList.includes(post.creator_username) ? '1px solid var(--primary)' : 'none',
                        padding: '7px 18px', borderRadius: '20px',
                        fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {followingList.includes(post.creator_username) ? '✓ Following' : '+ Follow'}
                    </button>
                  </div>

                  {/* Post image */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    {post.is_ready_to_sell && (
                      <div style={{
                        position: 'absolute', top: '14px', left: '14px', zIndex: 2,
                        background: 'var(--primary)', color: 'black',
                        padding: '5px 13px', borderRadius: '20px',
                        fontSize: '0.82rem', fontWeight: '800',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                      }}>
                        ${post.price?.toFixed(2)}
                      </div>
                    )}
                    <img
                      src={post.image_url}
                      alt={post.title}
                      style={{ width: '100%', maxHeight: '520px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>

                  {/* Actions + content */}
                  <div style={{ padding: '18px 20px 20px' }}>
                    {/* Action bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                        <div
                          onClick={() => handleLike(post.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
                          title="Like"
                        >
                          <Heart size={22} color="var(--primary)" fill="var(--primary)" style={{ filter: 'drop-shadow(0 0 6px rgba(184,150,62,0.6))' }} />
                          <strong style={{ fontSize: '0.95rem', color: 'white' }}>{post.likes}</strong>
                        </div>
                        <div
                          onClick={() => toggleComments(post.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: isCommentsOpen ? 'var(--primary)' : 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }}
                          title="Comments"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{isCommentsOpen ? 'Hide' : 'Comment'}</span>
                        </div>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => handleShare(post.creator_username, post.id)}
                          style={{
                            background: 'none', border: 'none',
                            color: shareTooltip === post.id ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '0.85rem', fontWeight: '600', transition: 'color 0.2s'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          Share
                        </button>
                        {shareTooltip === post.id && (
                          <div style={{
                            position: 'absolute', bottom: '30px', right: '0',
                            background: 'var(--primary)', color: 'black',
                            padding: '4px 12px', borderRadius: '10px',
                            fontSize: '0.75rem', fontWeight: '800',
                            whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}>
                            ✓ Link Copied!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & description */}
                    <h4 style={{ color: 'white', fontSize: '1.1rem', fontFamily: 'Playfair Display, serif', marginBottom: '5px', fontWeight: '700' }}>
                      {post.title}
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: '1.55', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.description}
                    </p>

                    {/* Comments section */}
                    {isCommentsOpen && (
                      <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', maxHeight: '180px', overflowY: 'auto' }}>
                          {postComments.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', textAlign: 'center', padding: '10px 0' }}>No comments yet — be the first!</p>
                          ) : (
                            postComments.map(c => (
                              <div key={c.id} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '9px 13px', borderRadius: '12px'
                              }}>
                                <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.82rem' }}>@{c.username}: </span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>{c.text}</span>
                              </div>
                            ))
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            style={{
                              flex: 1, padding: '10px 16px',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '20px', color: 'white',
                              fontSize: '0.85rem', outline: 'none'
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') submitComment(post.id); }}
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            style={{
                              background: 'var(--primary)', color: 'black',
                              border: 'none', padding: '0 18px',
                              borderRadius: '20px', fontSize: '0.85rem',
                              fontWeight: '700', cursor: 'pointer'
                            }}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
        <p style={{ color: 'var(--text-dim)' }}>© 2026 FASSICANA. All rights reserved.</p>
      </footer>
      <BottomNav />
    </div>
  )
}

export default App
