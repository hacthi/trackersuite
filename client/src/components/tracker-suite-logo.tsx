import { useTheme } from "@/hooks/useTheme";
import { useEffect, useState } from "react";

interface TrackerSuiteLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animate?: boolean;
  className?: string;
  mobileSize?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function TrackerSuiteLogo({ 
  size = "md", 
  showText = true, 
  animate = true,
  className = "",
  mobileSize
}: TrackerSuiteLogoProps) {
  const { actualTheme } = useTheme();
  
  const sizeMap = {
    xs: { width: 100, height: 30 },
    sm: { width: 140, height: 42 },
    md: { width: 180, height: 54 },
    lg: { width: 220, height: 66 },
    xl: { width: 260, height: 78 }
  };

  // Mobile size detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use mobileSize on mobile devices if provided
  const effectiveSize = mobileSize && isMobile ? mobileSize : size;
  const dimensions = sizeMap[effectiveSize];
  const scale = dimensions.width / 220; // Base size is 220x66

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        viewBox="0 0 220 66" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="select-none"
      >
        <defs>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: actualTheme === 'dark' ? '#60A5FA' : '#3B82F6', stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: actualTheme === 'dark' ? '#A78BFA' : '#8B5CF6', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: actualTheme === 'dark' ? '#3B82F6' : '#1E40AF', stopOpacity: 1}} />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#06B6D4', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#0891B2', stopOpacity: 1}} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main Logo Circle */}
        <circle cx="30" cy="30" r="25" fill="url(#primaryGradient)" filter="url(#glow)"/>
        
        {/* Central Network Hub */}
        <circle cx="30" cy="30" r="4" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
        
        {/* Connection Lines (representing relationships) */}
        <line x1="30" y1="30" x2="20" y2="15" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
        <line x1="30" y1="30" x2="40" y2="15" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
        <line x1="30" y1="30" x2="45" y2="30" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
        <line x1="30" y1="30" x2="40" y2="45" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
        <line x1="30" y1="30" x2="20" y2="45" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
        <line x1="30" y1="30" x2="15" y2="30" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
        
        {/* Client Nodes (smaller circles representing clients) */}
        <circle cx="20" cy="15" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
        <circle cx="40" cy="15" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
        <circle cx="45" cy="30" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
        <circle cx="40" cy="45" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
        <circle cx="20" cy="45" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
        <circle cx="15" cy="30" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
        
        {/* Activity Indicators (small dots showing engagement) */}
        {animate && (
          <>
            <circle cx="22" cy="17" r="1.5" fill="url(#accentGradient)">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="38" cy="17" r="1.5" fill="url(#accentGradient)">
              <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="43" cy="32" r="1.5" fill="url(#accentGradient)">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite"/>
            </circle>
          </>
        )}
        
        {showText && (
          <>
            {/* Company Name */}
            <text 
              x="70" 
              y="22" 
              fontFamily="system-ui, -apple-system, sans-serif" 
              fontSize={Math.min(16 * scale, 16)} 
              fontWeight="700" 
              fill="url(#primaryGradient)"
            >
              Tracker Suite
            </text>
            
            {/* Tagline */}
            <text 
              x="70" 
              y="38" 
              fontFamily="system-ui, -apple-system, sans-serif" 
              fontSize={Math.min(9 * scale, 10)} 
              fontWeight="400" 
              fill={actualTheme === 'dark' ? '#94A3B8' : '#64748B'}
            >
              Client Relationship Excellence
            </text>
            
            {/* Subtle tracking indicator */}
            <rect x="70" y="52" width="140" height="2" fill={actualTheme === 'dark' ? '#334155' : '#E2E8F0'} rx="1"/>
            {animate && (
              <rect x="70" y="52" width="45" height="2" fill="url(#accentGradient)" rx="1">
                <animate attributeName="width" values="0;100;0" dur="3s" repeatCount="indefinite"/>
              </rect>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

// Icon-only version for small spaces
export function TrackerSuiteIcon({ 
  size = 24, 
  animate = false,
  className = "" 
}: { 
  size?: number; 
  animate?: boolean;
  className?: string;
}) {
  const { actualTheme } = useTheme();
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 60 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      <defs>
        <linearGradient id={`iconGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: actualTheme === 'dark' ? '#60A5FA' : '#3B82F6', stopOpacity: 1}} />
          <stop offset="50%" style={{stopColor: actualTheme === 'dark' ? '#A78BFA' : '#8B5CF6', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: actualTheme === 'dark' ? '#3B82F6' : '#1E40AF', stopOpacity: 1}} />
        </linearGradient>
        <linearGradient id={`iconAccent-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#06B6D4', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#0891B2', stopOpacity: 1}} />
        </linearGradient>
        <filter id={`iconGlow-${size}`}>
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main Logo Circle */}
      <circle cx="30" cy="30" r="25" fill={`url(#iconGradient-${size})`} filter={`url(#iconGlow-${size})`}/>
      
      {/* Central Network Hub */}
      <circle cx="30" cy="30" r="4" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
      
      {/* Connection Lines */}
      <line x1="30" y1="30" x2="20" y2="15" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
      <line x1="30" y1="30" x2="40" y2="15" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
      <line x1="30" y1="30" x2="45" y2="30" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
      <line x1="30" y1="30" x2="40" y2="45" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
      <line x1="30" y1="30" x2="20" y2="45" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
      <line x1="30" y1="30" x2="15" y2="30" stroke={actualTheme === 'dark' ? '#F1F5F9' : 'white'} strokeWidth="2" opacity="0.9"/>
      
      {/* Client Nodes */}
      <circle cx="20" cy="15" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
      <circle cx="40" cy="15" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
      <circle cx="45" cy="30" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
      <circle cx="40" cy="45" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
      <circle cx="20" cy="45" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
      <circle cx="15" cy="30" r="3" fill={actualTheme === 'dark' ? '#F1F5F9' : 'white'}/>
      
      {/* Activity Indicators */}
      {animate && (
        <>
          <circle cx="22" cy="17" r="1.5" fill={`url(#iconAccent-${size})`}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="38" cy="17" r="1.5" fill={`url(#iconAccent-${size})`}>
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
          </circle>
        </>
      )}
    </svg>
  );
}