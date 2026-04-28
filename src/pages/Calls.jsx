import React, { useState } from 'react';
import { Phone, Video, Mic, MicOff, Camera, CameraOff, Monitor, MessageSquare, PhoneOff, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative } from '../lib/utils';
import Avatar from '../components/Avatar';

export default function Calls() {
  const { mode, group, calls, user } = useStore();
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState('voice');
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {!inCall ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          {/* Start Call Section */}
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Phone size={32} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              {mode === 'personal' ? 'Personal Calls' : 'Team Calls'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Start a voice or video call{mode === 'group' ? ' with your team' : ''}.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
              <button className="btn btn-primary" style={{ gap: 8, padding: '12px 28px' }} onClick={() => { setCallType('voice'); setInCall(true); }}>
                <Phone size={18} /> Voice Call
              </button>
              <button className="btn btn-secondary" style={{ gap: 8, padding: '12px 28px' }} onClick={() => { setCallType('video'); setInCall(true); }}>
                <Video size={18} /> Video Call
              </button>
            </div>
          </div>

          {/* Call History */}
          <div style={{ width: '100%', maxWidth: 600, marginTop: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', marginBottom: 12, paddingLeft: 4 }}>
              Call History
            </h3>
            <div className="card-flat" style={{ overflow: 'hidden' }}>
              {calls.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>
                  No call history yet.
                </div>
              ) : (
                calls.map((c, i) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderBottom: i < calls.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                    transition: 'background 0.15s',
                  }} className="hover:bg-[var(--color-bg-hover)]">
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: c.kind === 'video' ? 'var(--color-info-soft)' : 'var(--color-success-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {c.kind === 'video' ? <Video size={16} style={{ color: 'var(--color-info)' }} /> : <Phone size={16} style={{ color: 'var(--color-success)' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {c.durationMinutes}min · {c.participants?.length || 0} participants
                      </p>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
                      {formatRelative(c.startedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* In-Call View */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
          {/* Video/Audio Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {callType === 'video' ? (
              <div style={{
                width: '80%', maxWidth: 720, aspectRatio: '16/9', borderRadius: 16,
                background: 'linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-elevated))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--color-border-default)',
              }}>
                <Avatar name={user?.name} avatar={user?.avatar} size="lg" />
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Avatar name={user?.name} avatar={user?.avatar} size="lg" />
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 12 }}>{user?.name}</p>
                <p style={{ fontSize: 12, color: 'var(--color-success)' }} className="animate-pulse-soft">Connected</p>
              </div>
            )}

            {/* Timer */}
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              background: 'rgba(0,0,0,0.5)', borderRadius: 20, backdropFilter: 'blur(8px)',
            }}>
              <Clock size={13} style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>00:00</span>
            </div>
          </div>

          {/* Call Controls */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20,
            borderTop: '1px solid var(--color-border-subtle)',
          }}>
            <button
              onClick={() => setMuted(!muted)}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: muted ? 'var(--color-danger-soft)' : 'var(--color-bg-tertiary)',
                border: `1px solid ${muted ? 'rgba(225,112,85,0.3)' : 'var(--color-border-default)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: muted ? 'var(--color-danger)' : 'var(--color-text-primary)', transition: 'all 0.2s',
              }}
            >
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {callType === 'video' && (
              <button
                onClick={() => setCameraOn(!cameraOn)}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: !cameraOn ? 'var(--color-danger-soft)' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${!cameraOn ? 'rgba(225,112,85,0.3)' : 'var(--color-border-default)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: !cameraOn ? 'var(--color-danger)' : 'var(--color-text-primary)', transition: 'all 0.2s',
                }}
              >
                {cameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
              </button>
            )}

            <button
              onClick={() => setScreenSharing(!screenSharing)}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: screenSharing ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)',
                border: `1px solid ${screenSharing ? 'rgba(108,92,231,0.3)' : 'var(--color-border-default)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: screenSharing ? 'var(--color-accent)' : 'var(--color-text-primary)', transition: 'all 0.2s',
              }}
            >
              <Monitor size={20} />
            </button>

            <button style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: 'var(--color-text-primary)', transition: 'all 0.2s',
            }}>
              <MessageSquare size={20} />
            </button>

            <button
              onClick={() => setInCall(false)}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-danger)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: 'white', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(225, 112, 85, 0.3)',
              }}
            >
              <PhoneOff size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
