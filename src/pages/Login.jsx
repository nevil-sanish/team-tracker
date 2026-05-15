import React from 'react';
import { loginWithGoogle } from '../lib/firebase';
import { Users, ArrowRight, CheckCircle, Shield } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      // Only log in development to prevent leaking auth details in production
      if (import.meta.env.DEV) console.error('Login failed', err);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08), transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }} />

      <div className="animate-slide-up" style={{
        textAlign: 'center',
        maxWidth: 420,
        width: '100%',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3)',
        }}>
          <Users size={30} style={{ color: 'white' }} />
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          Team Tracker
        </h1>

        <p style={{
          fontSize: 14,
          color: 'var(--color-text-muted)',
          marginBottom: 32,
          lineHeight: 1.5,
        }}>
          Collaborate, organize, and track everything<br />with your team in one place.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {[
            'Calendar, Tasks & Notes — all synced',
            'Real-time group chat & collaboration',
            'Team analytics & activity feed',
          ].map((feature, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}>
              <CheckCircle size={15} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px 24px',
            fontSize: 14,
            fontWeight: 700,
            color: 'white',
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(249, 115, 22, 0.4)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.3)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
          <ArrowRight size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          <Shield size={12} style={{ color: 'var(--color-text-disabled)' }} />
          <p style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>
            Secured with Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
