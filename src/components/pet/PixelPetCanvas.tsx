import React, { useState, useEffect } from 'react';
import { PetId, PetAction } from '../../types/pet';
import { getLocalPetDefinition } from '../../pets/registry';

interface PixelPetCanvasProps {
  petId: PetId;
  action: PetAction;
  onPoke?: () => void;
}

export const PixelPetCanvas: React.FC<PixelPetCanvasProps> = ({
  petId,
  action,
  onPoke,
}) => {
  const [isPoked, setIsPoked] = useState(false);

  // Temporary poke reaction if triggered externally or internally
  useEffect(() => {
    if (action === 'poke') {
      setIsPoked(true);
      const timer = setTimeout(() => setIsPoked(false), 800);
      return () => clearTimeout(timer);
    }
  }, [action]);

  const handlePointerDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 700);
    if (onPoke) onPoke();
  };

  const currentAction = isPoked ? 'poke' : action;
  const LocalPetVisual = getLocalPetDefinition(petId)?.Visual;

  return (
    <div
      onClick={handlePointerDown}
      className={`pet-motion relative w-28 h-28 flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 ${
        currentAction === 'happy'
          ? 'animate-bounce-high'
          : currentAction === 'walk'
          ? 'animate-pet-walk'
          : currentAction === 'poke'
          ? 'animate-pet-shake'
          : currentAction === 'sleep'
          ? 'animate-pet-breathe'
          : 'animate-pet-float'
      }`}
      title="点击摸摸我！"
    >
      {/* 1. Cat (Mimi) */}
      {petId === 'cat' && (
        <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
          {/* Shadow */}
          <ellipse cx="50" cy="88" rx="28" ry="6" fill="rgba(0,0,0,0.15)" />

          {/* Tail */}
          <path
            d={
              currentAction === 'sleep'
                ? 'M25 80 C 15 82, 10 75, 12 70'
                : 'M25 75 C 10 70, 5 50, 16 42 C 22 38, 20 48, 26 65'
            }
            fill="none"
            stroke="#f59e0b"
            strokeWidth="7"
            strokeLinecap="round"
            className={currentAction !== 'sleep' ? 'animate-tail-wag origin-[25px_75px]' : ''}
          />

          {/* Body */}
          <ellipse cx="50" cy="68" rx="24" ry="19" fill="#fef3c7" />
          {/* Calico patches */}
          <path d="M40 50 Q 55 52, 60 62 Q 48 70, 36 60 Z" fill="#f59e0b" />
          <path d="M62 60 Q 72 65, 70 78 Q 58 75, 60 60 Z" fill="#78350f" />

          {/* Head */}
          <ellipse cx="50" cy="46" rx="22" ry="18" fill="#fef3c7" />

          {/* Ears */}
          <polygon points="32,34 38,18 48,28" fill="#f59e0b" />
          <polygon points="34,32 39,22 46,28" fill="#fbcfe8" />
          <polygon points="68,34 62,18 52,28" fill="#78350f" />
          <polygon points="66,32 61,22 54,28" fill="#fbcfe8" />

          {/* Eyes */}
          {currentAction === 'sleep' ? (
            <>
              <path d="M40 46 Q 44 50, 48 46" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M52 46 Q 56 50, 60 46" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : currentAction === 'happy' ? (
            <>
              <path d="M40 48 Q 44 42, 48 48" fill="none" stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M52 48 Q 56 42, 60 48" fill="none" stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="43" cy="45" rx="3.5" ry="4.5" fill="#1e293b" />
              <circle cx="44.5" cy="43.5" r="1.5" fill="#ffffff" />
              <ellipse cx="57" cy="45" rx="3.5" ry="4.5" fill="#1e293b" />
              <circle cx="58.5" cy="43.5" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Nose & Mouth */}
          <polygon points="49,50 51,50 50,52" fill="#f43f5e" />
          <path d="M47 52 Q 50 55, 50 52 Q 50 55, 53 52" fill="none" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />

          {/* Whiskers */}
          <line x1="32" y1="48" x2="20" y2="46" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="52" x2="21" y2="54" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="48" x2="80" y2="46" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="52" x2="79" y2="54" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Paws */}
          <circle cx="42" cy="84" r="5" fill="#ffffff" stroke="#fef3c7" strokeWidth="1" />
          <circle cx="58" cy="84" r="5" fill="#ffffff" stroke="#fef3c7" strokeWidth="1" />

          {/* Sleep ZZZ */}
          {currentAction === 'sleep' && (
            <text x="68" y="24" fill="#3b82f6" fontSize="13" fontWeight="bold" className="animate-pulse">
              zZ
            </text>
          )}

          {/* Happy Heart */}
          {currentAction === 'happy' && (
            <text x="68" y="22" fill="#f43f5e" fontSize="14" className="animate-bounce">
              ♥
            </text>
          )}
        </svg>
      )}

      {/* 2. Dog (Hachi Shiba Inu) */}
      {petId === 'dog' && (
        <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
          {/* Shadow */}
          <ellipse cx="50" cy="88" rx="26" ry="6" fill="rgba(0,0,0,0.15)" />

          {/* Tail */}
          <path
            d="M72 65 Q 86 52, 80 44 Q 74 38, 70 48"
            fill="#d97706"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
            className={currentAction !== 'sleep' ? 'animate-tail-wag origin-[72px_65px]' : ''}
          />

          {/* Body */}
          <ellipse cx="50" cy="68" rx="23" ry="18" fill="#f59e0b" />
          <ellipse cx="50" cy="72" rx="14" ry="12" fill="#fffbeb" />

          {/* Head */}
          <circle cx="50" cy="44" r="20" fill="#f59e0b" />
          {/* White cheeks & muzzle */}
          <path d="M35 44 Q 50 36, 65 44 Q 68 58, 50 60 Q 32 58, 35 44 Z" fill="#fffbeb" />

          {/* Ears */}
          <polygon points="32,35 36,18 47,27" fill="#d97706" />
          <polygon points="36,32 38,22 45,28" fill="#451a03" />
          <polygon points="68,35 64,18 53,27" fill="#d97706" />
          <polygon points="64,32 62,22 55,28" fill="#451a03" />

          {/* Eyes */}
          {currentAction === 'sleep' ? (
            <>
              <path d="M41 44 Q 45 48, 48 44" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M52 44 Q 55 48, 59 44" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : currentAction === 'happy' ? (
            <>
              <path d="M41 46 Q 45 40, 48 46" fill="none" stroke="#451a03" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M52 46 Q 55 40, 59 46" fill="none" stroke="#451a03" strokeWidth="2.8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="44" cy="44" r="3.5" fill="#292524" />
              <circle cx="45.5" cy="42.5" r="1.3" fill="#ffffff" />
              <circle cx="56" cy="44" r="3.5" fill="#292524" />
              <circle cx="57.5" cy="42.5" r="1.3" fill="#ffffff" />
            </>
          )}

          {/* Eyebrow dots (classic shiba white dots) */}
          <circle cx="42" cy="35" r="2.2" fill="#fffbeb" />
          <circle cx="58" cy="35" r="2.2" fill="#fffbeb" />

          {/* Nose & Mouth */}
          <ellipse cx="50" cy="49" rx="3" ry="2.2" fill="#292524" />
          <path d="M48 51 Q 50 53, 50 51 Q 50 53, 52 51" fill="none" stroke="#451a03" strokeWidth="1.8" />

          {/* Tongue (if happy or walking) */}
          {(currentAction === 'happy' || currentAction === 'walk') && (
            <ellipse cx="50" cy="56" rx="3.2" ry="4" fill="#f43f5e" className="animate-pulse" />
          )}

          {/* Paws */}
          <circle cx="42" cy="84" r="5" fill="#fffbeb" />
          <circle cx="58" cy="84" r="5" fill="#fffbeb" />

          {/* Happy Sparkles */}
          {currentAction === 'happy' && (
            <text x="68" y="24" fill="#f59e0b" fontSize="14" className="animate-bounce">
              ★
            </text>
          )}
        </svg>
      )}

      {/* 3. Slime (Jelly) */}
      {petId === 'slime' && (
        <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
          {/* Shadow */}
          <ellipse cx="50" cy="88" rx="28" ry="6" fill="rgba(0,0,0,0.15)" />

          {/* Slime Main Body (Squashable teardrop blob) */}
          <path
            d={
              currentAction === 'sleep'
                ? 'M20 84 Q 15 75, 30 70 Q 50 68, 70 70 Q 85 75, 80 84 Q 50 88, 20 84 Z'
                : 'M25 80 C 18 65, 26 48, 44 32 C 50 25, 52 25, 56 32 C 74 48, 82 65, 75 80 C 65 88, 35 88, 25 80 Z'
            }
            fill="url(#slimeGradient)"
            className={currentAction !== 'sleep' ? 'animate-jelly-squash origin-bottom' : ''}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="slimeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Shiny Highlight */}
          <ellipse cx="38" cy="46" rx="8" ry="12" fill="url(#shineGradient)" transform="rotate(-25 38 46)" />

          {/* Eyes */}
          {currentAction === 'sleep' ? (
            <>
              <path d="M38 60 Q 42 64, 46 60" fill="none" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M54 60 Q 58 64, 62 60" fill="none" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : currentAction === 'happy' ? (
            <>
              <path d="M38 62 Q 42 56, 46 62" fill="none" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" />
              <path d="M54 62 Q 58 56, 62 62" fill="none" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="42" cy="58" rx="4" ry="5.5" fill="#064e3b" />
              <circle cx="43.5" cy="56" r="1.8" fill="#ffffff" />
              <ellipse cx="58" cy="58" rx="4" ry="5.5" fill="#064e3b" />
              <circle cx="59.5" cy="56" r="1.8" fill="#ffffff" />
            </>
          )}

          {/* Cute Blushing Cheeks */}
          <circle cx="34" cy="65" r="3.5" fill="#f43f5e" opacity="0.6" />
          <circle cx="66" cy="65" r="3.5" fill="#f43f5e" opacity="0.6" />

          {/* Tiny Crown / Sprout on Head */}
          <path d="M50 26 Q 46 16, 40 18 Q 44 24, 50 26 Z" fill="#10b981" />
          <path d="M50 26 Q 54 16, 60 18 Q 56 24, 50 26 Z" fill="#059669" />

          {/* Bubbles on Happy */}
          {currentAction === 'happy' && (
            <>
              <circle cx="72" cy="30" r="3" fill="#6ee7b7" opacity="0.7" className="animate-bounce" />
              <circle cx="28" cy="28" r="2.5" fill="#6ee7b7" opacity="0.7" className="animate-pulse" />
            </>
          )}
        </svg>
      )}

      {/* 4. Robot (Robo-01) */}
      {petId === 'robot' && (
        <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
          {/* Shadow */}
          <ellipse cx="50" cy="88" rx="22" ry="5" fill="rgba(0,0,0,0.15)" />

          {/* Jet Booster Flame */}
          <polygon
            points="46,80 54,80 50,92"
            fill="#38bdf8"
            className="animate-pulse origin-top"
          />

          {/* Head & Body Chassis */}
          <rect x="30" y="32" width="40" height="36" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5" />

          {/* Antenna */}
          <line x1="50" y1="32" x2="50" y2="18" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
          <circle
            cx="50"
            cy="16"
            r="4"
            fill={currentAction === 'happy' ? '#22c55e' : currentAction === 'sleep' ? '#64748b' : '#38bdf8'}
            className="animate-ping"
          />
          <circle
            cx="50"
            cy="16"
            r="4"
            fill={currentAction === 'happy' ? '#22c55e' : currentAction === 'sleep' ? '#64748b' : '#38bdf8'}
          />

          {/* Visor Screen */}
          <rect x="36" y="38" width="28" height="18" rx="5" fill="#0f172a" />

          {/* Digital Pixel Eyes */}
          {currentAction === 'sleep' ? (
            <text x="39" y="51" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
              -- --
            </text>
          ) : currentAction === 'happy' ? (
            <text x="39" y="52" fill="#22c55e" fontSize="12" fontFamily="monospace" fontWeight="bold">
              ^  ^
            </text>
          ) : currentAction === 'poke' ? (
            <text x="39" y="52" fill="#f59e0b" fontSize="12" fontFamily="monospace" fontWeight="bold">
              !  !
            </text>
          ) : (
            <>
              <rect x="40" y="44" width="6" height="6" rx="1.5" fill="#38bdf8" />
              <rect x="54" y="44" width="6" height="6" rx="1.5" fill="#38bdf8" />
            </>
          )}

          {/* Side Ears / Bolts */}
          <rect x="26" y="44" width="4" height="8" rx="1.5" fill="#94a3b8" />
          <rect x="70" y="44" width="4" height="8" rx="1.5" fill="#94a3b8" />

          {/* Body Chest Core Dial */}
          <circle cx="50" cy="61" r="3.5" fill="#3b82f6" />
          <line x1="42" y1="61" x2="45" y2="61" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="55" y1="61" x2="58" y2="61" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Floating Hands */}
          <ellipse
            cx="24"
            cy="60"
            rx="4"
            ry="6"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className={currentAction === 'happy' ? 'animate-bounce' : ''}
          />
          <ellipse
            cx="76"
            cy="60"
            rx="4"
            ry="6"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className={currentAction === 'happy' ? 'animate-bounce' : ''}
          />
        </svg>
      )}

      {LocalPetVisual && <LocalPetVisual action={currentAction} />}

    </div>
  );
};
