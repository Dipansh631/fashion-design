import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingBag, User as UserIcon, Bell, X, Sparkles, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = ({ user }) => {
  const [activeUser, setActiveUser] = useState(user || null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "✨ Cyberpunk Kimono Drop",
      message: "@NeoTokyo just published the Cyberpunk Kimono to the Gallery Hub.",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      title: "🧵 Wholesale Fabric Deal",
      message: "Atelier Deals: 25% Off Premium technical cashmere and organic fabrics active.",
      time: "5 hours ago",
      unread: true
    },
    {
      id: 3,
      title: "👑 Atelier Security Sync",
      message: "Your secure cryptographic Supabase session is successfully established.",
      time: "1 day ago",
      unread: false
    }
  ])

  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('vogue_user')
      if (stored) {
        try {
          setActiveUser(JSON.parse(stored))
        } catch (e) {
          console.error('Error parsing stored user in Navbar', e)
        }
      }
    } else {
      setActiveUser(user)
    }
  }, [user])

  // Close notifications on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const unreadCount = notifications.filter(n => n.unread).length

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      // Mark all as read when opening
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    }
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'flex-end', 
      alignItems: 'center', 
      padding: '20px 40px',
      position: 'fixed',
      width: '100%',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{ display: 'flex', gap: '25px', alignItems: 'center', color: 'white', position: 'relative' }}>
        <Search size={20} cursor="pointer" style={{ opacity: 0.8, transition: 'opacity 0.2s' }} />
        
        {/* Notification Bell */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Bell 
            size={20} 
            cursor="pointer" 
            onClick={handleToggleNotifications}
            style={{ 
              opacity: showNotifications ? 1 : 0.8, 
              color: showNotifications ? 'var(--primary)' : 'white',
              transition: 'all 0.2s' 
            }} 
          />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 10px var(--primary)'
            }} />
          )}
        </div>

        <ShoppingBag size={20} cursor="pointer" style={{ opacity: 0.8, transition: 'opacity 0.2s' }} />
        
        {activeUser ? (
          <button 
            onClick={async () => {
              try {
                await supabase.auth.signOut();
              } catch (err) {
                console.error('Error signing out of Supabase:', err);
              }
              localStorage.removeItem('vogue_user');
              window.location.reload();
            }}
            style={{
              background: 'rgba(234, 67, 53, 0.1)', border: '1px solid rgba(234, 67, 53, 0.2)', 
              color: '#EA4335', padding: '8px 18px', borderRadius: '30px', cursor: 'pointer', 
              fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s', letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(234, 67, 53, 0.2)'; e.target.style.transform = 'scale(1.02)' }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(234, 67, 53, 0.1)'; e.target.style.transform = 'scale(1)' }}
          >
            Logout
          </button>
        ) : (
          <UserIcon size={20} cursor="pointer" style={{ opacity: 0.8 }} />
        )}

        {/* Dropdown Notification panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                width: '360px',
                background: 'rgba(15, 15, 15, 0.95)',
                backdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                padding: '24px',
                zIndex: 10000,
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--primary)" /> Notifications
                </h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#EA4335'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)' }}>
                    <AlertCircle size={32} style={{ marginBottom: '10px', opacity: 0.5, margin: '0 auto' }} />
                    <p style={{ fontSize: '0.85rem' }}>All caught up! No active alerts.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                    >
                      <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                        {notif.title}
                      </h4>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '6px' }}>
                        {notif.message}
                      </p>
                      <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 600 }}>
                        {notif.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar
