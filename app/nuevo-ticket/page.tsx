"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { EMPRESAS } from "../../lib/empresas";

type Rol = "ADMIN" | "USUARIO";

type Importancia =
  | "BAJA"
  | "MEDIA"
  | "ALTA"
  | "URGENTE";

export default function NuevoTicketPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [rol, setRol] =
    useState<Rol | null>(null);

  const [userId, setUserId] =
    useState("");

  const [userEmail, setUserEmail] =
    useState("");

  const [nombre, setNombre] =
    useState("");

  const [empresa, setEmpresa] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [titulo, setTitulo] =
    useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [importancia, setImportancia] =
    useState<Importancia>("BAJA");

  const [imagenes, setImagenes] =
    useState<File[]>([]);

  const [error, setError] =
    useState("");

  useEffect(() => {
    cargarUsuario();
  }, []);

  /* =========================================================
     CARGAR USUARIO
  ========================================================= */

  async function cargarUsuario() {
    setLoading(true);

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

    setUserId(user.id);
    setUserEmail(user.email ?? "");
    setEmail(user.email ?? "");
    setRol(acceso.rol as Rol);

    setLoading(false);
  }

  /* =========================================================
     IMÁGENES
  ========================================================= */

  function seleccionarImagenes(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const seleccionadas = Array.from(
      event.target.files ?? []
    );

    setError("");

    const permitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const incorrectas =
      seleccionadas.filter(
        (archivo) =>
          !permitidos.includes(
            archivo.type
          )
      );

    if (incorrectas.length > 0) {
      setError(
        "Solo se pueden adjuntar imágenes JPG, PNG o WEBP."
      );

      event.target.value = "";
      return;
    }

    const grandes =
      seleccionadas.filter(
        (archivo) =>
          archivo.size >
          10 * 1024 * 1024
      );

    if (grandes.length > 0) {
      setError(
        "Cada imagen puede tener un tamaño máximo de 10 MB."
      );

      event.target.value = "";
      return;
    }

    setImagenes((actuales) => [
      ...actuales,
      ...seleccionadas,
    ]);

    event.target.value = "";
  }

  function quitarImagen(
    index: number
  ) {
    setImagenes((actuales) =>
      actuales.filter(
        (_, i) => i !== index
      )
    );
  }

  /* =========================================================
     CREAR TICKET
  ========================================================= */

  async function crearTicket(
    event: FormEvent
  ) {
    event.preventDefault();

    if (guardando) return;

    setError("");

    if (!nombre.trim()) {
      setError(
        "Introduce el nombre."
      );
      return;
    }

    if (!empresa) {
      setError(
        "Selecciona una empresa."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Introduce el correo electrónico."
      );
      return;
    }

    if (!titulo.trim()) {
      setError(
        "Introduce el título de la incidencia."
      );
      return;
    }

    if (!descripcion.trim()) {
      setError(
        "Describe la incidencia."
      );
      return;
    }

    setGuardando(true);

    try {
      /*
       * 1. CREAR TICKET
       */

      const {
        data: ticketData,
        error: ticketError,
      } = await supabase
        .from("it_tickets")
        .insert({
          creado_por: userId,
          nombre: nombre.trim(),
          telefono:
            telefono.trim() || null,
          email: email.trim(),
          empresa,
          titulo: titulo.trim(),
          descripcion:
            descripcion.trim(),
          importancia,
          estado: "PENDIENTE",
        })
        .select("id, numero")
        .single();

      if (ticketError) {
        throw ticketError;
      }

      /*
       * 2. SI HAY IMÁGENES INICIALES,
       * LAS GUARDAMOS COMO PRIMER
       * SEGUIMIENTO DEL TICKET.
       */

      if (
        imagenes.length > 0 &&
        ticketData
      ) {
        const {
          data: seguimiento,
          error: seguimientoError,
        } = await supabase
          .from("it_seguimientos")
          .insert({
            ticket_id:
              ticketData.id,
            creado_por: userId,
            mensaje:
              "Imagen adjunta",
          })
          .select("id")
          .single();

        if (seguimientoError) {
          throw seguimientoError;
        }

        for (
          let i = 0;
          i < imagenes.length;
          i++
        ) {
          const archivo =
            imagenes[i];

          const extension =
            archivo.name
              .split(".")
              .pop()
              ?.toLowerCase() ??
            "jpg";

          const nombreSeguro =
            archivo.name
              .replace(
                /\.[^/.]+$/,
                ""
              )
              .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
              )
              .slice(0, 70);

          const ruta =
            `${ticketData.id}/` +
            `${seguimiento.id}/` +
            `${Date.now()}-${i}-${crypto.randomUUID()}-` +
            `${nombreSeguro}.${extension}`;

          const {
            error: uploadError,
          } = await supabase.storage
            .from("it-tickets")
            .upload(
              ruta,
              archivo,
              {
                cacheControl:
                  "3600",
                upsert: false,
                contentType:
                  archivo.type,
              }
            );

          if (uploadError) {
            throw uploadError;
          }

          const {
            error:
              archivoError,
          } = await supabase
            .from(
              "it_seguimiento_archivos"
            )
            .insert({
              seguimiento_id:
                seguimiento.id,
              ticket_id:
                ticketData.id,
              nombre_archivo:
                archivo.name,
              ruta_storage:
                ruta,
              tipo_mime:
                archivo.type,
              tamano:
                archivo.size,
              creado_por:
                userId,
            });

          if (archivoError) {
            throw archivoError;
          }
        }
      }

      /*
       * 3. ENVIAR AVISO A HELPDESK
       *
       * El ticket ya está creado en Supabase.
       * Si el correo falla, NO eliminamos
       * ni bloqueamos la incidencia.
       */

      try {
        const respuestaCorreo =
          await fetch(
            "/api/tickets/nueva-incidencia",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                ticketId:
                  ticketData.id,

                numero:
                  ticketData.numero,

                nombre:
                  nombre.trim(),

                empresa,

                email:
                  email.trim(),

                telefono:
                  telefono.trim() ||
                  null,

                titulo:
                  titulo.trim(),

                descripcion:
                  descripcion.trim(),

                importancia,
              }),
            }
          );

        if (!respuestaCorreo.ok) {
          const detalle =
            await respuestaCorreo
              .json()
              .catch(() => null);

          console.error(
            "El ticket se creó, pero no se pudo enviar el aviso a Helpdesk:",
            detalle
          );
        }
      } catch (correoError) {
        console.error(
          "El ticket se creó, pero falló el aviso por correo a Helpdesk:",
          correoError
        );
      }

      /*
       * 4. ABRIR TICKET CREADO
       */

      router.push(
        `/tickets/${ticketData.id}`
      );

      router.refresh();
    } catch (err: any) {
      console.error(err);

      setError(
        `No se ha podido crear el ticket: ${
          err?.message ??
          "Error desconocido"
        }`
      );

      setGuardando(false);
    }
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
          <SupportIcon />
        </div>

        <span>
          Cargando...
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
              href="https://globalcoffeeindustriassa.sharepoint.com/:f:/g/IgAX4zmqxaTCQ6GyOQ9lakgSAeFKPNoWDIPRPPApKvf1Vhs?e=lq5SPl"
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
              style={
                styles.headerDivider
              }
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
                  {userEmail}
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
        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          style={styles.backButton}
        >
          <ArrowLeftIcon />
          Volver a tickets
        </button>

        <div
          style={styles.titleArea}
        >
          <div>
            <h1 style={styles.title}>
              Nueva incidencia
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Describe el problema para
              que el equipo de Informática
              pueda ayudarte.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={
              styles.errorMessage
            }
          >
            <AlertIcon />
            {error}
          </div>
        )}

        <form
          onSubmit={crearTicket}
          style={styles.form}
        >
          {/* CONTACTO */}

          <section style={styles.card}>
            <div
              style={
                styles.cardHeading
              }
            >
              <div
                style={
                  styles.sectionIcon
                }
              >
                <UserIcon />
              </div>

              <div>
                <h2
                  style={
                    styles.cardTitle
                  }
                >
                  Datos de contacto
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  Información de la
                  persona que solicita
                  soporte.
                </p>
              </div>
            </div>

            <div
              style={
                styles.twoColumns
              }
            >
              <Field label="Nombre *">
                <input
                  value={nombre}
                  onChange={(e) =>
                    setNombre(
                      e.target.value
                    )
                  }
                  placeholder="Nombre y apellidos"
                  style={styles.input}
                />
              </Field>

              <Field label="Empresa *">
                <select
                  value={empresa}
                  onChange={(e) =>
                    setEmpresa(
                      e.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="">
                    Seleccionar empresa...
                  </option>

                  {EMPRESAS.map(
                    (empresaItem) => (
                      <option
                        key={
                          empresaItem
                        }
                        value={
                          empresaItem
                        }
                      >
                        {empresaItem}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Correo electrónico *">
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="correo@empresa.com"
                  style={styles.input}
                />
              </Field>

              <Field label="Teléfono">
                <input
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(
                      e.target.value
                    )
                  }
                  placeholder="Teléfono"
                  style={styles.input}
                />
              </Field>
            </div>
          </section>

          {/* INCIDENCIA */}

          <section style={styles.card}>
            <div
              style={
                styles.cardHeading
              }
            >
              <div
                style={
                  styles.sectionIcon
                }
              >
                <IncidentIcon />
              </div>

              <div>
                <h2
                  style={
                    styles.cardTitle
                  }
                >
                  Incidencia
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  Cuéntanos qué problema
                  estás teniendo.
                </p>
              </div>
            </div>

            <div
              style={
                styles.formStack
              }
            >
              <Field label="Título *">
                <input
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(
                      e.target.value
                    )
                  }
                  placeholder="Resume brevemente el problema"
                  style={styles.input}
                />
              </Field>

              <Field label="Descripción *">
                <textarea
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(
                      e.target.value
                    )
                  }
                  placeholder="Describe qué ocurre, cuándo comenzó y cualquier detalle que pueda ayudarnos..."
                  style={
                    styles.textarea
                  }
                />
              </Field>

              <Field label="Importancia">
                <select
                  value={importancia}
                  onChange={(e) =>
                    setImportancia(
                      e.target
                        .value as Importancia
                    )
                  }
                  style={styles.input}
                >
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
              </Field>
            </div>
          </section>

          {/* IMÁGENES */}

          <section style={styles.card}>
            <div
              style={
                styles.cardHeading
              }
            >
              <div
                style={
                  styles.sectionIcon
                }
              >
                <ImageIcon />
              </div>

              <div>
                <h2
                  style={
                    styles.cardTitle
                  }
                >
                  Imágenes
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  Puedes adjuntar
                  capturas o fotografías
                  que ayuden a entender
                  el problema.
                </p>
              </div>
            </div>

            <label
              style={
                styles.attachButton
              }
            >
              <ImageIcon />

              Adjuntar imágenes

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  seleccionarImagenes
                }
                style={{
                  display: "none",
                }}
              />
            </label>

            <span
              style={
                styles.fileHint
              }
            >
              JPG, PNG o WEBP · Máx.
              10 MB por imagen
            </span>

            {imagenes.length > 0 && (
              <div
                style={
                  styles.fileList
                }
              >
                {imagenes.map(
                  (archivo, index) => (
                    <div
                      key={`${archivo.name}-${index}`}
                      style={
                        styles.fileItem
                      }
                    >
                      <div
                        style={
                          styles.fileInfo
                        }
                      >
                        <ImageIcon />

                        <span>
                          {archivo.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          quitarImagen(
                            index
                          )
                        }
                        style={
                          styles.removeFile
                        }
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <div
            style={
              styles.actions
            }
          >
            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              style={
                styles.cancelButton
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              style={{
                ...styles.submitButton,
                opacity:
                  guardando
                    ? 0.6
                    : 1,
              }}
            >
              <TicketPlusIcon />

              {guardando
                ? "Creando..."
                : "Crear ticket"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={styles.fieldLabel}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   ICONOS
========================================================= */

function SupportIcon({
  color = "#00AF9A",
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

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IncidentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
      />

      <circle
        cx="8.5"
        cy="8.5"
        r="1.5"
      />

      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function TicketPlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5" />
      <path d="M18 2v6" />
      <path d="M15 5h6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
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
    fontSize: "13px",
  },

  loadingIcon: {
    width: "48px",
    height: "48px",
    background: "#eaf8f6",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* HEADER: MISMA ESCALA QUE HOME */

  header: {
    background: "#ffffff",
    borderBottom:
      "1px solid #e8ecec",
  },

  headerInner: {
    maxWidth: "1320px",
    minHeight: "86px",
    margin: "0 auto",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "25px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  brandIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  brandTitle: {
    fontSize: "19px",
    fontWeight: 700,
  },

  brandSubtitle: {
    color: "#899191",
    fontSize: "12px",
    marginTop: "3px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  manualsLink: {
    height: "40px",
    padding: "0 14px",
    border:
      "1px solid #dfe4e4",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#555d5d",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  headerDivider: {
    width: "1px",
    height: "34px",
    background: "#e7ebeb",
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

  userEmail: {
    fontSize: "13px",
  },

  role: {
    color: "#00AF9A",
    fontSize: "10px",
    fontWeight: 700,
  },

  logoutButton: {
    width: "42px",
    height: "42px",
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

  /* CONTENIDO */

  container: {
    width: "calc(100% - 56px)",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "38px 0 76px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    marginBottom: "25px",
    color: "#677070",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },

  titleArea: {
    marginBottom: "28px",
  },

  title: {
    margin: "0 0 6px",
    fontSize: "28px",
    fontWeight: 700,
  },

  subtitle: {
    margin: 0,
    color: "#858d8d",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  form: {
    display: "flex",
    flexDirection: "column",
  },

  /* CARDS */

  card: {
    background: "#ffffff",
    border:
      "1px solid #e5e9e9",
    borderRadius: "14px",
    padding: "28px",
    marginBottom: "22px",
  },

  cardHeading: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    paddingBottom: "20px",
    marginBottom: "22px",
    borderBottom:
      "1px solid #edf0f0",
  },

  sectionIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "11px",
    background: "#ecf9f7",
    color: "#00A992",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardTitle: {
    margin: "0 0 4px",
    fontSize: "16px",
    fontWeight: 700,
  },

  cardSubtitle: {
    margin: 0,
    color: "#8a9191",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  fieldLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#444a4a",
    fontSize: "12px",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    height: "46px",
    boxSizing: "border-box",
    border:
      "1px solid #d9dede",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#ffffff",
    color: "#303535",
    outlineColor: "#00AF9A",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "13px",
  },

  textarea: {
    width: "100%",
    minHeight: "165px",
    boxSizing: "border-box",
    resize: "vertical",
    border:
      "1px solid #d9dede",
    borderRadius: "8px",
    padding: "13px",
    background: "#ffffff",
    color: "#303535",
    outlineColor: "#00AF9A",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  /* IMÁGENES */

  attachButton: {
    height: "42px",
    padding: "0 14px",
    border:
      "1px solid #d7dddd",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#525b5b",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  fileHint: {
    marginLeft: "12px",
    color: "#969d9d",
    fontSize: "10px",
  },

  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "17px",
  },

  fileItem: {
    minHeight: "42px",
    padding: "0 13px",
    border:
      "1px solid #e4e8e8",
    borderRadius: "8px",
    background: "#f8fafa",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "15px",
  },

  fileInfo: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#596161",
    fontSize: "11px",
  },

  removeFile: {
    border: "none",
    background: "transparent",
    color: "#8b9292",
    fontSize: "20px",
    cursor: "pointer",
  },

  /* ACCIONES */

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },

  cancelButton: {
    height: "46px",
    padding: "0 20px",
    border:
      "1px solid #d9dede",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#596161",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  submitButton: {
    height: "46px",
    padding: "0 20px",
    border: "none",
    borderRadius: "9px",
    background: "#00AF9A",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  errorMessage: {
    padding: "13px 15px",
    marginBottom: "20px",
    border:
      "1px solid #efcaca",
    borderRadius: "9px",
    background: "#fff1f1",
    color: "#aa4141",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
  },
};
