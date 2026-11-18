import { useEffect, useId, useRef, useState } from 'react'
import styles from './Reportes.module.css'

const niceMax = max => (max <= 4 ? 4 : Math.ceil(max / 4) * 4)

function Rejilla({ W, m, ih, max }) {
  return [0, 1, 2, 3, 4].map(k => {
    const value = (max / 4) * k
    const y = m.t + ih - (value / max) * ih
    return (
      <g key={k}>
        <line x1={m.l} x2={W - m.r} y1={y} y2={y} className={styles.gridLine} />
        <text x={m.l - 8} y={y + 4} textAnchor="end" className={styles.axisText}>{Math.round(value)}</text>
      </g>
    )
  })
}

function Tooltip({ x, y, W, m, title, value }) {
  const tw = 128
  const tx = Math.min(Math.max(x - tw / 2, m.l), W - m.r - tw)
  const ty = Math.max(y - 50, 2)
  return (
    <g pointerEvents="none">
      <rect x={tx} y={ty} width={tw} height={40} rx="8" className={styles.tipBox} />
      <text x={tx + tw / 2} y={ty + 16} textAnchor="middle" className={styles.tipTitle}>{title}</text>
      <text x={tx + tw / 2} y={ty + 32} textAnchor="middle" className={styles.tipValue}>{value} préstamo{value === 1 ? '' : 's'}</text>
    </g>
  )
}

export function AreaChart({ data, height = 150 }) {
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState(null)
  const ref = useRef(null)
  const [W, setW] = useState(640)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = height
  const m = { t: 14, r: 14, b: 28, l: 34 }
  const iw = W - m.l - m.r
  const ih = H - m.t - m.b
  const max = niceMax(Math.max(...data.map(d => d.value), 1))
  const x = i => m.l + (data.length < 2 ? iw / 2 : (i / (data.length - 1)) * iw)
  const y = v => m.t + ih - (v / max) * ih
  const base = m.t + ih
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${base} L${x(0).toFixed(1)} ${base} Z`
  const step = Math.ceil(data.length / Math.max(4, Math.floor(iw / 70)))
  const slot = iw / Math.max(1, data.length - 1)
  const mostrarPuntos = data.length <= 31

  return (
    <div ref={ref}>
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={styles.svg} role="img" aria-label="Tendencia de préstamos" onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <Rejilla W={W} m={m} ih={ih} max={max} />
      <path d={area} fill={`url(#g${uid})`} />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          {(mostrarPuntos || hover === i) && (
            <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 3} className={styles.dotPoint} />
          )}
          {i % step === 0 && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className={styles.axisText}>{d.label}</text>
          )}
        </g>
      ))}
      {hover != null && (
        <>
          <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={base} className={styles.cursorLine} />
          <Tooltip x={x(hover)} y={y(data[hover].value)} W={W} m={m} title={data[hover].title || data[hover].label} value={data[hover].value} />
        </>
      )}
      {data.map((d, i) => (
        <rect key={`h${i}`} x={x(i) - slot / 2} y={0} width={Math.max(slot, 8)} height={H}
          fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
      ))}
    </svg>
    </div>
  )
}


export function Donut({ data, centerValue, centerLabel }) {
  const [hover, setHover] = useState(null)
  const items = data.filter(d => d.value > 0)
  const total = items.reduce((s, d) => s + d.value, 0)
  const r = 60
  const c = 2 * Math.PI * r
  const gap = items.length > 1 ? 3 : 0
  let acumulado = 0
  const activo = hover != null ? items[hover] : null

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 160 160" className={styles.donut} role="img" aria-label={centerLabel}>
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="22" className={styles.donutTrack} />
        {items.map((d, i) => {
          const largo = (d.value / total) * c
          const offset = acumulado
          acumulado += largo
          const visible = Math.max(largo - gap, 0.5)
          return (
            <circle key={d.label} cx="80" cy="80" r={r} fill="none" stroke={d.color}
              strokeWidth={hover === i ? 26 : 22}
              strokeDasharray={`${visible} ${c - visible}`}
              strokeDashoffset={-offset} transform="rotate(-90 80 80)"
              opacity={hover == null || hover === i ? 1 : 0.35}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          )
        })}
        <text x="80" y="82" textAnchor="middle" className={styles.donutValue}>{activo ? activo.value : centerValue}</text>
        <text x="80" y="100" textAnchor="middle" className={styles.donutLabel}>{activo ? activo.label : centerLabel}</text>
      </svg>
      <ul className={styles.legend}>
        {items.map((d, i) => (
          <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={hover === i ? styles.legendActive : ''}>
            <i className={styles.dot} style={{ background: d.color }} />
            <span>{d.label}</span>
            <strong>{d.value}</strong>
            <small>{total ? Number(((d.value / total) * 100).toFixed(1)) : 0}%</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HBars({ data }) {
  const max = Math.max(1, ...data.map(([, v]) => v))
  return (
    <div className={styles.hbars}>
      {data.map(([name, value], i) => (
        <div className={styles.hbarRow} key={name}>
          <span className={styles.rank}>{i + 1}</span>
          <div className={styles.hbarBody}>
            <span className={styles.hbarName} title={name}>{name}</span>
            <div className={styles.track}><i style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></div>
          </div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}