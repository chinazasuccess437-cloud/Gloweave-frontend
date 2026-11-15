import React from 'react';
import { User } from 'lucide-react';

interface ProblemThumbProps {
  theme: 'energy' | 'healthcare' | 'agriculture' | 'water' | 'education';
  size?: 'sm' | 'md';
}

export const ProblemThumbnail: React.FC<ProblemThumbProps> = ({ theme, size = 'sm' }) => {
  const dims = size === 'sm' ? 'w-11 h-11 rounded-xl' : 'w-14 h-14 rounded-xl';

  if (theme === 'energy') {
    return (
      <div
        className={`${dims} shrink-0 border border-sky-400/30 overflow-hidden relative bg-gradient-to-b from-[#0A2558] via-[#0E3A78] to-[#06122B]`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <defs>
            <radialGradient id="skyGlow" cx="50%" cy="20%" r="70%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#071530" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="64" height="64" fill="url(#skyGlow)" />
          {/* Skyline & wind turbines */}
          <rect x="8" y="34" width="6" height="30" fill="#1E3A8A" />
          <rect x="16" y="26" width="8" height="38" fill="#1D4ED8" />
          <rect x="27" y="22" width="7" height="42" fill="#2563EB" />
          <rect x="37" y="30" width="6" height="34" fill="#1E40AF" />
          <rect x="46" y="36" width="8" height="28" fill="#172554" />
          <circle cx="20" cy="31" r="1" fill="#FDE047" />
          <circle cx="30" cy="27" r="1" fill="#38BDF8" />
          <circle cx="30" cy="34" r="1" fill="#FDE047" />
          <circle cx="40" cy="36" r="1" fill="#38BDF8" />
          {/* Solar gleam horizon */}
          <path d="M0 52 Q32 45 64 52" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.7" />
        </svg>
      </div>
    );
  }

  if (theme === 'healthcare') {
    return (
      <div
        className={`${dims} shrink-0 border border-cyan-400/30 overflow-hidden relative bg-gradient-to-br from-[#0F2A4A] via-[#133B5C] to-[#071528]`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect x="10" y="18" width="44" height="26" rx="3" fill="#0B192E" stroke="#38BDF8" strokeWidth="1.4" />
          <rect x="14" y="22" width="36" height="18" rx="1.5" fill="#102A43" />
          <path
            d="M16 32 L23 32 L26 25 L30 37 L34 28 L37 32 L48 32"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M6 46 L58 46 L54 52 L10 52 Z" fill="#1E3A5F" />
          <circle cx="48" cy="14" r="5" fill="#10B981" opacity="0.9" />
          <path d="M48 11.5 V16.5 M45.5 14 H50.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (theme === 'agriculture') {
    return (
      <div
        className={`${dims} shrink-0 border border-emerald-400/30 overflow-hidden relative bg-gradient-to-b from-[#0E3A5C] via-[#134E4A] to-[#06281E]`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="48" cy="16" r="8" fill="#FBBF24" opacity="0.85" />
          <path d="M0 40 Q20 30 40 38 T64 34 L64 64 L0 64 Z" fill="#065F46" />
          <path d="M0 46 Q24 38 48 46 T64 44 L64 64 L0 64 Z" fill="#10B981" opacity="0.7" />
          <path d="M6 62 L24 41 M20 62 L32 42 M36 62 L40 43 M52 62 L48 43" stroke="#A7F3D0" strokeWidth="1.2" opacity="0.6" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${dims} shrink-0 border border-cyan-400/30 overflow-hidden relative bg-gradient-to-br from-[#0F2A56] via-[#1E3A8A] to-[#08142E]`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="18" fill="#19C8FF" opacity="0.2" />
        <path d="M12 38 Q32 22 52 38" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
        <circle cx="32" cy="28" r="6" fill="#38BDF8" opacity="0.85" />
      </svg>
    </div>
  );
};

interface SolutionBannerProps {
  theme: 'solar' | 'health' | 'agri' | 'water' | 'fintech';
  name: string;
  verified: boolean;
  compact?: boolean;
}

export const SolutionVisualBanner: React.FC<SolutionBannerProps> = ({
  theme,
  name,
  verified,
  compact = false,
}) => {
  const skyGrad =
    theme === 'solar'
      ? 'from-[#1D4ED8] via-[#0EA5E9] to-[#064E3B]'
      : theme === 'health'
      ? 'from-[#1E3A8A] via-[#0284C7] to-[#0F172A]'
      : 'from-[#065F46] via-[#0D9488] to-[#0F172A]';

  return (
    <div
      className={`rounded-xl overflow-hidden border border-sky-400/25 relative bg-gradient-to-b ${skyGrad} ${
        compact ? 'h-full min-h-[156px]' : 'h-36'
      }`}
    >
      {/* Rich EcoPower Solar House SVG illustration */}
      <svg
        viewBox="0 0 220 180"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`sky-${theme}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="55%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
          <linearGradient id="solarPanel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>

        <rect width="220" height="180" fill={`url(#sky-${theme})`} />
        <circle cx="176" cy="34" r="20" fill="#FDE047" opacity="0.32" />
        <circle cx="176" cy="34" r="11" fill="#FEF08A" opacity="0.85" />

        {/* Hills and lawn */}
        <path d="M0 132 Q60 112 135 128 T220 122 L220 180 L0 180 Z" fill="#15803D" />
        <path d="M0 144 Q90 128 220 146 L220 180 L0 180 Z" fill="#166534" />

        {/* Trees */}
        <circle cx="28" cy="116" r="18" fill="#14532D" />
        <circle cx="38" cy="108" r="14" fill="#16A34A" />
        <circle cx="192" cy="118" r="16" fill="#14532D" />

        {/* Modern smart home */}
        <rect x="58" y="88" width="104" height="58" rx="3" fill="#E2E8F0" />
        <rect x="122" y="96" width="32" height="44" rx="2" fill="#0F172A" />
        <rect x="125" y="99" width="26" height="36" fill="#38BDF8" opacity="0.4" />
        <rect x="70" y="102" width="36" height="24" rx="2" fill="#0F172A" />
        <rect x="73" y="105" width="30" height="18" fill="#7DD3FC" opacity="0.55" />

        {/* Pitched roof with solar array */}
        <polygon points="48,90 110,48 172,90" fill="#1E293B" />
        <polygon points="64,84 110,53 156,84" fill="url(#solarPanel)" stroke="#38BDF8" strokeWidth="1.2" />
        <line x1="86" y1="69" x2="134" y2="69" stroke="#38BDF8" strokeWidth="0.9" opacity="0.7" />
        <line x1="75" y1="77" x2="145" y2="77" stroke="#38BDF8" strokeWidth="0.9" opacity="0.7" />
        <line x1="110" y1="53" x2="110" y2="84" stroke="#38BDF8" strokeWidth="0.9" opacity="0.7" />
        <line x1="92" y1="65" x2="92" y2="84" stroke="#38BDF8" strokeWidth="0.9" opacity="0.7" />
        <line x1="128" y1="65" x2="128" y2="84" stroke="#38BDF8" strokeWidth="0.9" opacity="0.7" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#050C1D]/90 via-transparent to-transparent" />
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
        <span className="text-[11px] font-bold text-white truncate drop-shadow">{name}</span>
        {verified && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 text-[9px] font-bold border border-emerald-400/40 shrink-0">
            ✓ Verified
          </span>
        )}
      </div>
    </div>
  );
};

interface AvatarBadgeProps {
  initials?: string;
  photoUrl?: string | null;
  alt?: string;
  accentFrom?: string;
  accentTo?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  initials,
  photoUrl,
  alt = 'Profile picture',
  accentFrom = '#0066FF',
  accentTo = '#19C8FF',
  size = 'md',
}) => {
  const sizeClass =
    size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-10 h-10 text-xs' : 'w-9 h-9 text-xs';

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-extrabold text-white border-2 border-cyan-400/50 shrink-0 overflow-hidden shadow-[0_0_12px_rgba(25,200,255,0.28)]`}
      style={
        photoUrl
          ? undefined
          : {
              background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
            }
      }
    >
      {photoUrl ? (
        <img src={photoUrl} alt={alt} className="w-full h-full object-cover" />
      ) : initials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <User className="w-4 h-4 text-white/90" aria-hidden="true" />
      )}
    </div>
  );
};

export const HeroGlobeGraphic: React.FC<{ variant?: 'desktop' | 'mobile' }> = ({
  variant = 'desktop',
}) => {
  const sizeClasses =
    variant === 'mobile'
      ? 'w-56 h-56 -right-10 top-6 opacity-90'
      : 'w-[410px] h-[410px] right-[12%] -top-12 opacity-95';

  return (
    <div
      className={`absolute pointer-events-none select-none ${sizeClasses}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <radialGradient id={`globeSphere-${variant}`} cx="38%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.88" />
            <stop offset="48%" stopColor="#0A245E" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#050F2B" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#00A3FF" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id={`globeHalo-${variant}`} cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#0088FF" stopOpacity="0.38" />
            <stop offset="82%" stopColor="#19C8FF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#050C1D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer atmospheric bloom */}
        <circle cx="200" cy="200" r="190" fill={`url(#globeHalo-${variant})`} />

        {/* Orbital rings */}
        <ellipse
          cx="200"
          cy="200"
          rx="172"
          ry="68"
          transform="rotate(-22 200 200)"
          stroke="#38BDF8"
          strokeWidth="0.9"
          strokeOpacity="0.35"
          fill="none"
        />
        <ellipse
          cx="200"
          cy="200"
          rx="165"
          ry="56"
          transform="rotate(24 200 200)"
          stroke="#60A5FA"
          strokeWidth="0.8"
          strokeOpacity="0.28"
          strokeDasharray="4 4"
          fill="none"
        />

        {/* Core Earth sphere */}
        <circle
          cx="200"
          cy="200"
          r="128"
          fill={`url(#globeSphere-${variant})`}
          stroke="#38BDF8"
          strokeWidth="1.8"
          strokeOpacity="0.65"
        />

        {/* Latitude / Longitude wireframe */}
        <g stroke="#38BDF8" strokeOpacity="0.22" fill="none" strokeWidth="0.8">
          <ellipse cx="200" cy="200" rx="55" ry="128" />
          <ellipse cx="200" cy="200" rx="98" ry="128" />
          <ellipse cx="200" cy="152" rx="115" ry="26" />
          <ellipse cx="200" cy="200" rx="128" ry="34" />
          <ellipse cx="200" cy="248" rx="115" ry="26" />
        </g>

        {/* Illuminated warm gold continent mesh (Europe/Africa/Asia/Americas feel) */}
        <g fill="#FBBF24" opacity="0.85">
          {/* Africa / Europe silhouette dots */}
          <circle cx="195" cy="148" r="2.2" />
          <circle cx="208" cy="144" r="2.6" />
          <circle cx="222" cy="150" r="2.2" />
          <circle cx="190" cy="166" r="2.4" />
          <circle cx="205" cy="176" r="3.0" />
          <circle cx="220" cy="172" r="2.2" />
          <circle cx="204" cy="196" r="2.8" />
          <circle cx="216" cy="208" r="2.3" />
          <circle cx="222" cy="232" r="2.5" />
          <circle cx="210" cy="248" r="2.2" />
          {/* Eurasia & Middle East */}
          <circle cx="242" cy="152" r="2.7" />
          <circle cx="258" cy="160" r="2.2" />
          <circle cx="272" cy="176" r="2.8" />
          <circle cx="286" cy="166" r="2.4" />
          <circle cx="264" cy="192" r="2.5" />
          {/* Americas */}
          <circle cx="128" cy="160" r="2.5" />
          <circle cx="142" cy="172" r="2.8" />
          <circle cx="136" cy="192" r="2.3" />
          <circle cx="152" cy="224" r="2.6" />
          <circle cx="160" cy="246" r="2.2" />
        </g>

        {/* Cyan network connection arcs across globe */}
        <g stroke="#22D3EE" strokeWidth="1.2" fill="none" strokeOpacity="0.72">
          <path d="M128 160 Q168 118 208 144" />
          <path d="M208 144 Q240 132 272 176" />
          <path d="M142 172 Q176 164 205 176" />
          <path d="M205 176 Q238 192 264 192" />
          <path d="M152 224 Q188 212 222 232" />
        </g>

        {/* Cyan & white star nodes */}
        <g fill="#7DD3FC">
          <circle cx="105" cy="128" r="2" />
          <circle cx="298" cy="124" r="2.4" />
          <circle cx="318" cy="224" r="2" />
          <circle cx="94" cy="242" r="1.8" />
          <circle cx="246" cy="96" r="2.2" />
        </g>
      </svg>
    </div>
  );
};

interface SparklineProps {
  points: number[];
  color: string;
  id: string;
}

export const GlowingSparkline: React.FC<SparklineProps> = ({ points, color, id }) => {
  const width = 96;
  const height = 40;
  const stepX = width / Math.max(points.length - 1, 1);

  const coords = points.map((val, idx) => {
    const x = idx * stepX;
    const y = height - (val / 100) * (height - 8) - 4;
    return [x, y] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-10 overflow-visible shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${id})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r="2.8"
        fill={color}
      />
    </svg>
  );
};

interface DottedWorldMapProps {
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
}

export const DottedWorldMap: React.FC<DottedWorldMapProps> = ({ selectedRegionId, onSelectRegion }) => {
  const nodes = [
    { id: 'reg-na', label: 'N. America', x: 74, y: 52 },
    { id: 'reg-sa', label: 'S. America', x: 96, y: 98 },
    { id: 'reg-eu', label: 'Europe', x: 158, y: 40 },
    { id: 'reg-af', label: 'Africa', x: 164, y: 80 },
    { id: 'reg-as', label: 'Asia', x: 234, y: 56 },
  ];

  return (
    <div className="h-36 rounded-xl bg-[#040A1A] border border-sky-500/20 relative flex items-center justify-center overflow-hidden p-2">
      <div className="absolute inset-0 bg-[radial-gradient(#00B4FF_1px,transparent_1px)] [background-size:9px_9px] opacity-25" />
      <svg viewBox="0 0 320 130" className="w-full h-full relative z-10" aria-label="Active Node Distribution Map">
        <defs>
          <pattern id="blueDotContinents" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.25" fill="#19C8FF" opacity="0.68" />
          </pattern>
        </defs>
        {/* Dotted continent clusters matching the glowing blue map in the image */}
        <path
          d="M32 30 Q68 22 98 42 Q88 64 62 72 Q42 60 32 30 Z M74 75 Q92 78 96 108 Q80 120 68 100 Z M136 26 Q172 20 188 42 Q165 56 138 48 Z M142 56 Q176 54 190 88 Q168 114 150 98 Q138 78 142 56 Z M192 32 Q258 24 288 58 Q260 86 218 78 Q196 62 192 32 Z M254 88 Q284 85 292 108 Q266 116 252 102 Z"
          fill="url(#blueDotContinents)"
          stroke="rgba(56, 189, 248, 0.35)"
          strokeWidth="0.8"
        />

        <path d="M74 52 Q 116 24 158 40" stroke="rgba(56, 189, 248, 0.45)" strokeDasharray="3 3" fill="none" />
        <path d="M158 40 Q 162 60 164 80" stroke="rgba(56, 189, 248, 0.45)" strokeDasharray="3 3" fill="none" />
        <path d="M164 80 Q 198 62 234 56" stroke="rgba(56, 189, 248, 0.45)" strokeDasharray="3 3" fill="none" />
        <path d="M74 52 Q 82 76 96 98" stroke="rgba(56, 189, 248, 0.45)" strokeDasharray="3 3" fill="none" />

        {nodes.map((node) => {
          const active = selectedRegionId === node.id;
          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => onSelectRegion(node.id)}
            >
              {active && (
                <circle cx={node.x} cy={node.y} r="10" fill="rgba(25, 200, 255, 0.28)" />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={active ? '4.5' : '3.5'}
                fill={active ? '#FBBF24' : '#38BDF8'}
                stroke="#040A1A"
                strokeWidth="1.5"
              />
              <text
                x={node.x}
                y={node.y - 8}
                textAnchor="middle"
                fontSize="8"
                fontWeight={active ? '700' : '500'}
                fill={active ? '#F8FAFC' : '#94A3B8'}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
