"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { EMPRESAS } from "../lib/empresas";

type Rol = "ADMIN" | "USUARIO";

type Estado =
  | "PENDIENTE"
  | "EN_CURSO"
  | "RESUELTO";

type EstadoFiltro =
  | "TODOS"
  | Estado;

type Importancia =
  | "BAJA"
  | "MEDIA"
  | "ALTA"
  | "URGENTE";

type Ticket = {
  id: string;
  numero: number | null;
  creado_por: string;
  nombre: string;
  telefono: string | null;
  email: string;
  empresa: string;
  titulo: string;
  descripcion: string;
  importancia: Importancia;
  estado: Estado;
  asignado_a: string | null;
  creado_en: string;
  actualizado_en: string;
  resuelto_en: string | null;
  resuelto_por: string | null;
};

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [rol, setRol] =
    useState<Rol | null>(null);

  const [email, setEmail] =
    useState("");

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [errorCarga, setErrorCarga] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [fecha, setFecha] =
    useState("TODAS");

  const [empresa, setEmpresa] =
    useState("TODAS");

  const [importancia, setImportancia] =
    useState("TODAS");

  const [estado, setEstado] =
    useState<EstadoFiltro>("TODOS");

  const [orden, setOrden] =
    useState("RECIENTES");

  const [actualizandoId, setActualizandoId] =
    useState<string | null>(null);

  /* =========================================================
     CARGA
  ========================================================= */

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setErrorCarga("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const {
      data: acceso,
      error: accesoError,
    } = await supabase
      .from("it_usuarios")
      .select("rol, activo")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      accesoError ||
      !acceso ||
      !acceso.activo
    ) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    const rolActual =
      acceso.rol as Rol;

    setRol(rolActual);
    setEmail(user.email ?? "");

    const {
      data: ticketsData,
      error: ticketsError,
    } = await supabase
      .from("it_tickets")
      .select(`
        id,
        numero,
        creado_por,
        nombre,
        telefono,
        email,
        empresa,
        titulo,
        descripcion,
        importancia,
        estado,
        asignado_a,
        creado_en,
        actualizado_en,
        resuelto_en,
        resuelto_por
      `)
      .order("creado_en", {
        ascending: false,
      });

    if (ticketsError) {
      console.error(ticketsError);

      setErrorCarga(
        `No se han podido cargar los tickets: ${ticketsError.message}`
      );

      setTickets([]);
      setLoading(false);
      return;
    }

    setTickets(
      (ticketsData ?? []) as Ticket[]
    );

    setLoading(false);
  }

  /* =========================================================
     CONTADORES
  ========================================================= */

  const pendientes = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.estado === "PENDIENTE"
      ).length,
    [tickets]
  );

  const enCurso = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.estado === "EN_CURSO"
      ).length,
    [tickets]
  );

  const resueltos = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.estado === "RESUELTO"
      ).length,
    [tickets]
  );

  /* =========================================================
     FILTROS
  ========================================================= */

  const ticketsFiltrados =
    useMemo(() => {
      let resultado = [...tickets];

      if (estado !== "TODOS") {
        resultado =
          resultado.filter(
            (ticket) =>
              ticket.estado === estado
          );
      }

      if (fecha !== "TODAS") {
        const ahora = new Date();

        let limite = new Date();

        if (fecha === "HOY") {
          limite = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate()
          );
        }

        if (fecha === "7_DIAS") {
          limite.setDate(
            ahora.getDate() - 7
          );
        }

        if (fecha === "30_DIAS") {
          limite.setDate(
            ahora.getDate() - 30
          );
        }

        resultado =
          resultado.filter(
            (ticket) =>
              new Date(
                ticket.creado_en
              ) >= limite
          );
      }

      /*
       * ADMIN:
       * búsqueda + empresa + importancia
       */
      if (rol === "ADMIN") {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        if (texto) {
          resultado =
            resultado.filter(
              (ticket) =>
                ticket.nombre
                  ?.toLowerCase()
                  .includes(texto) ||
                ticket.empresa
                  ?.toLowerCase()
                  .includes(texto) ||
                ticket.titulo
                  ?.toLowerCase()
                  .includes(texto) ||
                ticket.email
                  ?.toLowerCase()
                  .includes(texto) ||
                String(
                  ticket.numero ?? ""
                ).includes(texto)
            );
        }

        if (empresa !== "TODAS") {
          resultado =
            resultado.filter(
              (ticket) =>
                ticket.empresa ===
                empresa
            );
        }

        if (
          importancia !== "TODAS"
        ) {
          resultado =
            resultado.filter(
              (ticket) =>
                ticket.importancia ===
                importancia
            );
        }
      }

      resultado.sort((a, b) => {
        const fechaA =
          new Date(
            a.creado_en
          ).getTime();

        const fechaB =
          new Date(
            b.creado_en
          ).getTime();

        if (
          rol === "ADMIN" &&
          orden === "ANTIGUOS"
        ) {
          return fechaA - fechaB;
        }

        return fechaB - fechaA;
      });

      return resultado;
    }, [
      tickets,
      rol,
      estado,
      fecha,
      empresa,
      importancia,
      busqueda,
      orden,
    ]);

  /* =========================================================
     CAMBIAR ESTADO
  ========================================================= */

  async function cambiarEstadoTicket(
    ticketId: string,
    nuevoEstado: Estado
  ) {
    if (rol !== "ADMIN") {
      return;
    }

    setActualizandoId(ticketId);
    setErrorCarga("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const ahora =
      new Date().toISOString();

    const cambios =
      nuevoEstado === "RESUELTO"
        ? {
            estado: nuevoEstado,
            actualizado_en: ahora,
            resuelto_en: ahora,
            resuelto_por: user.id,
          }
        : {
            estado: nuevoEstado,
            actualizado_en: ahora,
            resuelto_en: null,
            resuelto_por: null,
          };

    const { error } =
      await supabase
        .from("it_tickets")
        .update(cambios)
        .eq("id", ticketId);

    if (error) {
      console.error(error);

      setErrorCarga(
        `No se ha podido actualizar el estado: ${error.message}`
      );

      setActualizandoId(null);
      return;
    }

    setTickets((actuales) =>
      actuales.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              ...cambios,
            }
          : ticket
      )
    );

    setActualizandoId(null);
  }

  /* =========================================================
     LIMPIAR FILTROS
  ========================================================= */

  function limpiarFiltros() {
    setBusqueda("");
    setFecha("TODAS");
    setEmpresa("TODAS");
    setImportancia("TODAS");
    setEstado("TODOS");
    setOrden("RECIENTES");
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main style={styles.loading}>
        <div
          style={styles.loadingIcon}
        >
          <SupportIcon
            color="#00AF9A"
          />
        </div>

        <span>
          Cargando tickets...
        </span>
      </main>
    );
  }

  /* =========================================================
     PÁGINA
  ========================================================= */

  return (
    <main style={styles.page}>
      {/* HEADER */}

      <header style={styles.header}>
        <div
          style={styles.headerInner}
        >
          <div style={styles.brand}>
            <div
              style={styles.brandIcon}
            >
              <SupportIcon
                color="#ffffff"
              />
            </div>

            <div>
              <div
                style={
                  styles.brandTitle
                }
              >
                IT Support
              </div>

              <div
                style={
                  styles.brandSubtitle
                }
              >
                Gestión de incidencias
                informáticas
              </div>
            </div>
          </div>

          <div
            style={
              styles.headerActions
            }
          >
            {/* MANUALES */}

            <a
              href="https://globalcoffeeindustriessa.sharepoint.com/:f:/g/IgAX4zmqxaTCQ6GyOQ9lakgSAeFKPNoWDIPRPPApKvf1Vhs?e=lq5SPl"
              target="_blank"
              rel="noopener noreferrer"
              style={
                styles.manualsLink
              }
            >
              <BookIcon />

              <span>Manuales</span>

              <ExternalIcon />
            </a>

            <div
              style={styles.headerDivider}
            />

            <div
              style={styles.userArea}
            >
              <div
                style={styles.userInfo}
              >
                <span
                  style={
                    styles.userEmail
                  }
                >
                  {email}
                </span>

                <span
                  style={styles.role}
                >
                  {rol === "ADMIN"
                    ? "ADMINISTRADOR"
                    : "USUARIO"}
                </span>
              </div>

              <button
                type="button"
                onClick={
                  cerrarSesion
                }
                style={
                  styles.logoutButton
                }
                title="Cerrar sesión"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}

      <div style={styles.container}>
        {/* CABECERA */}

        <section
          style={styles.pageHeading}
        >
          <div>
            <h1 style={styles.title}>
              {rol === "ADMIN"
                ? "Gestión de tickets"
                : "Mis incidencias"}
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              {rol === "ADMIN"
                ? "Consulta, organiza y gestiona las incidencias de soporte."
                : "Consulta tus incidencias y realiza su seguimiento."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/nuevo-ticket"
              )
            }
            style={
              styles.newTicketButton
            }
          >
            <PlusIcon />
            Nueva incidencia
          </button>
        </section>

        {/* ERROR */}

        {errorCarga && (
          <div
            style={
              styles.errorMessage
            }
          >
            <AlertIcon />
            {errorCarga}
          </div>
        )}

        {/* CONTADORES */}

        <section
          style={styles.statusGrid}
        >
          <StatusCard
            title="Pendientes"
            count={pendientes}
            estado="PENDIENTE"
            activo={
              estado === "PENDIENTE"
            }
            onClick={() =>
              setEstado(
                estado === "PENDIENTE"
                  ? "TODOS"
                  : "PENDIENTE"
              )
            }
          />

          <StatusCard
            title="En curso"
            count={enCurso}
            estado="EN_CURSO"
            activo={
              estado === "EN_CURSO"
            }
            onClick={() =>
              setEstado(
                estado === "EN_CURSO"
                  ? "TODOS"
                  : "EN_CURSO"
              )
            }
          />

          <StatusCard
            title="Resueltos"
            count={resueltos}
            estado="RESUELTO"
            activo={
              estado === "RESUELTO"
            }
            onClick={() =>
              setEstado(
                estado === "RESUELTO"
                  ? "TODOS"
                  : "RESUELTO"
              )
            }
          />
        </section>

        {/* FILTROS */}

        <section
          style={styles.filtersCard}
        >
          {rol === "ADMIN" && (
            <div
              style={
                styles.searchWrapper
              }
            >
              <SearchIcon />

              <input
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar por nº, usuario, empresa, correo o incidencia..."
                style={
                  styles.searchInput
                }
              />
            </div>
          )}

          <div
            style={styles.filtersRow}
          >
            <FilterField
              label="Fecha"
            >
              <select
                value={fecha}
                onChange={(e) =>
                  setFecha(
                    e.target.value
                  )
                }
                style={styles.select}
              >
                <option value="TODAS">
                  Todas
                </option>

                <option value="HOY">
                  Hoy
                </option>

                <option value="7_DIAS">
                  Últimos 7 días
                </option>

                <option value="30_DIAS">
                  Últimos 30 días
                </option>
              </select>
            </FilterField>

            <FilterField
              label="Estado"
            >
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target
                      .value as EstadoFiltro
                  )
                }
                style={styles.select}
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="PENDIENTE">
                  Pendiente
                </option>

                <option value="EN_CURSO">
                  En curso
                </option>

                <option value="RESUELTO">
                  Resuelto
                </option>
              </select>
            </FilterField>

            {rol === "ADMIN" && (
              <>
                <FilterField
                  label="Empresa"
                >
                  <select
                    value={empresa}
                    onChange={(e) =>
                      setEmpresa(
                        e.target.value
                      )
                    }
                    style={
                      styles.select
                    }
                  >
                    <option value="TODAS">
                      Todas
                    </option>

                    {EMPRESAS.map(
                      (
                        empresaItem
                      ) => (
                        <option
                          key={
                            empresaItem
                          }
                          value={
                            empresaItem
                          }
                        >
                          {
                            empresaItem
                          }
                        </option>
                      )
                    )}
                  </select>
                </FilterField>

                <FilterField
                  label="Importancia"
                >
                  <select
                    value={
                      importancia
                    }
                    onChange={(e) =>
                      setImportancia(
                        e.target.value
                      )
                    }
                    style={
                      styles.select
                    }
                  >
                    <option value="TODAS">
                      Todas
                    </option>

                    <option value="BAJA">
                      Baja
                    </option>

                    <option value="MEDIA">
                      Media
                    </option>

                    <option value="ALTA">
                      Alta
                    </option>

                    <option value="URGENTE">
                      Urgente
                    </option>
                  </select>
                </FilterField>

                <FilterField
                  label="Orden"
                >
                  <select
                    value={orden}
                    onChange={(e) =>
                      setOrden(
                        e.target.value
                      )
                    }
                    style={
                      styles.select
                    }
                  >
                    <option value="RECIENTES">
                      Más recientes
                    </option>

                    <option value="ANTIGUOS">
                      Más antiguos
                    </option>
                  </select>
                </FilterField>
              </>
            )}

            <button
              type="button"
              onClick={
                limpiarFiltros
              }
              style={
                styles.clearButton
              }
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        {/* LISTADO */}

        <section
          style={styles.listCard}
        >
          <div
            style={styles.listHeader}
          >
            <div>
              <h2
                style={
                  styles.listTitle
                }
              >
                {rol === "ADMIN"
                  ? "Incidencias"
                  : "Mis tickets"}
              </h2>

              <p
                style={
                  styles.listSubtitle
                }
              >
                {ticketsFiltrados.length}{" "}
                {ticketsFiltrados.length ===
                1
                  ? "resultado"
                  : "resultados"}
              </p>
            </div>
          </div>

          {ticketsFiltrados.length ===
          0 ? (
            <div
              style={
                styles.emptyState
              }
            >
              <div
                style={
                  styles.emptyIcon
                }
              >
                <TicketIcon />
              </div>

              <h3
                style={
                  styles.emptyTitle
                }
              >
                No hay incidencias
              </h3>

              <p
                style={
                  styles.emptyText
                }
              >
                No se han encontrado
                tickets con los filtros
                seleccionados.
              </p>
            </div>
          ) : (
            <div
              style={
                styles.ticketList
              }
            >
              {ticketsFiltrados.map(
                (ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    rol={rol}
                    actualizando={
                      actualizandoId ===
                      ticket.id
                    }
                    onOpen={() =>
                      router.push(
                        `/tickets/${ticket.id}`
                      )
                    }
                    onEstadoChange={(
                      nuevoEstado
                    ) =>
                      cambiarEstadoTicket(
                        ticket.id,
                        nuevoEstado
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  title,
  count,
  estado,
  activo,
  onClick,
}: {
  title: string;
  count: number;
  estado: Estado;
  activo: boolean;
  onClick: () => void;
}) {
  const config = {
    PENDIENTE: {
      normal: "#fff8ed",
      active: "#f8e6ce",
      border: "#f0dcc0",
      icon: "#d99525",
      text: "#8d651f",
    },

    EN_CURSO: {
      normal: "#f1f7fd",
      active: "#dcecff",
      border: "#d7e7f6",
      icon: "#3a86d1",
      text: "#316da7",
    },

    RESUELTO: {
      normal: "#edf8f5",
      active: "#d6f1eb",
      border: "#d1ebe4",
      icon: "#00A990",
      text: "#177b6b",
    },
  };

  const current =
    config[estado];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.statusCard,
        background: activo
          ? current.active
          : current.normal,
        borderColor:
          current.border,
      }}
    >
      <div
        style={{
          ...styles.statusIcon,
          color: current.icon,
        }}
      >
        {estado ===
        "PENDIENTE" ? (
          <ClockIcon />
        ) : estado ===
          "EN_CURSO" ? (
          <ProgressIcon />
        ) : (
          <CheckCircleIcon />
        )}
      </div>

      <div>
        <div
          style={{
            ...styles.statusCount,
            color: current.text,
          }}
        >
          {count}
        </div>

        <div
          style={
            styles.statusTitle
          }
        >
          {title}
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   TICKET ROW
========================================================= */

function TicketRow({
  ticket,
  rol,
  actualizando,
  onOpen,
  onEstadoChange,
}: {
  ticket: Ticket;
  rol: Rol | null;
  actualizando: boolean;
  onOpen: () => void;
  onEstadoChange: (
    estado: Estado
  ) => void;
}) {
  return (
    <div
      style={styles.ticketRow}
      onClick={onOpen}
    >
      <div
        style={styles.ticketMain}
      >
        <div
          style={
            styles.ticketTopLine
          }
        >
          <span
            style={
              styles.ticketNumber
            }
          >
            {ticket.numero
              ? `#${ticket.numero}`
              : "Ticket"}
          </span>

          <span
            style={
              styles.ticketDate
            }
          >
            {formatearFecha(
              ticket.creado_en
            )}
          </span>
        </div>

        <h3
          style={styles.ticketTitle}
        >
          {ticket.titulo}
        </h3>

        <div
          style={styles.ticketMeta}
        >
          <span>
            {ticket.nombre}
          </span>

          <span
            style={styles.metaDot}
          >
            •
          </span>

          <span>
            {ticket.empresa}
          </span>

          {rol === "ADMIN" && (
            <>
              <span
                style={
                  styles.metaDot
                }
              >
                •
              </span>

              <span>
                {ticket.email}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        style={
          styles.ticketActions
        }
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div
          style={styles.actionBlock}
        >
          <span
            style={
              styles.actionLabel
            }
          >
            Importancia
          </span>

          <PriorityBadge
            importancia={
              ticket.importancia
            }
          />
        </div>

        <div
          style={styles.actionBlock}
        >
          <span
            style={
              styles.actionLabel
            }
          >
            Estado
          </span>

          {rol === "ADMIN" ? (
            <select
              value={ticket.estado}
              disabled={actualizando}
              onChange={(e) =>
                onEstadoChange(
                  e.target
                    .value as Estado
                )
              }
              style={{
                ...styles.estadoSelect,
                ...getEstadoSelectStyle(
                  ticket.estado
                ),
                opacity:
                  actualizando
                    ? 0.6
                    : 1,
              }}
            >
              <option value="PENDIENTE">
                ● Pendiente
              </option>

              <option value="EN_CURSO">
                ● En curso
              </option>

              <option value="RESUELTO">
                ● Resuelto
              </option>
            </select>
          ) : (
            <StatusBadge
              estado={ticket.estado}
            />
          )}
        </div>

        <button
          type="button"
          onClick={onOpen}
          style={styles.openButton}
          title="Abrir ticket"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   FILTRO
========================================================= */

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={
        styles.filterField
      }
    >
      <label
        style={
          styles.filterLabel
        }
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   BADGES
========================================================= */

function PriorityBadge({
  importancia,
}: {
  importancia: Importancia;
}) {
  const config = {
    BAJA: {
      label: "Baja",
      background: "#eef8f5",
      color: "#438472",
      border: "#b9dfd5",
      dot: "#4cab91",
    },

    MEDIA: {
      label: "Media",
      background: "#fff7e6",
      color: "#9b711d",
      border: "#ead49c",
      dot: "#e7ad2f",
    },

    ALTA: {
      label: "Alta",
      background: "#fff0e9",
      color: "#b95829",
      border: "#efc2ab",
      dot: "#e77a3d",
    },

    URGENTE: {
      label: "Urgente",
      background: "#fff0f0",
      color: "#bd3e3e",
      border: "#edb7b7",
      dot: "#d94b4b",
    },
  };

  const current =
    config[importancia];

  return (
    <span
      style={{
        ...styles.priorityBadge,
        background:
          current.background,
        color: current.color,
        borderColor:
          current.border,
      }}
    >
      <span
        style={{
          ...styles.badgeDot,
          background:
            current.dot,
        }}
      />

      {current.label}
    </span>
  );
}

function StatusBadge({
  estado,
}: {
  estado: Estado;
}) {
  const config = {
    PENDIENTE: {
      label: "Pendiente",
      background: "#fff8ed",
      color: "#9b661d",
      border: "#e8bd72",
      dot: "#d99525",
    },

    EN_CURSO: {
      label: "En curso",
      background: "#edf6ff",
      color: "#2374c6",
      border: "#9dcaf3",
      dot: "#2374c6",
    },

    RESUELTO: {
      label: "Resuelto",
      background: "#edf9f6",
      color: "#16806c",
      border: "#9bd7c9",
      dot: "#00a990",
    },
  };

  const current =
    config[estado];

  return (
    <span
      style={{
        ...styles.statusBadge,
        background:
          current.background,
        color: current.color,
        borderColor:
          current.border,
      }}
    >
      <span
        style={{
          ...styles.badgeDot,
          background:
            current.dot,
        }}
      />

      {current.label}
    </span>
  );
}

function getEstadoSelectStyle(
  estado: Estado
): React.CSSProperties {
  if (estado === "PENDIENTE") {
    return {
      background: "#fff8ed",
      borderColor: "#e8bd72",
      color: "#9b661d",
    };
  }

  if (estado === "EN_CURSO") {
    return {
      background: "#edf6ff",
      borderColor: "#9dcaf3",
      color: "#2374c6",
    };
  }

  return {
    background: "#edf9f6",
    borderColor: "#9bd7c9",
    color: "#16806c",
  };
}

/* =========================================================
   FECHA
========================================================= */

function formatearFecha(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(fecha));
}

/* =========================================================
   ICONOS
========================================================= */

function SupportIcon({
  color = "currentColor",
}: {
  color?: string;
}) {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M18 19c0 1.1-.9 2-2 2h-3" />
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 1 1-9-9" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f7",
    color: "#202424",
    fontFamily:
      "'Poppins', Arial, sans-serif",
  },

  loading: {
    minHeight: "100vh",
    background: "#f5f7f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "12px",
    color: "#7e8787",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "11px",
  },

  loadingIcon: {
    width: "45px",
    height: "45px",
    background: "#eaf8f6",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    background: "#ffffff",
    borderBottom:
      "1px solid #e8ecec",
  },

  headerInner: {
    maxWidth: "1240px",
    minHeight: "78px",
    margin: "0 auto",
    padding: "0 30px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "25px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
  },

  brandIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "11px",
    background: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  brandTitle: {
    fontSize: "17px",
    fontWeight: 700,
  },

  brandSubtitle: {
    color: "#899191",
    fontSize: "10px",
    marginTop: "3px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "17px",
  },

  manualsLink: {
    height: "36px",
    padding: "0 12px",
    border:
      "1px solid #dfe4e4",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#555d5d",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    textDecoration: "none",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "10px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  headerDivider: {
    width: "1px",
    height: "30px",
    background: "#e7ebeb",
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
  },

  userEmail: {
    fontSize: "11px",
  },

  role: {
    color: "#00AF9A",
    fontSize: "9px",
    fontWeight: 700,
  },

  logoutButton: {
    width: "38px",
    height: "38px",
    border:
      "1px solid #dfe4e4",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#555d5d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  container: {
    width: "calc(100% - 48px)",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "34px 0 70px",
  },

  pageHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "25px",
    marginBottom: "26px",
  },

  title: {
    margin: "0 0 5px",
    fontSize: "26px",
    fontWeight: 700,
  },

  subtitle: {
    margin: 0,
    color: "#858d8d",
    fontSize: "11px",
  },

  newTicketButton: {
    height: "42px",
    padding: "0 16px",
    border: "none",
    borderRadius: "8px",
    background: "#00AF9A",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
  },

  errorMessage: {
    padding: "12px 14px",
    marginBottom: "18px",
    border:
      "1px solid #efcaca",
    borderRadius: "9px",
    background: "#fff1f1",
    color: "#aa4141",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "10px",
  },

  statusGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  statusCard: {
    minHeight: "94px",
    border: "1px solid",
    borderRadius: "13px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    cursor: "pointer",
  },

  statusIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background:
      "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statusCount: {
    fontSize: "23px",
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: "5px",
  },

  statusTitle: {
    color: "#626969",
    fontSize: "10px",
    fontWeight: 500,
  },

  filtersCard: {
    background: "#ffffff",
    border:
      "1px solid #e5e9e9",
    borderRadius: "13px",
    padding: "18px",
    marginBottom: "18px",
  },

  searchWrapper: {
    height: "41px",
    boxSizing: "border-box",
    border:
      "1px solid #dce1e1",
    borderRadius: "8px",
    padding: "0 12px",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#929999",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#333838",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "10px",
  },

  filtersRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },

  filterField: {
    minWidth: "130px",
    flex: "1 1 130px",
  },

  filterLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#777f7f",
    fontSize: "9px",
    fontWeight: 600,
  },

  select: {
    width: "100%",
    height: "38px",
    boxSizing: "border-box",
    border:
      "1px solid #dce1e1",
    borderRadius: "8px",
    padding: "0 10px",
    background: "#ffffff",
    color: "#4e5656",
    outlineColor: "#00AF9A",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "9px",
  },

  clearButton: {
    height: "38px",
    padding: "0 12px",
    border: "none",
    background: "transparent",
    color: "#00A992",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "9px",
    fontWeight: 600,
    cursor: "pointer",
  },

  listCard: {
    background: "#ffffff",
    border:
      "1px solid #e5e9e9",
    borderRadius: "13px",
    overflow: "hidden",
  },

  listHeader: {
    padding: "19px 20px",
    borderBottom:
      "1px solid #edf0f0",
  },

  listTitle: {
    margin: "0 0 3px",
    fontSize: "14px",
    fontWeight: 700,
  },

  listSubtitle: {
    margin: 0,
    color: "#919898",
    fontSize: "9px",
  },

  ticketList: {
    display: "flex",
    flexDirection: "column",
  },

  ticketRow: {
    minHeight: "105px",
    padding: "17px 20px",
    boxSizing: "border-box",
    borderBottom:
      "1px solid #edf0f0",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "25px",
    cursor: "pointer",
  },

  ticketMain: {
    minWidth: 0,
    flex: 1,
  },

  ticketTopLine: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "5px",
  },

  ticketNumber: {
    color: "#00A992",
    fontSize: "9px",
    fontWeight: 700,
  },

  ticketDate: {
    color: "#a0a6a6",
    fontSize: "8px",
  },

  ticketTitle: {
    margin: "0 0 7px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#292e2e",
  },

  ticketMeta: {
    color: "#858d8d",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
    fontSize: "9px",
  },

  metaDot: {
    color: "#c4caca",
  },

  ticketActions: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    flexShrink: 0,
  },

  actionBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  actionLabel: {
    color: "#969d9d",
    fontSize: "9px",
  },

  priorityBadge: {
    minWidth: "104px",
    height: "36px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "9px",
    fontWeight: 600,
  },

  statusBadge: {
    minWidth: "132px",
    height: "36px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "9px",
    fontWeight: 600,
  },

  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  estadoSelect: {
    minWidth: "132px",
    height: "36px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 10px",
    outline: "none",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "9px",
    fontWeight: 600,
    cursor: "pointer",
  },

  openButton: {
    width: "36px",
    height: "36px",
    border:
      "1px solid #dfe4e4",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#6d7575",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  emptyState: {
    minHeight: "280px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "30px",
  },

  emptyIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "13px",
    background: "#ecf9f7",
    color: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "13px",
  },

  emptyTitle: {
    margin: "0 0 5px",
    fontSize: "13px",
  },

  emptyText: {
    margin: 0,
    color: "#909797",
    fontSize: "10px",
  },
};
