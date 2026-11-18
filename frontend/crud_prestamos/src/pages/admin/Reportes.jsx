import { useEffect, useMemo, useState } from 'react'
import { listRecursosAdmin } from '../../api/catalogo'
import { listPrestamos } from '../../api/prestamos'
import { apiError, resultados } from '../../api/client'
import { Loading } from '../../components/ui/Feedback'
import ui from '../../styles/components.module.css'
import { ESTADOS_PRESTAMO, TIPOS_USUARIO } from '../../utils/format'
import { AreaChart, Donut, HBars } from './Graficos'
import styles from './Reportes.module.css'

const DIA = 86400000
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MODOS = [['mes', 'Mes'], ['anio', 'Año'], ['rango', 'Rango de fechas']]
const COLOR_ESTADO = {
  RESERVADO: '#d97706', ACTIVO: '#2563eb', VENCIDO: '#dc2626',
  DEVUELTO: '#16a34a', CANCELADO: '#94a3b8', PERDIDO: '#7f1d1d',
}
const ORDEN_ESTADO = {
  RESERVADO: 1, ACTIVO: 2, VENCIDO: 3, DEVUELTO: 4, CANCELADO: 5, PERDIDO: 6,
}
const PALETA = ['#2563eb', '#0d9488', '#d97706', '#9333ea', '#db2777', '#64748b']

const mayuscula = s => s.charAt(0).toUpperCase() + s.slice(1)
const fechaISO = fecha => {
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
const haceDias = dias => { const fecha = new Date(); fecha.setDate(fecha.getDate() - dias); return fechaISO(fecha) }
const fechaCorta = iso => new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '')
const obtenerTodos = async fetcher => {
  const filas = []
  let page = 1
  for (;;) {
    const { data } = await fetcher({ page, page_size: 100 })
    filas.push(...resultados(data))
    if (Array.isArray(data) || !data?.next) return filas
    page += 1
  }
}
const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`

function descargarCSV(prestamos, nombre) {
  const filas = [
    ['Recurso', 'Ejemplar', 'Usuario', 'Tipo de usuario', 'Estado', 'Solicitado', 'Entregado', 'Fecha límite', 'Devuelto', 'Con retraso'],
    ...prestamos.map(p => [p.ficha_recurso_nombre, p.codigo_inventario, p.usuario_email, TIPOS_USUARIO[p.tipo_usuario] || p.tipo_usuario,
      ESTADOS_PRESTAMO[p.estado] || p.estado, p.fecha_prestamo, p.fecha_entrega, p.fecha_limite, p.fecha_devolucion, p.con_retraso ? 'Sí' : 'No']),
  ]
  const blob = new Blob(['\uFEFF' + filas.map(fila => fila.map(csv).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${nombre}.csv`; a.click()
  URL.revokeObjectURL(url)
}

const desdeValido = d => d.getTime() > 0
const hastaValido = d => d.getTime() < 8.6e15

function construirSerie(periodo, inicio, fin) {
  if (!periodo.length) return { puntos: [], unidad: 'día' }
  const fechas = periodo.map(p => new Date(p.fecha_prestamo))
  const ahora = new Date()
  const ultima = new Date(Math.max(...fechas))
  const desde = desdeValido(inicio) ? inicio : new Date(Math.min(...fechas))
  let hasta = hastaValido(fin) ? fin : ultima
  if (hasta > ahora && desde <= ahora) hasta = ahora > ultima ? ahora : ultima
  const total = Math.max(1, Math.round((hasta - desde) / DIA) + 1)
  const unidad = total <= 45 ? 'día' : total <= 180 ? 'semana' : 'mes'

  const inicioBucket = d => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (unidad === 'semana') x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
    if (unidad === 'mes') x.setDate(1)
    return x
  }
  const siguiente = d => {
    const x = new Date(d)
    if (unidad === 'día') x.setDate(x.getDate() + 1)
    else if (unidad === 'semana') x.setDate(x.getDate() + 7)
    else x.setMonth(x.getMonth() + 1)
    return x
  }
  const cuenta = new Map()
  fechas.forEach(f => { const k = fechaISO(inicioBucket(f)); cuenta.set(k, (cuenta.get(k) || 0) + 1) })
  const fmt = (d, o) => d.toLocaleDateString('es-PE', o).replace(/\./g, '')

  const puntos = []
  for (let c = inicioBucket(desde); c <= hasta && puntos.length < 400; c = siguiente(c)) {
    puntos.push({
      label: unidad === 'mes' ? fmt(c, { month: 'short', year: '2-digit' }) : fmt(c, { day: '2-digit', month: 'short' }),
      title: mayuscula(unidad === 'día' ? fmt(c, { weekday: 'short', day: '2-digit', month: 'short' })
        : unidad === 'semana' ? `Semana del ${fmt(c, { day: '2-digit', month: 'short' })}`
          : fmt(c, { month: 'long', year: 'numeric' })),
      value: cuenta.get(fechaISO(c)) || 0,
    })
  }
  return { puntos, unidad }
}

export default function Reportes() {
  const hoy = new Date()
  const [allLoans, setAllLoans] = useState(null)
  const [recursos, setRecursos] = useState([])
  const [modo, setModo] = useState('mes')
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [desde, setDesde] = useState(haceDias(29))
  const [hasta, setHasta] = useState(fechaISO(hoy))
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    Promise.all([obtenerTodos(listPrestamos), obtenerTodos(listRecursosAdmin)])
      .then(([loans, items]) => { if (vigente) { setAllLoans(loans); setRecursos(items) } })
      .catch(err => { if (vigente) setError(apiError(err)) })
    return () => { vigente = false }
  }, [])

  const anios = useMemo(() => {
    const set = new Set([new Date().getFullYear(), anio])
    ;(allLoans || []).forEach(p => { const y = new Date(p.fecha_prestamo).getFullYear(); if (Number.isFinite(y)) set.add(y) })
    return [...set].sort((a, b) => b - a)
  }, [allLoans, anio])

  const report = useMemo(() => {
    if (!allLoans) return null
    let inicio, fin, etiqueta
    if (modo === 'anio') {
      inicio = new Date(anio, 0, 1)
      fin = new Date(anio, 11, 31, 23, 59, 59, 999)
      etiqueta = `Año ${anio}`
    } else if (modo === 'mes') {
      inicio = new Date(anio, mes, 1)
      fin = new Date(anio, mes + 1, 0, 23, 59, 59, 999)
      etiqueta = `${MESES[mes]} ${anio}`
    } else {
      inicio = desde ? new Date(`${desde}T00:00:00`) : new Date(0)
      fin = hasta ? new Date(`${hasta}T23:59:59.999`) : new Date(8640000000000000)
      etiqueta = desde && hasta ? `${fechaCorta(desde)} – ${fechaCorta(hasta)}` : desde ? `Desde ${fechaCorta(desde)}` : hasta ? `Hasta ${fechaCorta(hasta)}` : 'Todo el historial'
    }
    const periodo = allLoans.filter(p => { const d = new Date(p.fecha_prestamo); return d >= inicio && d <= fin })

    const byResource = new Map()
    const byType = new Map()
    const byStatus = new Map()
    periodo.forEach(p => {
      const name = p.ficha_recurso_nombre || 'Sin nombre'
      byResource.set(name, (byResource.get(name) || 0) + 1)
      byType.set(p.tipo_usuario, (byType.get(p.tipo_usuario) || 0) + 1)
      byStatus.set(p.estado, (byStatus.get(p.estado) || 0) + 1)
    })
    const { puntos, unidad } = construirSerie(periodo, inicio, fin)

    return {
      periodo, etiqueta, unidad, serie: puntos, totalLoans: periodo.length,
      topResources: [...byResource].sort((a, b) => b[1] - a[1]).slice(0, 8),
      estados: [...byStatus]
        .sort(([a], [b]) => (ORDEN_ESTADO[a] ?? 99) - (ORDEN_ESTADO[b] ?? 99))
        .map(([key, value]) => ({ label: ESTADOS_PRESTAMO[key] || key, value, color: COLOR_ESTADO[key] || '#64748b' })),
      tipos: [...byType].sort((a, b) => b[1] - a[1]).map(([key, value], i) => ({ label: TIPOS_USUARIO[key] || key || 'Sin dato', value, color: PALETA[i % PALETA.length] })),
    }
  }, [allLoans, modo, anio, mes, desde, hasta])

  const totalUnidades = recursos.reduce((sum, item) => sum + (Number(item.total_ejemplares) || 0), 0)
  const disponibles = recursos.reduce((sum, item) => sum + (Number(item.disponibles) || 0), 0)
  const pctDisponible = totalUnidades ? Math.round(disponibles / totalUnidades * 100) : 0

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div><span className={ui.eyebrow}>ANÁLISIS</span><h2>Reportes</h2><p></p></div>
        <button className={`${ui.button} ${ui.secondary}`} disabled={!report?.periodo.length}
          onClick={() => descargarCSV(report.periodo, `reporte-prestamos-${report.etiqueta.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-')}`)}>Descargar CSV</button>
      </div>

      <section className={`${ui.panel} ${styles.filters}`}>
        <div className={`${ui.filter} ${styles.modeBox}`}>
          Ver por
          <div className={styles.modes} role="group" aria-label="Tipo de selección">
            {MODOS.map(([key, label]) => (
              <button type="button" key={key} className={modo === key ? styles.modoActivo : ''} aria-pressed={modo === key} onClick={() => setModo(key)}>{label}</button>
            ))}
          </div>
        </div>
        {modo !== 'rango' && (
          <label className={ui.filter}>Año
            <select value={anio} onChange={e => setAnio(Number(e.target.value))}>{anios.map(y => <option key={y} value={y}>{y}</option>)}</select>
          </label>
        )}
        {modo === 'mes' && (
          <label className={ui.filter}>Mes
            <select value={mes} onChange={e => setMes(Number(e.target.value))}>{MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
          </label>
        )}
        {modo === 'rango' && <>
          <label className={ui.filter}>Desde<input type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} /></label>
          <label className={ui.filter}>Hasta<input type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} /></label>
        </>}
      </section>

      {error ? <p className={`${ui.panel} ${ui.error}`}>{error}</p> : !report ? <Loading /> : <>
        <section className={`${ui.panel} ${styles.chart}`}>
          <div className={ui.panelHeading}><div><h3>Evolución de préstamos</h3><p>{report.etiqueta} · {report.totalLoans} {report.totalLoans === 1 ? 'prestamo' : 'prestamos'}</p></div></div>
          {report.serie.length ? <AreaChart data={report.serie} /> : <p className={ui.empty}>No hay actividad en este periodo.</p>}
        </section>

        <div className={styles.columns}>
          <section className={`${ui.panel} ${styles.chart}`}>
            <h3>Distribución por estado</h3>
            {report.estados.length ? <Donut data={report.estados} centerValue={report.totalLoans} centerLabel="prestamos" /> : <p className={ui.empty}>Sin registros para mostrar.</p>}
          </section>
          <section className={`${ui.panel} ${styles.chart}`}>
            <h3>Actividad por tipo de usuario</h3>
            {report.tipos.length ? <Donut data={report.tipos} centerValue={report.totalLoans} centerLabel="préstamos" /> : <p className={ui.empty}>Sin actividad en el periodo.</p>}
          </section>
        </div>

        <div className={styles.columns}>
          <section className={`${ui.panel} ${styles.chart} ${styles.centeredChart}`}>
            <div className={ui.panelHeading}><div><h3>Recursos mas solicitados</h3><p>{report.etiqueta}</p></div></div>
            {report.topResources.length ? <HBars data={report.topResources} /> : <p className={ui.empty}>Sin registros para mostrar.</p>}
          </section>
          
        </div>
      </>}
    </main>
  )
}