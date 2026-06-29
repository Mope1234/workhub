import { useState, useEffect, useRef } from 'react';
import { isSetUp, setupPin, verifyPin, pullAuthFromCloud } from '../utils/auth';

interface Props {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: Props) {
  const [mode, setMode] = useState<'loading' | 'setup' | 'login'>('loading');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    if (isSetUp()) {
      setMode('login');
      setTimeout(() => inputRef.current?.focus(), 200);
      return;
    }
    // Try pulling from cloud (new device)
    try {
      const pulled = await pullAuthFromCloud();
      if (pulled && isSetUp()) {
        setMode('login');
        setTimeout(() => inputRef.current?.focus(), 200);
        return;
      }
    } catch { /* no cloud available, that's fine */ }
    setMode('setup');
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  function handleSetup() {
    setError('');
    if (step === 1) {
      if (pin.length < 4) { setError('PIN must be at least 4 characters'); return; }
      setStep(2);
      setConfirmPin('');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    if (confirmPin !== pin) { setError('PINs do not match. Try again.'); setConfirmPin(''); return; }
    try {
      const ok = setupPin(pin);
      if (ok) { onSuccess(); }
      else { setError('PIN must be at least 4 characters.'); }
    } catch (e) {
      setError('Setup failed: ' + String(e));
    }
  }

  function handleLogin() {
    setError('');
    if (!pin.trim()) { setError('Please enter your PIN'); return; }
    try {
      const ok = verifyPin(pin);
      if (ok) { onSuccess(); }
      else { setError('Incorrect PIN. Try again.'); setPin(''); setTimeout(() => inputRef.current?.focus(), 50); }
    } catch (e) {
      setError('Login failed: ' + String(e));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (mode === 'setup') handleSetup();
      else handleLogin();
    }
  }

  const pinDots = (value: string) => {
    const filled = value.length;
    return (
      <div className="flex justify-center gap-2.5 mb-6">
        {Array.from({ length: Math.max(6, filled) }).slice(0, 8).map((_, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${i < filled ? 'bg-blue-400 scale-125' : 'bg-slate-700 border border-slate-600'}`} />
        ))}
      </div>
    );
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="text-5xl mb-4">⚡</div>
          <p className="text-white font-bold text-xl">WorkHub</p>
          <p className="text-slate-500 text-sm mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-white font-bold text-2xl">WorkHub</h1>
          <p className="text-slate-500 text-sm mt-1">MSG Foundation · Zerenity Wellness</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {mode === 'setup' ? (
            <>
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3 border border-blue-500/20">
                  🔒 First Time Setup
                </span>
                <h2 className="text-white font-bold text-lg">
                  {step === 1 ? 'Create Your PIN' : 'Confirm Your PIN'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {step === 1 ? 'Choose a PIN you\'ll remember (min 4 characters)' : 'Type the same PIN again'}
                </p>
              </div>

              {pinDots(step === 1 ? pin : confirmPin)}

              <div className="relative mb-4">
                <input
                  ref={inputRef}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={step === 1 ? pin : confirmPin}
                  onChange={e => { setError(''); step === 1 ? setPin(e.target.value) : setConfirmPin(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  placeholder={step === 1 ? 'Enter new PIN' : 'Confirm PIN'}
                  autoComplete="off"
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-lg tracking-[0.3em] placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                  style={{ fontSize: '20px', letterSpacing: '0.3em' }}
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg p-1 active:scale-90">
                  {showPin ? '🙈' : '👁️'}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                {step === 2 && (
                  <button onClick={() => { setStep(1); setConfirmPin(''); setError(''); }} className="flex-1 py-3.5 bg-slate-800 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                    ← Back
                  </button>
                )}
                <button
                  onClick={handleSetup}
                  disabled={step === 1 ? pin.length < 4 : confirmPin.length < 4}
                  className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-40"
                >
                  {step === 1 ? 'Next →' : '✅ Set PIN & Enter'}
                </button>
              </div>

              <div className="flex justify-center gap-2 mt-5">
                <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-blue-400' : 'bg-slate-700'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-blue-400' : 'bg-slate-700'}`} />
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔐</div>
                <h2 className="text-white font-bold text-lg">Welcome Back</h2>
                <p className="text-slate-400 text-sm mt-1">Enter your PIN to continue</p>
              </div>

              {pinDots(pin)}

              <div className="relative mb-4">
                <input
                  ref={inputRef}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={e => { setError(''); setPin(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter PIN"
                  autoComplete="off"
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-lg tracking-[0.3em] placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                  style={{ fontSize: '20px', letterSpacing: '0.3em' }}
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg p-1 active:scale-90">
                  {showPin ? '🙈' : '👁️'}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={pin.length < 4}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-40"
              >
                🔓 Unlock
              </button>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-[10px] mt-6">
          Your PIN is encrypted and never stored in plain text
        </p>
      </div>
    </div>
  );
}
