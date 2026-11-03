import { CONFIG } from './config.js'

export const TAG_META = {
  sef: { label: 'Şefin Seçimi', icon: '★' },
  aci: { label: 'Acılı', icon: '🌶' },
  vejetaryen: { label: 'Vejetaryen', icon: '🌱' },
  vegan: { label: 'Vegan', icon: 'V' },
  glutensiz: { label: 'Glutensiz', icon: 'GF' },
}

const DIET_TAGS = ['vegan', 'glutensiz']

export function TagBadges({ name, tags, compact = false }) {
  const on = Object.keys(TAG_META).filter((k) => {
    if (!CONFIG.SHOW_DIET_TAGS && DIET_TAGS.includes(k)) return false
    return (tags[k] || []).includes(name)
  })
  if (!on.length) return null
  return (
    <div className={`tagrow ${compact ? 'compact' : ''}`}>
      {on.map((k) => (
        <span key={k} className={'tg tg-' + k} title={TAG_META[k].label}>
          <span className="tg-ico">{TAG_META[k].icon}</span>
          <span className="tg-lbl">{TAG_META[k].label}</span>
        </span>
      ))}
    </div>
  )
}

