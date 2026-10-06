"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Rol = "ADMIN" | "USUARIO";
type Estado = "PENDIENTE" | "EN_CURSO" | "RESUELTO";
type EstadoFiltro = "TODOS" | Estado;
type Importancia = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

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

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<Rol | null>(null);
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [errorCarga, setErrorCarga] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState("TODAS");
  const [importancia, setImportancia] = useState("TODAS");
  const [estado, setEstado] = useState<EstadoFiltro>("TODOS");
  const [orden, setOrden] = useState("RECIENTES");

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

    const { data: acceso, error: errorAcceso } = await supabase
      .from("it_usuarios")
      .select("rol, activo")
      .eq("user_id", user.id)
      .maybeSingle();

    if (errorAcceso || !acceso || !acceso.activo) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    const rolUsuario = acceso.rol as Rol;

    setEmail(user.email ?? "");
    setRol(rolUsuario);

    const { data: ticketsData, error: ticketsError } =
      await supabase
        .from("it_tickets")
        .select(
          `
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
          `
        )
        .order("creado_en", {
          ascending: false,
        });

    if (ticketsError) {
      console.error("Error cargando tickets:", ticketsError);

      setErrorCarga(
        `No se han podido cargar los tickets: ${ticketsError.message}`
      );

      setTickets([]);
      setLoading(false);
      return;
    }

    setTickets((ticketsData ?? []) as Ticket[]);
    setLoading(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function seleccionarEstado(nuevoEstado: Estado) {
    setEstado((actual) =>
      actual === nuevoEstado ? "TODOS" : nuevoEstado
    );
  }

  async function cambiarEstadoTicket(
    ticketId: string,
    nuevoEstado: Estado
  ) {
    if (rol !== "ADMIN") {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const ahora = new Date().toISOString();

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

    const { error } = await supabase
      .from("it_tickets")
      .update(cambios)
      .eq("id", ticketId);

    if (error) {
      console.error("Error cambiando estado:", error);

      setErrorCarga(
        `No se ha podido cambiar el estado: ${error.message}`
      );

      return;
    }

    setErrorCarga("");

    setTickets((actuales) =>
      actuales.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              estado: nuevoEstado,
              actualizado_en: cambios.actualizado_en,
              resuelto_en: cambios.resuelto_en,
              resuelto_por: cambios.resuelto_por,
            }
          : ticket
      )
    );
  }

  /* =========================================================
     CONTADORES
  ========================================================= */

  const pendientes = tickets.filter(
    (ticket) => ticket.estado === "PENDIENTE"
  ).length;

  const enCurso = tickets.filter(
    (ticket) => ticket.estado === "EN_CURSO"
  ).length;

  const resueltos = tickets.filter(
    (ticket) => ticket.estado === "RESUELTO"
  ).length;

  /* =========================================================
     FILTRADO
  ========================================================= */

  const ticketsFiltrados = useMemo(() => {
    let resultado = [...tickets];

    // ESTADO - TODOS
    if (estado !== "TODOS") {
      resultado = resultado.filter(
        (ticket) => ticket.estado === estado
      );
    }

    // FECHA - TODOS
    if (fecha !== "TODAS") {
      const ahora = new Date();

      if (fecha === "HOY") {
        resultado = resultado.filter((ticket) => {
          const fechaTicket = new Date(ticket.creado_en);

          return (
            fechaTicket.getDate() === ahora.getDate() &&
            fechaTicket.getMonth() === ahora.getMonth() &&
            fechaTicket.getFullYear() === ahora.getFullYear()
          );
        });
      }

      if (fecha === "7_DIAS") {
        const limite = new Date();
        limite.setDate(limite.getDate() - 7);

        resultado = resultado.filter(
          (ticket) => new Date(ticket.creado_en) >= limite
        );
      }

      if (fecha === "30_DIAS") {
        const limite = new Date();
        limite.setDate(limite.getDate() - 30);

        resultado = resultado.filter(
          (ticket) => new Date(ticket.creado_en) >= limite
        );
      }
    }

    // FILTROS EXCLUSIVOS DE ADMIN
    if (rol === "ADMIN") {
      const texto = busqueda.trim().toLowerCase();

      if (texto) {
        resultado = resultado.filter(
          (ticket) =>
            ticket.nombre?.toLowerCase().includes(texto) ||
            ticket.empresa?.toLowerCase().includes(texto) ||
            ticket.titulo?.toLowerCase().includes(texto) ||
            ticket.email?.toLowerCase().includes(texto) ||
            String(ticket.numero ?? "").includes(texto)
        );
      }

      if (importancia !== "TODAS") {
        resultado = resultado.filter(
          (ticket) => ticket.importancia === importancia
        );
      }

      resultado.sort((a, b) => {
        const fechaA = new Date(a.creado_en).getTime();
        const fechaB = new Date(b.creado_en).getTime();

        if (orden === "ANTIGUOS") {
          return fechaA - fechaB;
        }

        return fechaB - fechaA;
      });
    } else {
      resultado.sort(
        (a, b) =>
          new Date(b.creado_en).getTime() -
          new Date(a.creado_en).getTime()
      );
    }

    return resultado;
  }, [
    tickets,
    estado,
    fecha,
    rol,
    busqueda,
    importancia,
    orden,
  ]);

  function limpiarFiltros() {
    setEstado("TODOS");
    setFecha("TODAS");
    setBusqueda("");
    setImportancia("TODAS");
    setOrden("RECIENTES");
  }

  const hayFiltros =
    estado !== "TODOS" ||
    fecha !== "TODAS" ||
    (rol === "ADMIN" &&
      (busqueda.trim() !== "" ||
        importancia !== "TODAS" ||
        orden !== "RECIENTES"));

  if (loading) {
    return (
      <main style={styles.loading}>
        <div style={styles.loader} />

        <p style={styles.loadingText}>Cargando...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {/* =====================================================
          CABECERA
      ===================================================== */}

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <div style={styles.logoIcon}>
              <SupportIcon />
            </div>

            <div>
              <div style={styles.brandTitle}>IT Support</div>

              <div style={styles.brandSubtitle}>
                Gestión de incidencias informáticas
              </div>
            </div>
          </div>

          <div style={styles.userArea}>
            <div style={styles.userInfo}>
              <span style={styles.email}>{email}</span>

              <span style={styles.role}>
                {rol === "ADMIN" ? "ADMINISTRADOR" : "USUARIO"}
              </span>
            </div>

            <button
              onClick={cerrarSesion}
              style={styles.logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div style={styles.container}>
        {/* CABECERA DE PÁGINA */}

        <section style={styles.topSection}>
          <div>
            <h1 style={styles.pageTitle}>
              {rol === "ADMIN"
                ? "Gestión de tickets"
                : "Mis incidencias"}
            </h1>

            <p style={styles.pageDescription}>
              {rol === "ADMIN"
                ? "Consulta y gestiona las incidencias enviadas por los usuarios."
                : "Consulta el estado de tus incidencias o crea un nuevo ticket."}
            </p>
          </div>

          <button
            style={styles.newTicket}
            onClick={() => router.push("/nuevo-ticket")}
          >
            <span style={styles.plus}>+</span>
            Nuevo ticket
          </button>
        </section>

        {/* =====================================================
            TARJETAS DE ESTADO
        ===================================================== */}

        <section style={styles.stats}>
          <StatusCard
            type="pending"
            title="Pendientes"
            number={pendientes}
            active={estado === "PENDIENTE"}
            onClick={() => seleccionarEstado("PENDIENTE")}
          />

          <StatusCard
            type="progress"
            title="En curso"
            number={enCurso}
            active={estado === "EN_CURSO"}
            onClick={() => seleccionarEstado("EN_CURSO")}
          />

          <StatusCard
            type="resolved"
            title="Resueltos"
            number={resueltos}
            active={estado === "RESUELTO"}
            onClick={() => seleccionarEstado("RESUELTO")}
          />
        </section>

        {/* =====================================================
            FILTROS
        ===================================================== */}

        <section style={styles.filtersCard}>
          {/* BUSCADOR SOLO ADMIN */}

          {rol === "ADMIN" && (
            <div style={styles.searchWrapper}>
              <SearchIcon />

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, empresa, título, email o número..."
                style={styles.searchInput}
              />
            </div>
          )}

          <div
            style={{
              ...styles.filtersGrid,
              gridTemplateColumns:
                rol === "ADMIN"
                  ? "repeat(4, minmax(0, 1fr))"
                  : "repeat(2, minmax(0, 1fr))",
            }}
          >
            {/* FECHA */}

            <select
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={styles.select}
            >
              <option value="TODAS">Todas las fechas</option>
              <option value="HOY">Hoy</option>
              <option value="7_DIAS">Últimos 7 días</option>
              <option value="30_DIAS">Últimos 30 días</option>
            </select>

            {/* ESTADO */}

            <select
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as EstadoFiltro)
              }
              style={styles.select}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_CURSO">En curso</option>
              <option value="RESUELTO">Resuelto</option>
            </select>

            {/* IMPORTANCIA - SOLO ADMIN */}

            {rol === "ADMIN" && (
              <select
                value={importancia}
                onChange={(e) => setImportancia(e.target.value)}
                style={styles.select}
              >
                <option value="TODAS">Toda importancia</option>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            )}

            {/* ORDEN - SOLO ADMIN */}

            {rol === "ADMIN" && (
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                style={styles.select}
              >
                <option value="RECIENTES">Más recientes</option>
                <option value="ANTIGUOS">Más antiguos</option>
              </select>
            )}
          </div>
        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {errorCarga && (
          <div style={styles.errorMessage}>
            <AlertIcon />
            <span>{errorCarga}</span>
          </div>
        )}

        {/* =====================================================
            LISTADO
        ===================================================== */}

        <section style={styles.ticketsCard}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {rol === "ADMIN" ? "Tickets" : "Mis tickets"}
              </h2>

              <p style={styles.cardDescription}>
                {ticketsFiltrados.length === 1
                  ? "1 incidencia"
                  : `${ticketsFiltrados.length} incidencias`}
              </p>
            </div>

            {hayFiltros && (
              <button
                onClick={limpiarFiltros}
                style={styles.clearFilter}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {ticketsFiltrados.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                <TicketIcon />
              </div>

              <h3 style={styles.emptyTitle}>
                {tickets.length === 0
                  ? "No hay tickets todavía"
                  : "No hay resultados"}
              </h3>

              <p style={styles.emptyText}>
                {tickets.length === 0
                  ? rol === "ADMIN"
                    ? "Cuando los usuarios creen incidencias aparecerán aquí."
                    : "Cuando crees tu primera incidencia aparecerá aquí."
                  : "No hay incidencias que coincidan con los filtros seleccionados."}
              </p>

              {rol !== "ADMIN" && tickets.length === 0 && (
                <button
                  style={styles.secondaryButton}
                  onClick={() => router.push("/nuevo-ticket")}
                >
                  Crear mi primer ticket
                </button>
              )}
            </div>
          ) : (
            <div style={styles.ticketList}>
              {ticketsFiltrados.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  rol={rol}
                  onClick={() =>
                    router.push(`/tickets/${ticket.id}`)
                  }
                  onEstadoChange={cambiarEstadoTicket}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   FILA DE TICKET
========================================================= */

function TicketRow({
  ticket,
  rol,
  onClick,
  onEstadoChange,
}: {
  ticket: Ticket;
  rol: Rol | null;
  onClick: () => void;
  onEstadoChange: (
    ticketId: string,
    nuevoEstado: Estado
  ) => Promise<void>;
}) {
  const [cambiandoEstado, setCambiandoEstado] =
    useState(false);

  async function cambiarEstado(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    e.stopPropagation();

    const nuevoEstado = e.target.value as Estado;

    if (nuevoEstado === ticket.estado) {
      return;
    }

    setCambiandoEstado(true);

    await onEstadoChange(ticket.id, nuevoEstado);

    setCambiandoEstado(false);
  }

  return (
    <div style={styles.ticketRow} onClick={onClick}>
      {/* INFORMACIÓN PRINCIPAL */}

      <div style={styles.ticketMain}>
        <div style={styles.ticketTopLine}>
          <span style={styles.ticketNumber}>
            {ticket.numero ? `#${ticket.numero}` : "Ticket"}
          </span>
        </div>

        <h3 style={styles.ticketTitle}>{ticket.titulo}</h3>

        <div style={styles.ticketMeta}>
          {rol === "ADMIN" && (
            <>
              <span>{ticket.nombre}</span>

              <span style={styles.dot}>•</span>

              <span>{ticket.empresa}</span>

              <span style={styles.dot}>•</span>
            </>
          )}

          <span>{formatearFecha(ticket.creado_en)}</span>
        </div>
      </div>

      {/* ZONA DERECHA */}

      <div
        style={styles.ticketActions}
        onClick={(e) => e.stopPropagation()}
      >
        {/* IMPORTANCIA */}

        <div style={styles.actionBlock}>
          <span style={styles.actionLabel}>Importancia</span>

          <PriorityBadge importancia={ticket.importancia} />
        </div>

        {/* ESTADO */}

        <div style={styles.actionBlock}>
          <span style={styles.actionLabel}>Estado</span>

          {rol === "ADMIN" ? (
            <select
              value={ticket.estado}
              onChange={cambiarEstado}
              disabled={cambiandoEstado}
              style={{
                ...styles.estadoSelect,
                ...getEstadoSelectStyle(ticket.estado),
                opacity: cambiandoEstado ? 0.6 : 1,
                cursor: cambiandoEstado
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              <option value="PENDIENTE">● Pendiente</option>
              <option value="EN_CURSO">● En curso</option>
              <option value="RESUELTO">● Resuelto</option>
            </select>
          ) : (
            <StatusBadge estado={ticket.estado} />
          )}
        </div>

        {/* ABRIR */}

        <button
          type="button"
          style={styles.openTicketButton}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          title="Abrir ticket"
          aria-label="Abrir ticket"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ESTILO DEL SELECT DE ESTADO
========================================================= */

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
   ESTADO PARA USUARIO
========================================================= */

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

  const current = config[estado];

  return (
    <span
      style={{
        ...styles.statusBadge,
        background: current.background,
        color: current.color,
        borderColor: current.border,
      }}
    >
      <span
        style={{
          ...styles.badgeDot,
          background: current.dot,
        }}
      />

      {current.label}
    </span>
  );
}

/* =========================================================
   IMPORTANCIA
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

  const current = config[importancia] ?? config.MEDIA;

  return (
    <span
      style={{
        ...styles.priorityBadge,
        background: current.background,
        color: current.color,
        borderColor: current.border,
      }}
    >
      <span
        style={{
          ...styles.badgeDot,
          background: current.dot,
        }}
      />

      Importancia: {current.label}
    </span>
  );
}

/* =========================================================
   TARJETAS SUPERIORES
========================================================= */

function StatusCard({
  type,
  title,
  number,
  active,
  onClick,
}: {
  type: "pending" | "progress" | "resolved";
  title: string;
  number: number;
  active: boolean;
  onClick: () => void;
}) {
  const config = {
    pending: {
      background: "#fff8ef",
      activeBackground: "#f8e6ce",
      iconBackground: "#fff0dc",
      activeIconBackground: "#f3d6b1",
      iconColor: "#252525",
    },

    progress: {
      background: "#f1f8ff",
      activeBackground: "#dcecff",
      iconBackground: "#dfefff",
      activeIconBackground: "#c5e0ff",
      iconColor: "#1479ff",
    },

    resolved: {
      background: "#f0fbf8",
      activeBackground: "#d6f1eb",
      iconBackground: "#dcf6f0",
      activeIconBackground: "#bee8df",
      iconColor: "#00a990",
    },
  };

  const current = config[type];

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.statusCard,
        background: active
          ? current.activeBackground
          : current.background,
      }}
    >
      <div
        style={{
          ...styles.statusIcon,
          background: active
            ? current.activeIconBackground
            : current.iconBackground,
          color: current.iconColor,
        }}
      >
        {type === "pending" && <PendingIcon />}
        {type === "progress" && <ProgressIcon />}
        {type === "resolved" && <ResolvedIcon />}
      </div>

      <div style={styles.statusContent}>
        <span style={styles.statusTitle}>{title}</span>

        <strong style={styles.statusNumber}>{number}</strong>
      </div>
    </button>
  );
}

/* =========================================================
   FECHA
========================================================= */

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

/* =========================================================
   ICONOS
========================================================= */

function SupportIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
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

function PendingIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />

      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.4v-4h.1A1.7 1.7 0 0 0 4.2 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.6 4.2a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.4h4v.1a1.7 1.7 0 0 0 1 1.7 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.6a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7 1Z" />
    </svg>
  );
}

function ResolvedIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#00AF9A"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ba2a2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        position: "absolute",
        left: "15px",
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f7",
    fontFamily: "'Poppins', Arial, sans-serif",
    color: "#202424",
  },

  loading: {
    minHeight: "100vh",
    background: "#f5f7f7",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Poppins', Arial, sans-serif",
  },

  loadingText: {
    margin: 0,
    color: "#7b8282",
    fontSize: "13px",
  },

  loader: {
    width: "28px",
    height: "28px",
    border: "3px solid #dfe8e7",
    borderTopColor: "#00AF9A",
    borderRadius: "50%",
  },

  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e8ecec",
  },

  headerInner: {
    maxWidth: "1240px",
    margin: "0 auto",
    minHeight: "78px",
    padding: "0 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  logoIcon: {
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
    lineHeight: 1.2,
  },

  brandSubtitle: {
    marginTop: "4px",
    fontSize: "11px",
    color: "#8a9191",
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
  },

  email: {
    fontSize: "12px",
    fontWeight: 500,
  },

  role: {
    color: "#00AF9A",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  logout: {
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    border: "1px solid #dfe4e4",
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
    padding: "42px 0 70px",
  },

  topSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
    marginBottom: "30px",
  },

  pageTitle: {
    margin: "0 0 6px",
    fontSize: "28px",
    fontWeight: 700,
  },

  pageDescription: {
    margin: 0,
    color: "#7b8282",
    fontSize: "13px",
  },

  newTicket: {
    border: "none",
    borderRadius: "9px",
    background: "#00AF9A",
    color: "#ffffff",
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  plus: {
    fontSize: "19px",
    lineHeight: 1,
  },

  /* TARJETAS */

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },

  statusCard: {
    minHeight: "96px",
    border: "1px solid transparent",
    borderRadius: "13px",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: "17px",
    textAlign: "left",
    fontFamily: "'Poppins', Arial, sans-serif",
    cursor: "pointer",
    transition: "background 0.18s ease",
  },

  statusIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  statusContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  statusTitle: {
    color: "#303535",
    fontSize: "12px",
    fontWeight: 500,
  },

  statusNumber: {
    color: "#202424",
    fontSize: "25px",
    lineHeight: 1,
    fontWeight: 700,
  },

  /* FILTROS */

  filtersCard: {
    background: "#ffffff",
    border: "1px solid #e5e9e9",
    borderRadius: "13px",
    padding: "16px",
    marginBottom: "20px",
  },

  searchWrapper: {
    position: "relative",
    marginBottom: "12px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    height: "44px",
    border: "1px solid #d9dede",
    borderRadius: "8px",
    padding: "0 15px 0 43px",
    background: "#ffffff",
    color: "#303535",
    outlineColor: "#00AF9A",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "13px",
  },

  filtersGrid: {
    display: "grid",
    gap: "10px",
  },

  select: {
    width: "100%",
    height: "43px",
    border: "1px solid #d9dede",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#ffffff",
    color: "#555d5d",
    outlineColor: "#00AF9A",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    cursor: "pointer",
  },

  errorMessage: {
    background: "#fff1f1",
    border: "1px solid #f0cece",
    color: "#a63d3d",
    borderRadius: "9px",
    padding: "12px 15px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "11px",
  },

  /* LISTADO */

  ticketsCard: {
    background: "#ffffff",
    border: "1px solid #e8ecec",
    borderRadius: "14px",
    overflow: "hidden",
  },

  cardHeader: {
    padding: "22px 24px",
    borderBottom: "1px solid #edf0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  cardTitle: {
    margin: "0 0 4px",
    fontSize: "16px",
    fontWeight: 700,
  },

  cardDescription: {
    margin: 0,
    color: "#8a9191",
    fontSize: "11px",
  },

  clearFilter: {
    border: "none",
    background: "transparent",
    color: "#00AF9A",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  ticketList: {
    display: "flex",
    flexDirection: "column",
  },

  ticketRow: {
    width: "100%",
    minHeight: "106px",
    boxSizing: "border-box",
    borderBottom: "1px solid #edf0f0",
    background: "#ffffff",
    padding: "18px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    cursor: "pointer",
  },

  ticketMain: {
    minWidth: 0,
    flex: 1,
  },

  ticketTopLine: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "6px",
  },

  ticketNumber: {
    color: "#8a9191",
    fontSize: "10px",
    fontWeight: 600,
  },

  ticketTitle: {
    margin: "0 0 7px",
    color: "#252929",
    fontSize: "14px",
    fontWeight: 600,
  },

  ticketMeta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
    color: "#8a9191",
    fontSize: "10px",
  },

  dot: {
    color: "#c2c7c7",
  },

  /* ACCIONES DE LA FILA */

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
    color: "#949b9b",
    fontSize: "9px",
    fontWeight: 500,
  },

  estadoSelect: {
    minWidth: "132px",
    height: "36px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 10px",
    outline: "none",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "10px",
    fontWeight: 600,
  },

  statusBadge: {
    minWidth: "112px",
    height: "36px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "10px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  priorityBadge: {
    height: "36px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "10px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  openTicketButton: {
    width: "36px",
    height: "36px",
    border: "1px solid #e0e5e5",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#8b9292",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  /* VACÍO */

  empty: {
    minHeight: "280px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px 20px",
  },

  emptyIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    background: "#ecf9f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },

  emptyTitle: {
    margin: "0 0 7px",
    fontSize: "15px",
    fontWeight: 600,
  },

  emptyText: {
    margin: "0 0 20px",
    color: "#8a9191",
    fontSize: "12px",
  },

  secondaryButton: {
    padding: "10px 16px",
    border: "1px solid #00AF9A",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#008f7e",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
