import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, ShoppingBag, Briefcase, User } from 'lucide-react'
import { motion } from 'framer-motion'

const BottomNav = () => {
  const location = useLocation()
  const path = location.pathname
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('vogue_user')
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing stored user', e)
      }
    }
  }, [location.pathname]) // Re-run when navigation happens

  // If not logged in, do not render bottom navigation
  if (!currentUser) return null

  const navItems = [
    { name: 'Home', icon: Home, route: '/' },
    { name: 'Gallery', icon: Compass, route: '/gallery' },
    { name: 'Market', icon: ShoppingBag, route: '/market' },
    { name: 'Business', icon: Briefcase, route: '/business' },
    { name: 'Profile', icon: User, route: `/profile/${currentUser.username}` }
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          background: 'rgba(15, 15, 15, 0.85)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          pointerEvents: 'auto'
        }}
      >
        {navItems.map((item, idx) => {
          const isActive = path === item.route
          const Icon = item.icon
          
          return (
            <Link 
              key={idx}
              to={item.route}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  borderRadius: '30px',
                  color: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.55)',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  position: 'relative',
                  minWidth: '70px'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(184, 150, 62, 0.08)',
                      borderRadius: '30px',
                      border: '1px solid rgba(184, 150, 62, 0.25)',
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={20} style={{ marginBottom: '2px' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                  {item.name}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </motion.div>
    </div>
  )
}

export default BottomNav
