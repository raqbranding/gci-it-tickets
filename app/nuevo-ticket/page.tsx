"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Importancia = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export default function NuevoTicketPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [emailSesion, setEmailSesion] = useState("");

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [importancia, setImportancia] =
    useState<Importancia>("MEDIA");

  const [archivos, setArchivos] = useState<File[]>([]);

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
      .select("activo")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !acceso || !acceso.activo) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    const correo = user.email ?? "";

    setEmailSesion(correo);
    setEmail(correo);
    setLoading(false);
  }

  function seleccionarArchivos(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!e.target.files) return;

    const nuevos = Array.from(e.target.files);

    setArchivos((actuales) => {
      const combinados = [...actuales, ...nuevos];

      return combinados.slice(0, 5);
    });

    e.target.value = "";
  }

  function eliminarArchivo(index: number) {
    setArchivos((actuales) =>
      actuales.filter((_, i) => i !== index)
    );
  }

  function enviarTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    /*
      EN EL SIGUIENTE PASO CONECTAREMOS ESTO A SUPABASE.

      El ticket se creará automáticamente como:

      estado = PENDIENTE

      y guardaremos también el usuario autenticado.
    */

    alert(
      "Formulario preparado. En el siguiente paso conectaremos el envío a Supabase."
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
          <button
            onClick={() => router.push("/")}
            style={styles.brandButton}
          >
            <div style={styles.logoIcon}>
              <SupportIcon />
            </div>

            <div style={styles.brandText}>
              <div style={styles.brandTitle}>IT Support</div>

              <div style={styles.brandSubtitle}>
                Gestión de incidencias informáticas
              </div>
            </div>
          </button>

          <div style={styles.userEmail}>
            {emailSesion}
          </div>
        </div>
      </header>

      {/* CONTENIDO */}

      <div style={styles.container}>
        {/* VOLVER */}

        <button
          type="button"
          onClick={() => router.push("/")}
          style={styles.backButton}
        >
          <ArrowLeftIcon />
          Volver a tickets
        </button>

        {/* TÍTULO */}

        <div style={styles.pageHeading}>
          <h1 style={styles.pageTitle}>
            Nueva incidencia
          </h1>

          <p style={styles.pageDescription}>
            Cuéntanos qué problema estás teniendo. Informática
            recibirá tu solicitud y podrás seguir su estado desde
            IT Support.
          </p>
        </div>

        {/* FORMULARIO */}

        <form onSubmit={enviarTicket}>
          {/* DATOS DE CONTACTO */}

          <section style={styles.card}>
            <div style={styles.cardHeading}>
              <div style={styles.sectionIcon}>
                <UserIcon />
              </div>

              <div>
                <h2 style={styles.cardTitle}>
                  Datos de contacto
                </h2>

                <p style={styles.cardSubtitle}>
                  Indica cómo podemos localizarte si necesitamos
                  más información.
                </p>
              </div>
            </div>

            <div style={styles.twoColumns}>
              <Field
                label="Nombre"
                required
              >
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                  placeholder="Nombre y apellidos"
                  style={styles.input}
                />
              </Field>

              <Field
                label="Empresa"
                required
              >
                <input
                  type="text"
                  required
                  value={empresa}
                  onChange={(e) =>
                    setEmpresa(e.target.value)
                  }
                  placeholder="Empresa"
                  style={styles.input}
                />
              </Field>

              <Field
                label="Correo electrónico"
                required
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="nombre@empresa.com"
                  style={styles.input}
                />
              </Field>

              <Field label="Teléfono">
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(e.target.value)
                  }
                  placeholder="Teléfono de contacto"
                  style={styles.input}
                />
              </Field>
            </div>
          </section>

          {/* INCIDENCIA */}

          <section style={styles.card}>
            <div style={styles.cardHeading}>
              <div style={styles.sectionIcon}>
                <TicketFormIcon />
              </div>

              <div>
                <h2 style={styles.cardTitle}>
                  Incidencia
                </h2>

                <p style={styles.cardSubtitle}>
                  Describe el problema con el mayor detalle posible.
                </p>
              </div>
            </div>

            <div style={styles.formStack}>
              <Field
                label="Título"
                required
              >
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(e.target.value)
                  }
                  placeholder="Ej. No puedo acceder al correo"
                  style={styles.input}
                />
              </Field>

              <Field
                label="Descripción de la incidencia"
                required
              >
                <textarea
                  required
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(e.target.value)
                  }
                  placeholder="Explica qué ocurre, desde cuándo sucede y cualquier información que pueda ayudarnos a resolverlo..."
                  style={styles.textarea}
                />
              </Field>

              {/* IMPORTANCIA */}

              <Field
                label="Importancia"
                required
              >
                <div style={styles.priorityGrid}>
                  <PriorityButton
                    label="Baja"
                    description="No impide trabajar"
                    value="BAJA"
                    selected={importancia === "BAJA"}
                    onClick={() =>
                      setImportancia("BAJA")
                    }
                  />

                  <PriorityButton
                    label="Media"
                    description="Afecta al trabajo"
                    value="MEDIA"
                    selected={importancia === "MEDIA"}
                    onClick={() =>
                      setImportancia("MEDIA")
                    }
                  />

                  <PriorityButton
                    label="Alta"
                    description="Impide una tarea importante"
                    value="ALTA"
                    selected={importancia === "ALTA"}
                    onClick={() =>
                      setImportancia("ALTA")
                    }
                  />

                  <PriorityButton
                    label="Urgente"
                    description="Bloqueo crítico"
                    value="URGENTE"
                    selected={importancia === "URGENTE"}
                    onClick={() =>
                      setImportancia("URGENTE")
                    }
                  />
                </div>
              </Field>

              {/* ARCHIVOS */}

              <Field label="Fotografías o capturas">
                <label style={styles.uploadArea}>
                  <div style={styles.uploadIcon}>
                    <UploadIcon />
                  </div>

                  <strong style={styles.uploadTitle}>
                    Añadir imágenes
                  </strong>

                  <span style={styles.uploadText}>
                    Puedes adjuntar hasta 5 fotografías o capturas
                    que ayuden a entender la incidencia.
                  </span>

                  <span style={styles.uploadButton}>
                    Seleccionar archivos
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={seleccionarArchivos}
                    style={{ display: "none" }}
                  />
                </label>

                {archivos.length > 0 && (
                  <div style={styles.fileList}>
                    {archivos.map((archivo, index) => (
                      <div
                        key={`${archivo.name}-${index}`}
                        style={styles.fileItem}
                      >
                        <div style={styles.fileInfo}>
                          <div style={styles.fileIcon}>
                            <ImageIcon />
                          </div>

                          <div style={styles.fileText}>
                            <strong style={styles.fileName}>
                              {archivo.name}
                            </strong>

                            <span style={styles.fileSize}>
                              {formatearTamano(
                                archivo.size
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            eliminarArchivo(index)
                          }
                          style={styles.removeFile}
                          aria-label="Eliminar archivo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.fileCounter}>
                  {archivos.length}/5 archivos
                </div>
              </Field>
            </div>
          </section>

          {/* ACCIONES */}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={styles.cancelButton}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={styles.submitButton}
            >
              <SendIcon />
              Enviar ticket
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={styles.label}>
        {label}

        {required && (
          <span style={styles.required}> *</span>
        )}
      </label>

      {children}
    </div>
  );
}

function PriorityButton({
  label,
  description,
  value,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  value: Importancia;
  selected: boolean;
  onClick: () => void;
}) {
  const colors: Record<
    Importancia,
    {
      normal: string;
      selected: string;
      dot: string;
    }
  > = {
    BAJA: {
      normal: "#ffffff",
      selected: "#eef8f5",
      dot: "#4cab91",
    },

    MEDIA: {
      normal: "#ffffff",
      selected: "#fff6df",
      dot: "#e7ad2f",
    },

    ALTA: {
      normal: "#ffffff",
      selected: "#fff0e8",
      dot: "#e77a3d",
    },

    URGENTE: {
      normal: "#ffffff",
      selected: "#fff0f0",
      dot: "#d94b4b",
    },
  };

  const color = colors[value];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.priorityButton,
        background: selected
          ? color.selected
          : color.normal,
        border: selected
          ? `1px solid ${color.dot}`
          : "1px solid #dfe4e4",
      }}
    >
      <span
        style={{
          ...styles.priorityDot,
          background: color.dot,
        }}
      />

      <span style={styles.priorityText}>
        <strong style={styles.priorityTitle}>
          {label}
        </strong>

        <span style={styles.priorityDescription}>
          {description}
        </span>
      </span>
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

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function TicketFormIcon() {
  return (
    <svg
      width="21"
      height="21"
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

function UploadIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
    </svg>
  );
}

function ImageIcon() {
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
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
      />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function SendIcon() {
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
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

/* =========================================================
   UTILIDADES
========================================================= */

function formatearTamano(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* =========================================================
   ESTILOS
========================================================= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f7",
    color: "#202424",
    fontFamily: "'Poppins', Arial, sans-serif",
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
    minHeight: "78px",
    margin: "0 auto",
    padding: "0 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
  },

  brandButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    cursor: "pointer",
    fontFamily: "'Poppins', Arial, sans-serif",
    textAlign: "left",
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

  brandText: {
    display: "block",
  },

  brandTitle: {
    color: "#202424",
    fontSize: "17px",
    fontWeight: 700,
    lineHeight: 1.2,
  },

  brandSubtitle: {
    marginTop: "4px",
    color: "#8a9191",
    fontSize: "11px",
  },

  userEmail: {
    color: "#555d5d",
    fontSize: "12px",
    fontWeight: 500,
  },

  container: {
    width: "calc(100% - 48px)",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "34px 0 70px",
  },

  backButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#677070",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "24px",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
  },

  pageHeading: {
    marginBottom: "28px",
  },

  pageTitle: {
    margin: "0 0 7px",
    color: "#202424",
    fontSize: "28px",
    fontWeight: 700,
  },

  pageDescription: {
    maxWidth: "680px",
    margin: 0,
    color: "#7b8282",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e9e9",
    borderRadius: "14px",
    padding: "26px",
    marginBottom: "20px",
  },

  cardHeading: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    paddingBottom: "20px",
    marginBottom: "22px",
    borderBottom: "1px solid #edf0f0",
  },

  sectionIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#ecf9f7",
    color: "#00A992",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardTitle: {
    margin: "0 0 3px",
    color: "#202424",
    fontSize: "15px",
    fontWeight: 700,
  },

  cardSubtitle: {
    margin: 0,
    color: "#8a9191",
    fontSize: "11px",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#343838",
    fontSize: "12px",
    fontWeight: 600,
  },

  required: {
    color: "#00AF9A",
  },

  input: {
    width: "100%",
    height: "44px",
    boxSizing: "border-box",
    border: "1px solid #d9dede",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#ffffff",
    color: "#303535",
    outlineColor: "#00AF9A",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "12px",
  },

  textarea: {
    width: "100%",
    minHeight: "150px",
    resize: "vertical",
    boxSizing: "border-box",
    border: "1px solid #d9dede",
    borderRadius: "8px",
    padding: "13px",
    background: "#ffffff",
    color: "#303535",
    outlineColor: "#00AF9A",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  priorityGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "10px",
  },

  priorityButton: {
    minHeight: "70px",
    borderRadius: "9px",
    padding: "12px 13px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "'Poppins', Arial, sans-serif",
  },

  priorityDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  priorityText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  priorityTitle: {
    color: "#303535",
    fontSize: "12px",
    fontWeight: 600,
  },

  priorityDescription: {
    color: "#8a9191",
    fontSize: "9px",
    lineHeight: 1.4,
  },

  uploadArea: {
    minHeight: "175px",
    border: "1px dashed #cbd3d3",
    borderRadius: "10px",
    background: "#fafcfc",
    padding: "25px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    cursor: "pointer",
  },

  uploadIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "11px",
    background: "#ecf9f7",
    color: "#00A992",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
  },

  uploadTitle: {
    color: "#303535",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "4px",
  },

  uploadText: {
    maxWidth: "470px",
    color: "#8a9191",
    fontSize: "10px",
    lineHeight: 1.5,
    marginBottom: "13px",
  },

  uploadButton: {
    border: "1px solid #00AF9A",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#009682",
    padding: "8px 13px",
    fontSize: "10px",
    fontWeight: 600,
  },

  fileList: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  fileItem: {
    minHeight: "54px",
    border: "1px solid #e4e8e8",
    borderRadius: "8px",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
  },

  fileInfo: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  fileIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "7px",
    background: "#ecf9f7",
    color: "#00A992",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  fileText: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  fileName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#343838",
    fontSize: "10px",
    fontWeight: 500,
  },

  fileSize: {
    color: "#969c9c",
    fontSize: "9px",
  },

  removeFile: {
    width: "30px",
    height: "30px",
    border: "none",
    borderRadius: "7px",
    background: "#f5f7f7",
    color: "#737a7a",
    fontSize: "18px",
    lineHeight: 1,
    cursor: "pointer",
    flexShrink: 0,
  },

  fileCounter: {
    marginTop: "7px",
    color: "#9ba1a1",
    fontSize: "9px",
    textAlign: "right",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
  },

  cancelButton: {
    height: "42px",
    padding: "0 18px",
    border: "1px solid #d8dddd",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#555d5d",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
  },

  submitButton: {
    height: "42px",
    padding: "0 19px",
    border: "none",
    borderRadius: "8px",
    background: "#00AF9A",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
