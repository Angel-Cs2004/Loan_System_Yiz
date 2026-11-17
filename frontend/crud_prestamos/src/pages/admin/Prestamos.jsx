import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPrestamos } from "../../api/prestamos";
import PrestamoAcciones from "../../components/admin/PrestamoAcciones";
import { EmptyState, Loading } from "../../components/ui/Feedback";
import Pagination from "../../components/ui/Pagination";
import StatusBadge from "../../components/ui/StatusBadge";
import { useDebounced, usePaginatedList } from "../../hooks/useApiList";
import ui from "../../styles/components.module.css";
import {
  ESTADOS_PRESTAMO,
  TIPOS_USUARIO,
  formatearFecha,
  formatearFechaHora,
} from "../../utils/format";

const FILTROS = [["", "Todos"], ...Object.entries(ESTADOS_PRESTAMO)];

// Muestra la fecha más relevante según el estado del préstamo.
function FechaPrestamo({ prestamo }) {
  let fecha = prestamo.fecha_limite;
  let descripcion = "Devolver hasta";
  let mostrarHora = false;

  switch (prestamo.estado) {
    case "RESERVADO":
      fecha = prestamo.recoger_antes_de;
      descripcion = "Recoger antes de";
      mostrarHora = true;
      break;

    case "DEVUELTO":
      fecha = prestamo.fecha_devolucion;
      descripcion = "Devuelto el";

      if (prestamo.fecha_limite) {
        descripcion += ` · Límite: ${formatearFecha(prestamo.fecha_limite)}`;
      }
      break;

    case "CANCELADO":
      return <span className={ui.cellSecondary}>—</span>;

    default:
      break;
  }

  if (!fecha) {
    return <span className={ui.cellSecondary}>Sin fecha registrada</span>;
  }

  return (
    <>
      <span>
        {mostrarHora ? formatearFechaHora(fecha) : formatearFecha(fecha)}
      </span>
      <span className={ui.cellSecondary}>{descripcion}</span>
    </>
  );
}

export default function Prestamos() {
  const [params, setParams] = useSearchParams();
  const estado = params.get("estado") || "";
  const usuario = params.get("usuario") || "";
  const [codigo, setCodigo] = useState(params.get("codigo_inventario") || "");
  const codigoBuscado = useDebounced(codigo.trim());

  const lista = usePaginatedList(listPrestamos, {
    estado,
    usuario,
    codigo_inventario: codigoBuscado,
  });

  const cambiarParam = (key, value) => {
    const siguientes = new URLSearchParams(params);

    if (value) siguientes.set(key, value);
    else siguientes.delete(key);

    setParams(siguientes, { replace: true });
  };

  return (
    <main className={ui.page}>
      <div className={ui.pageHeading}>
        <div>
          <span className={ui.eyebrow}>CIRCULACIÓN</span>
          <h2>Préstamos</h2>
          <p>Reservas por entregar, préstamos en curso y todo el historial.</p>
        </div>

        <Link className={ui.button} to="/admin/mostrador">
          + Registrar en mostrador
        </Link>
      </div>

      <section className={`${ui.panel} ${ui.tablePanel}`}>
        <div className={ui.toolbar}>
          <div className={ui.segmented}>
            {FILTROS.map(([value, label]) => (
              <button
                key={value}
                className={estado === value ? ui.segmentActive : ""}
                onClick={() => cambiarParam("estado", value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className={`${ui.filter} ${ui.grow}`}>
            Código de inventario
            <input
              type="search"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              placeholder="Ej. LAP-002"
            />
          </label>

          {usuario && (
            <button
              className={`${ui.button} ${ui.secondary} ${ui.small}`}
              onClick={() => cambiarParam("usuario", "")}
            >
              Quitar filtro de usuario
            </button>
          )}
        </div>

        {lista.loading && !lista.results.length ? (
          <Loading />
        ) : lista.error ? (
          <p className={`${ui.empty} ${ui.error}`}>{lista.error}</p>
        ) : !lista.results.length ? (
          <EmptyState
            title="No hay préstamos"
            message="No hay registros con estos filtros."
          />
        ) : (
          <div className={ui.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th>Usuario</th>
                  <th>Solicitado</th>
                  <th>Fechas</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {lista.results.map((prestamo) => (
                  <tr key={prestamo.id}>
                    <td>
                      <Link
                        className={ui.rowLink}
                        to={`/admin/prestamos/${prestamo.id}`}
                      >
                        {prestamo.ficha_recurso_nombre}
                      </Link>
                      <span className={ui.cellSecondary}>
                        {prestamo.codigo_inventario}
                      </span>
                    </td>

                    <td>
                      <Link
                        className={ui.rowLink}
                        to={`/admin/usuarios/${prestamo.usuario}`}
                      >
                        {prestamo.usuario_email}
                      </Link>
                      <span className={ui.cellSecondary}>
                        {TIPOS_USUARIO[prestamo.tipo_usuario]}
                      </span>
                    </td>

                    <td className={ui.nowrap}>
                      {formatearFecha(prestamo.fecha_prestamo)}
                    </td>

                    <td className={ui.nowrap}>
                      <FechaPrestamo prestamo={prestamo} />
                    </td>

                    <td>
                      <StatusBadge
                        value={prestamo.estado}
                        labels={ESTADOS_PRESTAMO}
                      />
                      {prestamo.con_retraso &&
                        prestamo.estado === "DEVUELTO" && (
                          <span className={ui.cellSecondary}>Con retraso</span>
                        )}
                    </td>

                    <td>
                      <PrestamoAcciones
                        prestamo={prestamo}
                        compact
                        only={["entregar", "devolver"]}
                        onDone={lista.reload}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={lista.page}
          count={lista.count}
          onChange={lista.setPage}
        />
      </section>
    </main>
  );
}
