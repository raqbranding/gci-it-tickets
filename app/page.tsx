"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Rol = "ADMIN" | "USUARIO";

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<Rol | null>(null);
  const [email, setEmail] = useState("");

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

  if (loading) {
    return (
      <main style={styles.loading}>
        <div style={styles.loader}></div>
        <p style={{ margin: 0, color: "#7b8282", fontSize: "13px" }}>
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
            <div style={styles.icon}>
              <SupportIcon />
            </div>

            <div>
              <div style={styles.title}>IT Support</div>
              <div style={styles.subtitle}>
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
        <section style={styles.topSection}>
          <div>
            <h1 style={styles.pageTitle}>
              {rol === "ADMIN" ? "Gestión de tickets" : "Mis incidencias"}
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
            <span style={{ fontSize: "19px", lineHeight: 1 }}>+</span>
            Nuevo ticket
          </button>
        </section>

        {/* RESUMEN */}
        <section style={styles.stats}>
          <StatCard
            number="0"
            label={rol === "ADMIN" ? "Pendientes" : "Tickets pendientes"}
          />

          <StatCard
            number="0"
            label={rol === "ADMIN" ? "En curso" : "Tickets en curso"}
          />

          <StatCard
            number="0"
            label={rol === "ADMIN" ? "Resueltos" : "Tickets resueltos"}
          />
        </section>

        {/* LISTADO */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {rol === "ADMIN" ? "Todos los tickets" : "Mis tickets"}
              </h2>

              <p style={styles.cardDescription}>
                {rol === "ADMIN"
                  ? "Incidencias registradas en IT Support"
                  : "Incidencias que has enviado a Informática"}
              </p>
            </div>
          </div>

          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <TicketIcon />
            </div>

            <h3 style={styles.emptyTitle}>No hay tickets todavía</h3>

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

function StatCard({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statNumber}>{number}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

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

function TicketIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#00AF9A"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
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

  icon: {
    width: "44px",
    height: "44px",
    borderRadius: "11px",
    background: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  title: {
    fontSize: "17px",
    fontWeight: 700,
    lineHeight: 1.2,
  },

  subtitle: {
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
    gap: "18px",
    marginBottom: "24px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e8ecec",
    borderRadius: "13px",
    padding: "22px",
  },

  statNumber: {
    fontSize: "27px",
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: "8px",
  },

  statLabel: {
    color: "#7b8282",
    fontSize: "12px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e8ecec",
    borderRadius: "14px",
    overflow: "hidden",
  },

  cardHeader: {
    padding: "22px 24px",
    borderBottom: "1px solid #edf0f0",
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

  empty: {
    minHeight: "310px",
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
