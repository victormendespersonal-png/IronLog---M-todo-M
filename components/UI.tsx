
import React from 'react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-zinc-900/80 backdrop-blur-md border border-red-900/20 p-6 rounded-2xl shadow-sm hover:border-red-900/50 hover:shadow-lg hover:shadow-red-900/10 transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  // Updated base style for rounded corners and clean typography
  const baseStyle = "font-display font-bold tracking-wider uppercase py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-sm";
  
  const variants = {
    // Primary is now RED/WINE
    primary: "bg-metodo-red hover:bg-red-900 text-red-50 shadow-lg shadow-metodo-red/20 active:scale-[0.98] border border-red-800",
    // Secondary is Zinc/Gold mix
    secondary: "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-metodo-gold/50 active:scale-[0.98]",
    // Danger
    danger: "border border-red-900/50 text-red-500 hover:bg-red-950/30",
    // Ghost
    ghost: "text-zinc-400 hover:text-white hover:bg-white/5"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} {...props}>
      {children}
    </button>
  );
};

// --- Input ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    className="bg-black/60 border border-zinc-800/60 rounded-xl p-4 text-red-500 placeholder-zinc-600 focus:border-metodo-red focus:ring-1 focus:ring-metodo-red focus:bg-red-950/10 focus:outline-none transition-all w-full text-sm font-medium tracking-wide shadow-inner"
    {...props}
  />
);

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-950/30 text-red-200 border border-red-900/30">
    {children}
  </span>
);

// --- Avatar ---
export const Avatar: React.FC<{ src?: string; alt: string; size?: 'sm' | 'md' | 'lg' }> = ({ src, alt, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-24 h-24 text-xl'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0`}>
            {src ? (
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            ) : (
                <span className="font-display font-bold text-metodo-gold">{alt.charAt(0).toUpperCase()}</span>
            )}
        </div>
    );
}
