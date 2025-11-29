
import React, { useState, useEffect, useRef } from 'react';
import { IconClock } from './Icons';

interface TimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onClose?: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds = 60, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Function to handle vibrations
  const triggerVibration = (type: 'SHORT' | 'LONG') => {
      if (typeof navigator === 'undefined' || !navigator.vibrate) return;
      
      if (type === 'SHORT') {
          // Quick subtle buzz for warning
          navigator.vibrate(200);
      } else if (type === 'LONG') {
          // Distinct pattern for finish (Pulse - Pause - Pulse - Long)
          navigator.vibrate([400, 200, 400, 200, 1000]);
      }
  };

  // Play a simple beep sound
  const playAlert = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); 
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.4); 
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
            const newVal = prev - 1;
            
            // Short vibration warning at 5 seconds
            if (newVal === 5) {
                triggerVibration('SHORT');
            }
            
            return newVal;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      triggerVibration('LONG'); // Long vibration on finish
      playAlert();
      if (onComplete) onComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isActive, timeLeft, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const addTime = (seconds: number) => setTimeLeft(prev => prev + seconds);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = initialSeconds > 0 ? Math.min(100, Math.max(0, (timeLeft / initialSeconds) * 100)) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pointer-events-none">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-metodo-gold/30 p-4 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md pointer-events-auto animate-slide-up relative overflow-hidden">
        {/* Progress Bar Background */}
        <div 
            className="absolute bottom-0 left-0 h-1 bg-metodo-gold transition-all duration-1000 linear" 
            style={{ width: `${progress}%` }}
        ></div>

        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isActive ? 'bg-metodo-gold/20 text-metodo-gold animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                    <IconClock size={24} />
                </div>
                <div>
                    <span className="text-3xl font-display font-bold text-white tracking-widest tabular-nums">
                        {formatTime(timeLeft)}
                    </span>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Tempo de Descanso</p>
                </div>
            </div>
            {onClose && (
                <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs uppercase font-bold px-2 py-1 bg-zinc-800 rounded">
                    Fechar
                </button>
            )}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <button 
            onClick={toggleTimer}
            className={`col-span-2 text-xs font-bold py-3 px-4 rounded-lg uppercase tracking-wider transition-colors ${isActive ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-metodo-gold text-black hover:bg-yellow-400'}`}
          >
            {isActive ? 'Pausar' : 'Continuar'}
          </button>
          <button onClick={() => addTime(10)} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg flex items-center justify-center">
             <span className="text-xs font-bold">+10s</span>
          </button>
          <button onClick={() => addTime(30)} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg flex items-center justify-center">
             <span className="text-xs font-bold">+30s</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
