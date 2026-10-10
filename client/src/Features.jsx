import { FEATURES, GROUPS } from '../../shared/features.js'

export const LABEL = Object.fromEntries(FEATURES.map(f => [f.key, f.label]))

export function FeaturePicker({ legend, selected, onChange, options }) {
  const toggle = key => onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key])
  return (
    <fieldset className="picker">
      <legend>{legend}</legend>
      {Object.entries(GROUPS).map(([group, title]) => {
        const items = FEATURES.filter(f => f.group === group && (!options || options.includes(f.key)))
        return items.length > 0 && (
          <div key={group}>
            <p className="group">{title}</p>
            <div className="options">
              {items.map(f => (
                <label key={f.key} className="check">
                  <input type="checkbox" checked={selected.includes(f.key)} onChange={() => toggle(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </fieldset>
  )
}

export function FeatureTags({ keys, highlight = [] }) {
  return (
    <ul className="tags">
      {keys.map(k => (
        <li key={k} className={highlight.includes(k) ? 'tag hit' : 'tag'}>
          {highlight.includes(k) && <span aria-hidden="true">✓ </span>}
          {LABEL[k]}
        </li>
      ))}
    </ul>
  )
}

export function Rating({ rating, reviewCount }) {
  if (!reviewCount) return <p className="rating muted">No reviews yet</p>
  return (
    <p className="rating">
      <span aria-hidden="true">★ </span>
      {rating.toFixed(1)} out of 5 · {reviewCount} review{reviewCount > 1 ? 's' : ''}
    </p>
  )
}
