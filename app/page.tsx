"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Rol = "ADMIN" | "USUARIO";
type EstadoFiltro = "TODOS" | "PENDIENTE" | "EN_CURSO" | "RESUELTO";

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<Rol | null>(null);
  const [email, setEmail] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState("TODAS");
  const [importancia, setImportancia] = useState("TODAS");
  const [estado, setEstado] = useState<EstadoFiltro>("TODOS");
  const [tag, setTag] = useState("TODOS");
  const [orden, setOrden] = useState("RECIENTES");

  useEffect(() => {
    comprobarUsuario();
  }, []);

  async function comprobarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: acceso, error } = await supabase
      .from("it_usuarios")
      .select("rol, activo")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !acceso || !acceso.activo) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    setEmail(user.email ?? "");
    setRol(acceso.rol as Rol);
    setLoading(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function seleccionarEstado(nuevoEstado: EstadoFiltro) {
    setEstado((actual) =>
      actual === nuevoEstado ? "TODOS" : nuevoEstado
    );
  }

  if (loading) {
    return (
      <main style={styles.loading}>
        <div style={styles.loader} />

        <p
          style={{
            margin: 0,
            color: "#7b8282",
            fontSize: "13px",
          }}
        >
          Cargando...
        </p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {/* CABECERA */}
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

      {/* CONTENIDO */}
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
            <span
              style={{
                fontSize: "19px",
                lineHeight: 1,
              }}
            >
              +
            </span>

            Nuevo ticket
          </button>
        </section>

        {/* TARJETAS DE ESTADO */}
        <section style={styles.stats}>
          <StatusCard
            type="pending"
            title="Pendientes"
            number={0}
            active={estado === "PENDIENTE"}
            onClick={() => seleccionarEstado("PENDIENTE")}
          />

          <StatusCard
            type="progress"
            title="En curso"
            number={0}
            active={estado === "EN_CURSO"}
            onClick={() => seleccionarEstado("EN_CURSO")}
          />

          <StatusCard
            type="resolved"
            title="Resueltos"
            number={0}
            active={estado === "RESUELTO"}
            onClick={() => seleccionarEstado("RESUELTO")}
          />
        </section>

        {/* FILTROS */}
        <section style={styles.filtersCard}>
          <div style={styles.searchWrapper}>
            <SearchIcon />

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={
                rol === "ADMIN"
                  ? "Buscar por nombre, empresa, título o email..."
                  : "Buscar en mis tickets..."
              }
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filtersGrid}>
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

            {rol === "ADMIN" && (
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={styles.select}
              >
                <option value="TODOS">Todos los tags</option>
              </select>
            )}

            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              style={styles.select}
            >
              <option value="RECIENTES">Más recientes</option>
              <option value="ANTIGUOS">Más antiguos</option>
            </select>
          </div>
        </section>

        {/* LISTADO */}
        <section style={styles.ticketsCard}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {rol === "ADMIN"
                  ? "Todos los tickets"
                  : "Mis tickets"}
              </h2>

              <p style={styles.cardDescription}>
                {estado === "TODOS"
                  ? rol === "ADMIN"
                    ? "Incidencias registradas en IT Support"
                    : "Incidencias que has enviado a Informática"
                  : `Mostrando tickets: ${nombreEstado(estado)}`}
              </p>
            </div>

            {estado !== "TODOS" && (
              <button
                onClick={() => setEstado("TODOS")}
                style={styles.clearFilter}
              >
                Quitar filtro
              </button>
            )}
          </div>

          {/* ESTADO VACÍO */}
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <TicketIcon />
            </div>

            <h3 style={styles.emptyTitle}>
              No hay tickets todavía
            </h3>

            <p style={styles.emptyText}>
              {rol === "ADMIN"
                ? "Cuando los usuarios creen incidencias aparecerán aquí."
                : "Cuando crees tu primera incidencia aparecerá aquí."}
            </p>

            {rol !== "ADMIN" && (
              <button
                style={styles.secondaryButton}
                onClick={() => router.push("/nuevo-ticket")}
              >
                Crear mi primer ticket
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   TARJETA DE ESTADO
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
      background:
        "linear-gradient(110deg, #fff7ec 0%, #fffaf4 100%)",
      iconBackground: "#fff0dc",
      iconColor: "#252525",
    },

    progress: {
      background:
        "linear-gradient(110deg, #eef7ff 0%, #f6faff 100%)",
      iconBackground: "#dfefff",
      iconColor: "#1479ff",
    },

    resolved: {
      background:
        "linear-gradient(110deg, #eefbf8 0%, #f5fcfa 100%)",
      iconBackground: "#dcf6f0",
      iconColor: "#00a990",
    },
  };

  const current = config[type];

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.statusCard,
        background: current.background,
        border: active
          ? "1px solid #00AF9A"
          : "1px solid transparent",
        boxShadow: active
          ? "0 0 0 2px rgba(0,175,154,0.08)"
          : "none",
      }}
    >
      <div
        style={{
          ...styles.statusIcon,
          background: current.iconBackground,
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
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
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

/* =========================================================
   TEXTO DE ESTADO
========================================================= */

function nombreEstado(estado: EstadoFiltro) {
  if (estado === "PENDIENTE") return "Pendientes";
  if (estado === "EN_CURSO") return "En curso";
  if (estado === "RESUELTO") return "Resueltos";

  return "Todos";
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

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },

  statusCard: {
    minHeight: "96px",
    borderRadius: "13px",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: "17px",
    textAlign: "left",
    fontFamily: "'Poppins', Arial, sans-serif",
    cursor: "pointer",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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
