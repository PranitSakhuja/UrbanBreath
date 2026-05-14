import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthScreen() {
  const [mode, setMode]                     = useState<Mode>('login');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [googleLoading, setGoogleLoading]   = useState(false);
  const [error, setError]                   = useState('');
  const [info, setInfo]                     = useState('');

  function clearMessages() { setError(''); setInfo(''); }

  async function handleGoogle() {
    clearMessages();
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (mode === 'forgot') {
      setLoading(true);
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}?reset=1`,
      });
      setLoading(false);
      if (err) setError(err.message);
      else { setInfo('Check your email for a password reset link.'); }
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setInfo('Check your email to confirm your account.');
    }
    setLoading(false);
  }

  function switchMode(next: Mode) {
    clearMessages();
    setPassword('');
    setConfirmPassword('');
    setMode(next);
  }

  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password';
  const submitLabel = mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link';

  return (
    <div className="auth-bg">
      {/* Ambient glows */}
      <div className="auth-glow auth-glow--a" />
      <div className="auth-glow auth-glow--b" />

      <div className="auth-card glass fade-in" style={{ padding: '32px 28px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg, #0d9488, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(13,148,136,0.25)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              UrbanBreath
            </div>
            <div style={{ fontSize: 10, color: 'var(--teal)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Air Quality Tracker
            </div>
          </div>
        </div>

        {/* Mode title */}
        <h1 className="fade-in" key={mode} style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
          {title}
        </h1>

        {/* Google OAuth — not shown on forgot */}
        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="auth-google-btn scale-press"
              style={{ minHeight: 52, fontSize: 15 }}
            >
              {googleLoading ? (
                <Loader2 size={18} className="auth-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* OR divider */}
            <div className="auth-divider">
              <span />
              <p style={{ fontSize: 13 }}>or</p>
              <span />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Email */}
          <div className="auth-field" style={{ minHeight: 52 }}>
            <Mail size={16} color="var(--text-3)" className="auth-field__icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="auth-input"
              style={{ fontSize: 15 }}
            />
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div className="auth-field" style={{ minHeight: 52 }}>
              <Lock size={16} color="var(--text-3)" className="auth-field__icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="auth-input"
                style={{ paddingRight: 44, fontSize: 15 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="auth-eye"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}

          {/* Confirm password (signup only) */}
          {mode === 'signup' && (
            <div className="auth-field fade-in" style={{ minHeight: 52 }}>
              <Lock size={16} color="var(--text-3)" className="auth-field__icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="auth-input"
                style={{ fontSize: 15 }}
              />
            </div>
          )}

          {/* Forgot password link */}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <button type="button" onClick={() => switchMode('forgot')} className="auth-link" style={{ fontSize: 13 }}>
                Forgot password?
              </button>
            </div>
          )}

          {/* Error / info */}
          {error && (
            <div className="auth-error fade-in" style={{ fontSize: 13, padding: '12px 14px' }}>{error}</div>
          )}
          {info && (
            <div className="auth-info fade-in" style={{ fontSize: 13, padding: '12px 14px' }}>{info}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="walk-action walk-action--start scale-press"
            style={{ width: '100%', marginTop: 4, fontSize: 16, fontWeight: 700, minHeight: 54 }}
          >
            {loading ? <Loader2 size={17} className="auth-spinner" /> : submitLabel}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-3)' }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="auth-link">Sign up</button>
            </>
          ) : mode === 'signup' ? (
            <>Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} className="auth-link">Sign in</button>
            </>
          ) : (
            <button type="button" onClick={() => switchMode('login')} className="auth-link">
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
