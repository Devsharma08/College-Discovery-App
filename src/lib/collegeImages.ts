import type { College } from '../types';

const palettes: Record<string, { sky: string; ground: string; primary: string; accent: string; glow: string }> = {
  engineering: {
    sky: '#dbeafe',
    ground: '#d1fae5',
    primary: '#1e3a8a',
    accent: '#0f766e',
    glow: '#60a5fa',
  },
  medical: {
    sky: '#e0f2fe',
    ground: '#dcfce7',
    primary: '#155e75',
    accent: '#16a34a',
    glow: '#67e8f9',
  },
  management: {
    sky: '#fef3c7',
    ground: '#e0e7ff',
    primary: '#7c2d12',
    accent: '#4338ca',
    glow: '#f59e0b',
  },
  university: {
    sky: '#e2e8f0',
    ground: '#d9f99d',
    primary: '#1f2937',
    accent: '#31572c',
    glow: '#f4a261',
  },
};

const categoryLabels: Record<string, string> = {
  engineering: 'Tech Campus',
  medical: 'Medical Campus',
  management: 'Business School',
  university: 'University Campus',
};

const getCategory = (college?: College) => {
  const category = college?.popularFor?.toLowerCase() || 'university';
  return palettes[category] ? category : 'university';
};

const getStableNumber = (value: string, max: number) => {
  const total = value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return total % max;
};

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const createCampusSvg = (college: College | undefined, variant: number, wide: boolean) => {
  const category = getCategory(college);
  const palette = palettes[category];
  const name = college?.name || 'CampusFinder';
  const city = college?.city || college?.location?.split(',')[0] || 'India';
  const seed = getStableNumber(`${name}-${city}-${variant}`, 8);
  const width = wide ? 1600 : 900;
  const height = wide ? 920 : 650;
  const title = escapeSvgText(name.length > 34 ? `${name.slice(0, 32)}...` : name);
  const subtitle = escapeSvgText(`${categoryLabels[category]} - ${city}`);
  const domeX = 450 + seed * 18;
  const towerX = 190 + seed * 10;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.sky}"/>
      <stop offset="0.55" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${palette.ground}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" x2="1">
      <stop offset="0" stop-color="${palette.primary}"/>
      <stop offset="1" stop-color="${palette.accent}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#sky)"/>
  <circle cx="${width - 190}" cy="145" r="110" fill="${palette.glow}" opacity="0.22"/>
  <circle cx="${width - 280}" cy="230" r="170" fill="${palette.accent}" opacity="0.12"/>
  <path d="M0 ${height - 170} C260 ${height - 245} 430 ${height - 70} 720 ${height - 150} C1030 ${height - 240} 1260 ${height - 115} ${width} ${height - 190} L${width} ${height} L0 ${height}Z" fill="${palette.accent}" opacity="0.18"/>
  <g filter="url(#shadow)">
    <rect x="${towerX}" y="${height - 410}" width="120" height="285" rx="10" fill="#f8fafc"/>
    <rect x="${towerX + 28}" y="${height - 455}" width="64" height="62" rx="8" fill="url(#glass)"/>
    <rect x="${towerX + 35}" y="${height - 340}" width="50" height="50" rx="5" fill="${palette.primary}" opacity="0.78"/>
    <rect x="${towerX + 35}" y="${height - 265}" width="50" height="50" rx="5" fill="${palette.primary}" opacity="0.78"/>
    <rect x="${domeX - 210}" y="${height - 360}" width="520" height="235" rx="18" fill="#fffaf0"/>
    <path d="M${domeX - 235} ${height - 360} L${domeX + 335} ${height - 360} L${domeX + 282} ${height - 430} L${domeX - 182} ${height - 430}Z" fill="url(#glass)"/>
    <path d="M${domeX - 18} ${height - 430} C${domeX + 28} ${height - 505} ${domeX + 118} ${height - 505} ${domeX + 165} ${height - 430}Z" fill="${palette.glow}" opacity="0.92"/>
    <rect x="${domeX - 145}" y="${height - 300}" width="74" height="175" rx="36" fill="${palette.primary}" opacity="0.82"/>
    <rect x="${domeX - 25}" y="${height - 300}" width="74" height="175" rx="36" fill="${palette.primary}" opacity="0.82"/>
    <rect x="${domeX + 95}" y="${height - 300}" width="74" height="175" rx="36" fill="${palette.primary}" opacity="0.82"/>
    <rect x="${domeX - 250}" y="${height - 125}" width="600" height="35" rx="8" fill="${palette.primary}"/>
  </g>
  <g opacity="0.86">
    <rect x="${width - 420}" y="${height - 250}" width="180" height="110" rx="18" fill="#ffffff"/>
    <rect x="${width - 390}" y="${height - 220}" width="120" height="14" rx="7" fill="${palette.primary}" opacity="0.82"/>
    <rect x="${width - 390}" y="${height - 190}" width="88" height="12" rx="6" fill="${palette.accent}" opacity="0.7"/>
    <rect x="${width - 390}" y="${height - 165}" width="132" height="12" rx="6" fill="#94a3b8" opacity="0.48"/>
  </g>
  <text x="64" y="90" font-family="Inter, Arial, sans-serif" font-size="${wide ? 54 : 36}" font-weight="900" fill="${palette.primary}">${title}</text>
  <text x="66" y="${wide ? 140 : 132}" font-family="Inter, Arial, sans-serif" font-size="${wide ? 24 : 18}" font-weight="800" fill="${palette.accent}">${subtitle}</text>
</svg>`;
};

const toDataUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const getCollegeImage = (college: College, variant = 0) => toDataUrl(createCampusSvg(college, variant, false));

export const getHeroImage = (college?: College) => toDataUrl(createCampusSvg(college, 7, true));
