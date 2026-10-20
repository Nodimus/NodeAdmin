import React from 'react';

interface OptoclinLogoProps {
  className?: string;
  variant?: 'light' | 'dark'; // 'light' is for light backgrounds, 'dark' is for dark green backgrounds
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const OptoclinLogo: React.FC<OptoclinLogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
  showSubtitle = true,
}) => {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Símbolo Óptico Optoclin */}
      <div
        className={`${iconSizes[size]} relative rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105 ${
          isDark
            ? 'bg-[#003828] border border-[#76C900]/30 shadow-[#76C900]/10'
            : 'bg-[#004D38] text-white shadow-[#004D38]/20'
        }`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* Curva da Pálpebra Superior em Verde Vibrante */}
          <path
            d="M 6 20 C 12 10 28 10 34 20"
            stroke="#76C900"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Curva da Pálpebra Inferior */}
          <path
            d="M 6 20 C 12 30 28 30 34 20"
            stroke={isDark ? '#FFFFFF' : '#E2E8F0'}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          {/* Íris / Lente Óptica */}
          <circle
            cx="20"
            cy="20"
            r="6.5"
            fill={isDark ? '#76C900' : '#76C900'}
          />
          {/* Pupila Central Profunda */}
          <circle
            cx="20"
            cy="20"
            r="3.2"
            fill="#004D38"
          />
          {/* Ponto de Luz / Reflexo de Alta Precisão */}
          <circle
            cx="18.5"
            cy="18.5"
            r="1.4"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* Tipografia da Marca */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center tracking-tight">
          <span
            className={`font-black tracking-tight ${textSizes[size]} ${
              isDark ? 'text-white' : 'text-[#004D38]'
            }`}
          >
            OPTO
          </span>
          <span
            className={`font-black tracking-tight ${textSizes[size]} ${
              isDark ? 'text-[#76C900]' : 'text-[#004D38]'
            }`}
          >
            CLIN
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#76C900] ml-0.5 inline-block mb-1" />
        </div>
        {showSubtitle && (
          <span
            className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] ${
              isDark ? 'text-emerald-200/80' : 'text-slate-500'
            }`}
          >
            Cuidados Visuais
          </span>
        )}
      </div>
    </div>
  );
};
