"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { EMPRESAS } from "../../../lib/empresas";

type Rol = "ADMIN" | "USUARIO";
type Estado = "PENDIENTE" | "EN_CURSO" | "RESUELTO";
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
  creado_en: string;
  actualizado_en: string;
  resuelto_en: string | null;
  resuelto_por: string | null;
};

type Seguimiento = {
  id: string;
  ticket_id: string;
  creado_por: string;
  mensaje: string;
  creado_en: string;
};

type ArchivoSeguimiento = {
  id: string;
  seguimiento_id: string;
  ticket_id: string;
  nombre_archivo: string;
  ruta_storage: string;
  tipo_mime: string | null;
  tamano: number | null;
  creado_por: string;
  creado_en: string;
  url?: string;
};

type Tag = {
  id: string;
  nombre: string;
  color: string;
};

type ImagenPendiente = {
  file: File;
  preview: string;
};

export default function TicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [rol, setRol] = useState<Rol | null>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [estadoEditado, setEstadoEditado] =
    useState<Estado>("PENDIENTE");

  const [importanciaEditada, setImportanciaEditada] =
    useState<Importancia>("BAJA");

  const [seguimientos, setSeguimientos] =
    useState<Seguimiento[]>([]);

  const [archivos, setArchivos] =
    useState<ArchivoSeguimiento[]>([]);

  const [nuevoSeguimiento, setNuevoSeguimiento] = useState("");

  const [imagenesPendientes, setImagenesPendientes] =
    useState<ImagenPendiente[]>([]);

  const [imagenAmpliada, setImagenAmpliada] =
    useState<string | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);

  const [tagsTicketOriginales, setTagsTicketOriginales] =
    useState<Tag[]>([]);

  const [tagsTicket, setTagsTicket] = useState<Tag[]>([]);

  const [nuevoTagNombre, setNuevoTagNombre] = useState("");
  const [nuevoTagColor, setNuevoTagColor] = useState("#00AF9A");

  const [error, setError] = useState("");
  const [mensajeGuardado, setMensajeGuardado] = useState("");

  useEffect(() => {
    if (ticketId) {
      cargarPagina();
    }
  }, [ticketId]);

  async function cargarPagina() {
    setLoading(true);
    setError("");
    setMensajeGuardado("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: acceso, error: accesoError } =
      await supabase
        .from("it_usuarios")
        .select("rol, activo")
        .eq("user_id", user.id)
        .maybeSingle();

    if (accesoError || !acceso || !acceso.activo) {
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    const rolUsuario = acceso.rol as Rol;

    setUserId(user.id);
    setUserEmail(user.email ?? "");
    setRol(rolUsuario);

    const { data: ticketData, error: ticketError } =
      await supabase
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
          creado_en,
          actualizado_en,
          resuelto_en,
          resuelto_por
        `)
        .eq("id", ticketId)
        .maybeSingle();

    if (ticketError || !ticketData) {
      console.error(ticketError);
      setTicket(null);
      setLoading(false);
      return;
    }

    const ticketActual = ticketData as Ticket;

    setTicket(ticketActual);

    setNombre(ticketActual.nombre ?? "");
    setEmpresa(ticketActual.empresa ?? "");
    setEmail(ticketActual.email ?? "");
    setTelefono(ticketActual.telefono ?? "");

    setEstadoEditado(ticketActual.estado);
    setImportanciaEditada(ticketActual.importancia);

    await Promise.all([
      cargarSeguimientos(),
      cargarTags(rolUsuario),
    ]);

    setLoading(false);
  }

  async function cargarSeguimientos() {
    const { data, error: seguimientoError } =
      await supabase
        .from("it_seguimientos")
        .select(`
          id,
          ticket_id,
          creado_por,
          mensaje,
          creado_en
        `)
        .eq("ticket_id", ticketId)
        .order("creado_en", {
          ascending: true,
        });

    if (seguimientoError) {
      console.error(seguimientoError);
      return;
    }

    setSeguimientos((data ?? []) as Seguimiento[]);

    await cargarArchivosSeguimiento();
  }

  async function cargarArchivosSeguimiento() {
    const { data, error: archivosError } =
      await supabase
        .from("it_seguimiento_archivos")
        .select(`
          id,
          seguimiento_id,
          ticket_id,
          nombre_archivo,
          ruta_storage,
          tipo_mime,
          tamano,
          creado_por,
          creado_en
        `)
        .eq("ticket_id", ticketId)
        .order("creado_en", {
          ascending: true,
        });

    if (archivosError) {
      console.error(archivosError);
      return;
    }

    const lista = (data ?? []) as ArchivoSeguimiento[];

    const listaConUrls = await Promise.all(
      lista.map(async (archivo) => {
        const { data: signedData } =
          await supabase.storage
            .from("it-tickets")
            .createSignedUrl(
              archivo.ruta_storage,
              60 * 60
            );

        return {
          ...archivo,
          url: signedData?.signedUrl,
        };
      })
    );

    setArchivos(listaConUrls);
  }

  async function cargarTags(rolUsuario: Rol) {
    const {
      data: relaciones,
      error: relacionesError,
    } = await supabase
      .from("it_ticket_tags")
      .select(`
        tag_id,
        it_tags (
          id,
          nombre,
          color
        )
      `)
      .eq("ticket_id", ticketId);

    if (!relacionesError && relaciones) {
      const asignados: Tag[] = [];

      relaciones.forEach((relacion: any) => {
        const tagData = Array.isArray(relacion.it_tags)
          ? relacion.it_tags[0]
          : relacion.it_tags;

        if (tagData) {
          asignados.push({
            id: tagData.id,
            nombre: tagData.nombre,
            color: tagData.color,
          });
        }
      });

      setTagsTicket(asignados);
      setTagsTicketOriginales(asignados);
    }

    if (rolUsuario === "ADMIN") {
      const { data: tagsData, error: tagsError } =
        await supabase
          .from("it_tags")
          .select("id, nombre, color")
          .order("nombre");

      if (tagsError) {
        console.error(tagsError);
        return;
      }

      setTags((tagsData ?? []) as Tag[]);
    }
  }

  const hayCambiosContacto = useMemo(() => {
    if (!ticket) return false;

    return (
      nombre.trim() !== (ticket.nombre ?? "") ||
      empresa !== (ticket.empresa ?? "") ||
      email.trim() !== (ticket.email ?? "") ||
      telefono.trim() !== (ticket.telefono ?? "")
    );
  }, [ticket, nombre, empresa, email, telefono]);

  const hayCambiosAdmin = useMemo(() => {
    if (!ticket || rol !== "ADMIN") return false;

    const originales = tagsTicketOriginales
      .map((tag) => tag.id)
      .sort()
      .join(",");

    const actuales = tagsTicket
      .map((tag) => tag.id)
      .sort()
      .join(",");

    return (
      estadoEditado !== ticket.estado ||
      importanciaEditada !== ticket.importancia ||
      originales !== actuales
    );
  }, [
    ticket,
    rol,
    estadoEditado,
    importanciaEditada,
    tagsTicket,
    tagsTicketOriginales,
  ]);

  const haySeguimientoPendiente =
    nuevoSeguimiento.trim().length > 0 ||
    imagenesPendientes.length > 0;

  const hayCualquierCambio =
    hayCambiosContacto ||
    (rol === "ADMIN" && hayCambiosAdmin) ||
    haySeguimientoPendiente;

  async function guardarDatosContacto() {
    if (!ticket) return;

    if (!nombre.trim() || !empresa || !email.trim()) {
      throw new Error(
        "Nombre, empresa y correo electrónico son obligatorios."
      );
    }

    const ahora = new Date().toISOString();

    const { error: guardarError } =
      await supabase
        .from("it_tickets")
        .update({
          nombre: nombre.trim(),
          empresa,
          email: email.trim(),
          telefono: telefono.trim() || null,
          actualizado_en: ahora,
        })
        .eq("id", ticket.id);

    if (guardarError) {
      throw guardarError;
    }

    setTicket((actual) =>
      actual
        ? {
            ...actual,
            nombre: nombre.trim(),
            empresa,
            email: email.trim(),
            telefono: telefono.trim() || null,
            actualizado_en: ahora,
          }
        : actual
    );
  }

  async function guardarDatosAdmin() {
    if (!ticket || rol !== "ADMIN") return;

    const pasaAEnCurso =
      ticket.estado !== "EN_CURSO" &&
      estadoEditado === "EN_CURSO";

    const ahora = new Date().toISOString();

    const cambiosTicket: {
      estado: Estado;
      importancia: Importancia;
      actualizado_en: string;
      resuelto_en: string | null;
      resuelto_por: string | null;
    } = {
      estado: estadoEditado,
      importancia: importanciaEditada,
      actualizado_en: ahora,
      resuelto_en: null,
      resuelto_por: null,
    };

    if (estadoEditado === "RESUELTO") {
      cambiosTicket.resuelto_en =
        ticket.estado === "RESUELTO" &&
        ticket.resuelto_en
          ? ticket.resuelto_en
          : ahora;

      cambiosTicket.resuelto_por =
        ticket.estado === "RESUELTO" &&
        ticket.resuelto_por
          ? ticket.resuelto_por
          : userId;
    }

    const { error: ticketError } =
      await supabase
        .from("it_tickets")
        .update(cambiosTicket)
        .eq("id", ticket.id);

    if (ticketError) {
      throw ticketError;
    }

    const idsOriginales =
      tagsTicketOriginales.map((tag) => tag.id);

    const idsActuales =
      tagsTicket.map((tag) => tag.id);

    const tagsParaAñadir =
      idsActuales.filter(
        (id) => !idsOriginales.includes(id)
      );

    const tagsParaQuitar =
      idsOriginales.filter(
        (id) => !idsActuales.includes(id)
      );

    if (tagsParaAñadir.length > 0) {
      const relaciones =
        tagsParaAñadir.map((tagId) => ({
          ticket_id: ticket.id,
          tag_id: tagId,
        }));

      const { error: insertError } =
        await supabase
          .from("it_ticket_tags")
          .upsert(relaciones, {
            onConflict: "ticket_id,tag_id",
            ignoreDuplicates: true,
          });

      if (insertError) {
        throw insertError;
      }
    }

    if (tagsParaQuitar.length > 0) {
      const { error: deleteError } =
        await supabase
          .from("it_ticket_tags")
          .delete()
          .eq("ticket_id", ticket.id)
          .in("tag_id", tagsParaQuitar);

      if (deleteError) {
        throw deleteError;
      }
    }

    setTicket((actual) =>
      actual
        ? {
            ...actual,
            estado: estadoEditado,
            importancia: importanciaEditada,
            actualizado_en: ahora,
            resuelto_en: cambiosTicket.resuelto_en,
            resuelto_por: cambiosTicket.resuelto_por,
          }
        : actual
    );

    setTagsTicketOriginales([...tagsTicket]);

    /*
     * CORREO AUTOMÁTICO AL PASAR A EN CURSO.
     *
     * El estado ya está guardado en Supabase.
     * Si el correo falla, no deshacemos
     * el cambio de estado.
     */
    if (pasaAEnCurso) {
      try {
        const respuestaCorreo =
          await fetch(
            "/api/tickets/gestionado",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                numero: ticket.numero,
                ticketId: ticket.id,
                titulo: ticket.titulo,
                nombre:
                  nombre.trim() ||
                  ticket.nombre,
                empresa:
                  empresa ||
                  ticket.empresa,
                email:
                  email.trim() ||
                  ticket.email,
              }),
            }
          );

        if (!respuestaCorreo.ok) {
          const detalle =
            await respuestaCorreo
              .json()
              .catch(() => null);

          console.error(
            "El estado se actualizó, pero no se pudo enviar el correo de incidencia en gestión:",
            detalle
          );
        }
      } catch (correoError) {
        console.error(
          "El estado se actualizó, pero falló la notificación de incidencia en gestión:",
          correoError
        );
      }
    }
  }

  function seleccionarTag(tagId: string) {
    if (rol !== "ADMIN" || !tagId) return;

    const existe = tagsTicket.some(
      (tag) => tag.id === tagId
    );

    if (existe) return;

    const tag = tags.find(
      (item) => item.id === tagId
    );

    if (!tag) return;

    setTagsTicket((actuales) => [
      ...actuales,
      tag,
    ]);

    setMensajeGuardado("");
  }

  function quitarTag(tagId: string) {
    if (rol !== "ADMIN") return;

    setTagsTicket((actuales) =>
      actuales.filter(
        (tag) => tag.id !== tagId
      )
    );

    setMensajeGuardado("");
  }

  async function crearTag() {
    if (
      rol !== "ADMIN" ||
      !nuevoTagNombre.trim()
    ) {
      return;
    }

    setError("");
    setMensajeGuardado("");

    const nombreNuevo =
      nuevoTagNombre.trim().toUpperCase();

    const existente = tags.find(
      (tag) =>
        tag.nombre.toUpperCase() === nombreNuevo
    );

    if (existente) {
      seleccionarTag(existente.id);
      setNuevoTagNombre("");
      return;
    }

    const { data, error: crearError } =
      await supabase
        .from("it_tags")
        .insert({
          nombre: nombreNuevo,
          color: nuevoTagColor,
          creado_por: userId,
        })
        .select("id, nombre, color")
        .single();

    if (crearError) {
      throw new Error(
        crearError.code === "23505"
          ? "Ya existe un tag con ese nombre."
          : crearError.message
      );
    }

    const nuevoTag = data as Tag;

    setTags((actuales) =>
      [...actuales, nuevoTag].sort(
        (a, b) =>
          a.nombre.localeCompare(b.nombre)
      )
    );

    setTagsTicket((actuales) => {
      if (
        actuales.some(
          (tag) => tag.id === nuevoTag.id
        )
      ) {
        return actuales;
      }

      return [...actuales, nuevoTag];
    });

    setNuevoTagNombre("");
    setNuevoTagColor("#00AF9A");
  }

  function seleccionarImagenes(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const seleccionadas =
      Array.from(event.target.files ?? []);

    if (seleccionadas.length === 0) {
      return;
    }

    setError("");
    setMensajeGuardado("");

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const invalidas =
      seleccionadas.filter(
        (file) =>
          !tiposPermitidos.includes(file.type)
      );

    if (invalidas.length > 0) {
      setError(
        "Solo se pueden adjuntar imágenes JPG, PNG o WEBP."
      );

      event.target.value = "";
      return;
    }

    const demasiadoGrandes =
      seleccionadas.filter(
        (file) =>
          file.size > 10 * 1024 * 1024
      );

    if (demasiadoGrandes.length > 0) {
      setError(
        "Cada imagen puede tener un tamaño máximo de 10 MB."
      );

      event.target.value = "";
      return;
    }

    const nuevas =
      seleccionadas.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setImagenesPendientes(
      (actuales) => [
        ...actuales,
        ...nuevas,
      ]
    );

    event.target.value = "";
  }

  function quitarImagenPendiente(index: number) {
    setImagenesPendientes((actuales) => {
      const imagen = actuales[index];

      if (imagen) {
        URL.revokeObjectURL(imagen.preview);
      }

      return actuales.filter(
        (_, i) => i !== index
      );
    });

    setMensajeGuardado("");
  }

  async function guardarSeguimiento() {
    if (!ticket) return;

    const texto = nuevoSeguimiento.trim();

    if (
      !texto &&
      imagenesPendientes.length === 0
    ) {
      return;
    }

    const mensajeBD =
      texto || "Imagen adjunta";

    const {
      data: seguimientoData,
      error: seguimientoError,
    } = await supabase
      .from("it_seguimientos")
      .insert({
        ticket_id: ticket.id,
        creado_por: userId,
        mensaje: mensajeBD,
      })
      .select(`
        id,
        ticket_id,
        creado_por,
        mensaje,
        creado_en
      `)
      .single();

    if (seguimientoError) {
      throw seguimientoError;
    }

    const seguimiento =
      seguimientoData as Seguimiento;

    const nuevosArchivos:
      ArchivoSeguimiento[] = [];

    for (
      let i = 0;
      i < imagenesPendientes.length;
      i++
    ) {
      const imagen =
        imagenesPendientes[i];

      const extension =
        imagen.file.name
          .split(".")
          .pop()
          ?.toLowerCase() ?? "jpg";

      const nombreSeguro =
        imagen.file.name
          .replace(/\.[^/.]+$/, "")
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .slice(0, 70);

      const ruta =
        `${ticket.id}/` +
        `${seguimiento.id}/` +
        `${Date.now()}-${i}-${crypto.randomUUID()}-` +
        `${nombreSeguro}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("it-tickets")
          .upload(
            ruta,
            imagen.file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                imagen.file.type,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: archivoData,
        error: archivoError,
      } = await supabase
        .from("it_seguimiento_archivos")
        .insert({
          seguimiento_id:
            seguimiento.id,
          ticket_id: ticket.id,
          nombre_archivo:
            imagen.file.name,
          ruta_storage: ruta,
          tipo_mime:
            imagen.file.type,
          tamano:
            imagen.file.size,
          creado_por: userId,
        })
        .select(`
          id,
          seguimiento_id,
          ticket_id,
          nombre_archivo,
          ruta_storage,
          tipo_mime,
          tamano,
          creado_por,
          creado_en
        `)
        .single();

      if (archivoError) {
        throw archivoError;
      }

      const { data: signedData } =
        await supabase.storage
          .from("it-tickets")
          .createSignedUrl(
            ruta,
            60 * 60
          );

      nuevosArchivos.push({
        ...(archivoData as ArchivoSeguimiento),
        url: signedData?.signedUrl,
      });
    }

    setSeguimientos(
      (actuales) => [
        ...actuales,
        seguimiento,
      ]
    );

    setArchivos(
      (actuales) => [
        ...actuales,
        ...nuevosArchivos,
      ]
    );

    /*
     * CORREO AUTOMÁTICO DE SEGUIMIENTO
     *
     * ADMIN   -> usuario del ticket
     * USUARIO -> Helpdesk
     *
     * El fallo del correo no impide que
     * el seguimiento quede guardado.
     */
    try {
      const respuestaCorreo =
        await fetch(
          "/api/tickets/seguimiento",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              numero: ticket.numero,
              ticketId: ticket.id,
              titulo: ticket.titulo,
              mensaje: mensajeBD,
              nombre: ticket.nombre,
              empresa: ticket.empresa,
              email: ticket.email,
              autorRol: rol,
            }),
          }
        );

      if (!respuestaCorreo.ok) {
        const detalle =
          await respuestaCorreo
            .json()
            .catch(() => null);

        console.error(
          "El seguimiento se guardó, pero no se pudo enviar el correo:",
          detalle
        );
      }
    } catch (correoError) {
      console.error(
        "El seguimiento se guardó, pero falló la notificación por correo:",
        correoError
      );
    }

    imagenesPendientes.forEach(
      (imagen) => {
        URL.revokeObjectURL(
          imagen.preview
        );
      }
    );

    setImagenesPendientes([]);
    setNuevoSeguimiento("");
  }

  async function guardarTodo() {
    if (
      !ticket ||
      !rol ||
      !hayCualquierCambio ||
      guardando
    ) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensajeGuardado("");

    try {
      if (hayCambiosContacto) {
        await guardarDatosContacto();
      }

      if (
        rol === "ADMIN" &&
        hayCambiosAdmin
      ) {
        await guardarDatosAdmin();
      }

      if (haySeguimientoPendiente) {
        await guardarSeguimiento();
      }

      setMensajeGuardado(
        "Ticket actualizado"
      );
    } catch (err: any) {
      console.error(err);

      setError(
        `No se han podido guardar los cambios: ${
          err?.message ??
          "Error desconocido"
        }`
      );
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.loading}>
        <div style={styles.loadingIcon}>
          <SupportIcon
            color="#00AF9A"
          />
        </div>

        <p style={styles.loadingText}>
          Cargando ticket...
        </p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main style={styles.page}>
        <Header
          email={userEmail}
          rol={rol}
          onLogout={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        />

        <div style={styles.container}>
          <button
            onClick={() =>
              router.push("/")
            }
            style={styles.backButton}
          >
            <ArrowLeftIcon />
            Volver
          </button>

          <div style={styles.notFound}>
            <div
              style={
                styles.notFoundIcon
              }
            >
              <TicketIcon />
            </div>

            <h1
              style={
                styles.notFoundTitle
              }
            >
              Ticket no disponible
            </h1>

            <p
              style={
                styles.notFoundText
              }
            >
              El ticket no existe o no
              tienes permiso para
              consultarlo.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <Header
        email={userEmail}
        rol={rol}
        onLogout={async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        }}
      />

      <div style={styles.container}>
        <button
          onClick={() =>
            router.push("/")
          }
          style={styles.backButton}
        >
          <ArrowLeftIcon />
          Volver a tickets
        </button>

        <section
          style={styles.ticketHeader}
        >
          <div
            style={
              styles.ticketHeaderLeft
            }
          >
            <div
              style={styles.ticketNumber}
            >
              {ticket.numero
                ? `TICKET #${ticket.numero}`
                : "TICKET"}
            </div>

            <h1 style={styles.pageTitle}>
              {ticket.titulo}
            </h1>

            <div
              style={styles.headerMeta}
            >
              <span>
                Creado{" "}
                {formatearFecha(
                  ticket.creado_en
                )}
              </span>

              <span
                style={styles.metaDot}
              >
                •
              </span>

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
            </div>
          </div>

          <div
            style={
              styles.ticketHeaderRight
            }
          >
            <div
              style={
                styles.headerControl
              }
            >
              <span
                style={
                  styles.controlLabel
                }
              >
                Importancia
              </span>

              {rol === "ADMIN" ? (
                <select
                  value={
                    importanciaEditada
                  }
                  onChange={(e) => {
                    setImportanciaEditada(
                      e.target
                        .value as Importancia
                    );

                    setMensajeGuardado(
                      ""
                    );
                  }}
                  style={{
                    ...styles.controlSelect,
                    ...getImportanciaStyle(
                      importanciaEditada
                    ),
                  }}
                >
                  <option value="BAJA">
                    ● Baja
                  </option>

                  <option value="MEDIA">
                    ● Media
                  </option>

                  <option value="ALTA">
                    ● Alta
                  </option>

                  <option value="URGENTE">
                    ● Urgente
                  </option>
                </select>
              ) : (
                <PriorityBadge
                  importancia={
                    ticket.importancia
                  }
                />
              )}
            </div>

            <div
              style={
                styles.headerControl
              }
            >
              <span
                style={
                  styles.controlLabel
                }
              >
                Estado
              </span>

              {rol === "ADMIN" ? (
                <select
                  value={estadoEditado}
                  onChange={(e) => {
                    setEstadoEditado(
                      e.target
                        .value as Estado
                    );

                    setMensajeGuardado(
                      ""
                    );
                  }}
                  style={{
                    ...styles.controlSelect,
                    ...getEstadoStyle(
                      estadoEditado
                    ),
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
          </div>
        </section>

        {error && (
          <div
            style={styles.errorMessage}
          >
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <div style={styles.layout}>
          <div
            style={styles.mainColumn}
          >
            <section
              style={styles.card}
            >
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
                    Información original
                    enviada al crear el
                    ticket.
                  </p>
                </div>
              </div>

              <div
                style={
                  styles.readOnlyField
                }
              >
                <span
                  style={
                    styles.fieldLabel
                  }
                >
                  Título
                </span>

                <div
                  style={
                    styles.readOnlyValue
                  }
                >
                  {ticket.titulo}
                </div>
              </div>

              <div
                style={
                  styles.readOnlyField
                }
              >
                <span
                  style={
                    styles.fieldLabel
                  }
                >
                  Descripción
                </span>

                <div
                  style={
                    styles.descriptionBox
                  }
                >
                  {ticket.descripcion}
                </div>
              </div>
            </section>

                      <section
              style={styles.card}
            >
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
                  <ConversationIcon />
                </div>

                <div>
                  <h2
                    style={
                      styles.cardTitle
                    }
                  >
                    Seguimiento
                  </h2>

                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    Historial de
                    comunicaciones sobre
                    esta incidencia.
                  </p>
                </div>
              </div>

              {seguimientos.length ===
              0 ? (
                <div
                  style={
                    styles.noFollowUps
                  }
                >
                  Todavía no hay notas de
                  seguimiento.
                </div>
              ) : (
                <div
                  style={styles.timeline}
                >
                  {seguimientos.map(
                    (seguimiento) => {
                      const esCreador =
                        seguimiento.creado_por ===
                        ticket.creado_por;

                      const esMio =
                        seguimiento.creado_por ===
                        userId;

                      const esInformatico =
                        !esCreador;

                      const imagenes =
                        archivos.filter(
                          (archivo) =>
                            archivo.seguimiento_id ===
                            seguimiento.id
                        );

                      const soloImagen =
                        seguimiento.mensaje ===
                          "Imagen adjunta" &&
                        imagenes.length > 0;

                      return (
                        <div
                          key={
                            seguimiento.id
                          }
                          style={
                            styles.timelineItem
                          }
                        >
                          <div
                            style={{
                              ...styles.timelineAvatar,
                              ...(esInformatico
                                ? styles.timelineAvatarIT
                                : styles.timelineAvatarUser),
                            }}
                          >
                            {esInformatico ? (
                              <SupportIcon
                                color="#ffffff"
                                size={16}
                              />
                            ) : (
                              <UserSmallIcon />
                            )}
                          </div>

                          <div
                            style={
                              styles.timelineContent
                            }
                          >
                            <div
                              style={
                                styles.timelineHeader
                              }
                            >
                              <strong
                                style={
                                  styles.timelineAuthor
                                }
                              >
                                {esInformatico
                                  ? "Informática"
                                  : esMio
                                  ? "Tú"
                                  : ticket.nombre}
                              </strong>

                              <span
                                style={
                                  styles.timelineDate
                                }
                              >
                                {formatearFecha(
                                  seguimiento.creado_en
                                )}
                              </span>
                            </div>

                            {!soloImagen && (
                              <div
                                style={
                                  styles.timelineMessage
                                }
                              >
                                {
                                  seguimiento.mensaje
                                }
                              </div>
                            )}

                            {imagenes.length >
                              0 && (
                              <div
                                style={
                                  styles.followUpImages
                                }
                              >
                                {imagenes.map(
                                  (archivo) =>
                                    archivo.url ? (
                                      <button
                                        key={
                                          archivo.id
                                        }
                                        type="button"
                                        onClick={() =>
                                          setImagenAmpliada(
                                            archivo.url!
                                          )
                                        }
                                        style={
                                          styles.followUpImageButton
                                        }
                                      >
                                        <img
                                          src={
                                            archivo.url
                                          }
                                          alt={
                                            archivo.nombre_archivo
                                          }
                                          style={
                                            styles.followUpImage
                                          }
                                        />
                                      </button>
                                    ) : null
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div
                style={
                  styles.followUpComposer
                }
              >
                <label
                  style={styles.fieldLabel}
                >
                  Nueva nota de seguimiento
                </label>

                <textarea
                  value={nuevoSeguimiento}
                  onChange={(e) => {
                    setNuevoSeguimiento(
                      e.target.value
                    );

                    setMensajeGuardado(
                      ""
                    );
                  }}
                  placeholder={
                    rol === "ADMIN"
                      ? "Escribe una nota o respuesta para el usuario..."
                      : "Añade información o responde a Informática..."
                  }
                  style={styles.textarea}
                />

                {imagenesPendientes.length >
                  0 && (
                  <div
                    style={
                      styles.previewGrid
                    }
                  >
                    {imagenesPendientes.map(
                      (imagen, index) => (
                        <div
                          key={`${imagen.file.name}-${index}`}
                          style={
                            styles.previewItem
                          }
                        >
                          <img
                            src={
                              imagen.preview
                            }
                            alt={
                              imagen.file.name
                            }
                            style={
                              styles.previewImage
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              quitarImagenPendiente(
                                index
                              )
                            }
                            style={
                              styles.removeImage
                            }
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div
                  style={
                    styles.composerFooter
                  }
                >
                  <div
                    style={
                      styles.composerLeft
                    }
                  >
                    <label
                      style={
                        styles.attachButton
                      }
                    >
                      <ImageIcon />
                      Adjuntar imágenes

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
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
                        styles.composerHint
                      }
                    >
                      JPG, PNG o WEBP ·
                      Máx. 10 MB
                    </span>
                  </div>

                  <div
                    style={
                      styles.saveRight
                    }
                  >
                    {mensajeGuardado && (
                      <span
                        style={
                          styles.savedMessage
                        }
                      >
                        <CheckIcon />
                        {
                          mensajeGuardado
                        }
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={guardarTodo}
                      disabled={
                        guardando ||
                        !hayCualquierCambio
                      }
                      style={{
                        ...styles.saveButton,
                        opacity:
                          guardando ||
                          !hayCualquierCambio
                            ? 0.5
                            : 1,
                        cursor:
                          guardando ||
                          !hayCualquierCambio
                            ? "default"
                            : "pointer",
                      }}
                    >
                      <SaveIcon />

                      {guardando
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside
            style={styles.sideColumn}
          >
            <section style={styles.card}>
              <div
                style={
                  styles.cardHeadingCompact
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
                    Información del
                    solicitante.
                  </p>
                </div>
              </div>

              <div
                style={styles.formStack}
              >
                <Field label="Nombre">
                  <input
                    value={nombre}
                    onChange={(e) => {
                      setNombre(
                        e.target.value
                      );
                      setMensajeGuardado("");
                    }}
                    style={styles.input}
                  />
                </Field>

                <Field label="Empresa">
                  <select
                    value={empresa}
                    onChange={(e) => {
                      setEmpresa(
                        e.target.value
                      );
                      setMensajeGuardado("");
                    }}
                    style={styles.input}
                  >
                    <option value="">
                      Seleccionar empresa...
                    </option>

                    {empresa &&
                      !EMPRESAS.includes(
                        empresa as any
                      ) && (
                        <option
                          value={empresa}
                        >
                          {empresa}
                        </option>
                      )}

                    {EMPRESAS.map(
                      (empresaItem) => (
                        <option
                          key={empresaItem}
                          value={empresaItem}
                        >
                          {empresaItem}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Correo electrónico">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(
                        e.target.value
                      );
                      setMensajeGuardado("");
                    }}
                    style={styles.input}
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    value={telefono}
                    onChange={(e) => {
                      setTelefono(
                        e.target.value
                      );
                      setMensajeGuardado("");
                    }}
                    style={styles.input}
                  />
                </Field>

                <p
                  style={styles.editHint}
                >
                  Estos datos pueden
                  corregirse si se detecta
                  alguna errata. Los
                  cambios se aplicarán al
                  pulsar Guardar cambios.
                </p>
              </div>
            </section>

            <section
              style={styles.card}
            >
              <div
                style={
                  styles.cardHeadingCompact
                }
              >
                <div
                  style={
                    styles.sectionIcon
                  }
                >
                  <TagIcon />
                </div>

                <div>
                  <h2
                    style={
                      styles.cardTitle
                    }
                  >
                    Tags
                  </h2>

                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    Clasificación de la
                    incidencia.
                  </p>
                </div>
              </div>

              {tagsTicket.length === 0 ? (
                <p style={styles.noTags}>
                  Sin tags asignados.
                </p>
              ) : (
                <div
                  style={
                    styles.tagsContainer
                  }
                >
                  {tagsTicket.map(
                    (tag) => (
                      <span
                        key={tag.id}
                        style={{
                          ...styles.tag,
                          borderColor:
                            tag.color,
                          color: tag.color,
                        }}
                      >
                        <span
                          style={{
                            ...styles.tagDot,
                            background:
                              tag.color,
                          }}
                        />

                        {tag.nombre}

                        {rol ===
                          "ADMIN" && (
                          <button
                            type="button"
                            onClick={() =>
                              quitarTag(
                                tag.id
                              )
                            }
                            style={
                              styles.removeTag
                            }
                          >
                            ×
                          </button>
                        )}
                      </span>
                    )
                  )}
                </div>
              )}

              {rol === "ADMIN" && (
                <>
                  <div
                    style={
                      styles.tagDivider
                    }
                  />

                  <label
                    style={
                      styles.fieldLabel
                    }
                  >
                    Añadir tag existente
                  </label>

                  <select
                    value=""
                    onChange={(e) =>
                      seleccionarTag(
                        e.target.value
                      )
                    }
                    style={styles.input}
                  >
                    <option value="">
                      Seleccionar tag...
                    </option>

                    {tags
                      .filter(
                        (tag) =>
                          !tagsTicket.some(
                            (asignado) =>
                              asignado.id ===
                              tag.id
                          )
                      )
                      .map((tag) => (
                        <option
                          key={tag.id}
                          value={tag.id}
                        >
                          {tag.nombre}
                        </option>
                      ))}
                  </select>

                  <div
                    style={
                      styles.newTagArea
                    }
                  >
                    <label
                      style={
                        styles.fieldLabel
                      }
                    >
                      Crear nuevo tag
                    </label>

                    <input
                      value={
                        nuevoTagNombre
                      }
                      onChange={(e) =>
                        setNuevoTagNombre(
                          e.target.value
                        )
                      }
                      placeholder="Ej. OUTLOOK"
                      style={styles.input}
                    />

                    <div
                      style={
                        styles.colorRow
                      }
                    >
                      <input
                        type="color"
                        value={
                          nuevoTagColor
                        }
                        onChange={(e) =>
                          setNuevoTagColor(
                            e.target.value
                          )
                        }
                        style={
                          styles.colorInput
                        }
                      />

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await crearTag();
                          } catch (
                            err: any
                          ) {
                            setError(
                              err?.message ??
                                "No se ha podido crear el tag."
                            );
                          }
                        }}
                        disabled={
                          !nuevoTagNombre.trim()
                        }
                        style={{
                          ...styles.createTagButton,
                          opacity:
                            nuevoTagNombre.trim()
                              ? 1
                              : 0.5,
                        }}
                      >
                        + Crear y añadir
                      </button>
                    </div>
                  </div>

                  <p
                    style={
                      styles.editHint
                    }
                  >
                    Los cambios de tags se
                    aplicarán al pulsar
                    Guardar cambios.
                  </p>
                </>
              )}
            </section>

            <section
              style={styles.infoCard}
            >
              <div
                style={styles.infoRow}
              >
                <span>Creado</span>

                <strong>
                  {formatearFecha(
                    ticket.creado_en
                  )}
                </strong>
              </div>

              <div
                style={styles.infoRow}
              >
                <span>
                  Última actualización
                </span>

                <strong>
                  {formatearFecha(
                    ticket.actualizado_en
                  )}
                </strong>
              </div>

              {ticket.resuelto_en && (
                <div
                  style={styles.infoRow}
                >
                  <span>Resuelto</span>

                  <strong>
                    {formatearFecha(
                      ticket.resuelto_en
                    )}
                  </strong>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {imagenAmpliada && (
        <div
          style={styles.imageModal}
          onClick={() =>
            setImagenAmpliada(null)
          }
        >
          <button
            type="button"
            onClick={() =>
              setImagenAmpliada(null)
            }
            style={styles.modalClose}
          >
            ×
          </button>

          <img
            src={imagenAmpliada}
            alt="Imagen adjunta"
            style={styles.modalImage}
            onClick={(e) =>
              e.stopPropagation()
            }
          />
        </div>
      )}
    </main>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function Header({
  email,
  rol,
  onLogout,
}: {
  email: string;
  rol: Rol | null;
  onLogout: () => void;
}) {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            <SupportIcon
              color="#ffffff"
            />
          </div>

          <div>
            <div
              style={styles.brandTitle}
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

        <div style={styles.headerActions}>
          <a
            href="https://globalcoffeeindustriassa.sharepoint.com/:f:/g/IgAX4zmqxaTCQ6GyOQ9lakgSAeFKPNoWDIPRPPApKvf1Vhs?e=lq5SPl"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.manualsLink}
          >
            <BookIcon />
            <span>Manuales</span>
            <ExternalIcon />
          </a>

          <div
            style={styles.headerDivider}
          />

          <div style={styles.userArea}>
            <div
              style={styles.userInfo}
            >
              <span
                style={styles.userEmail}
              >
                {email}
              </span>

              <span style={styles.role}>
                {rol === "ADMIN"
                  ? "ADMINISTRADOR"
                  : "USUARIO"}
              </span>
            </div>

            <button
              onClick={onLogout}
              style={styles.logout}
              title="Cerrar sesión"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={styles.fieldLabel}>
        {label}
      </label>

      {children}
    </div>
  );
}

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
        ...styles.badge,
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

  const current = config[estado];

  return (
    <span
      style={{
        ...styles.badge,
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

/* =========================================================
   COLORES
========================================================= */

function getEstadoStyle(
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

function getImportanciaStyle(
  importancia: Importancia
): React.CSSProperties {
  if (importancia === "BAJA") {
    return {
      background: "#eef8f5",
      borderColor: "#b9dfd5",
      color: "#438472",
    };
  }

  if (importancia === "MEDIA") {
    return {
      background: "#fff7e6",
      borderColor: "#ead49c",
      color: "#9b711d",
    };
  }

  if (importancia === "ALTA") {
    return {
      background: "#fff0e9",
      borderColor: "#efc2ab",
      color: "#b95829",
    };
  }

  return {
    background: "#fff0f0",
    borderColor: "#edb7b7",
    color: "#bd3e3e",
  };
}

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
  size = 24,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
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

function UserSmallIcon() {
  return (
    <svg
      width="15"
      height="15"
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
      <path d="M5 21a7 7 0 0 1 14 0" />
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

function ConversationIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 13 11 22l-9-9V4a2 2 0 0 1 2-2h9Z" />
      <circle
        cx="8.5"
        cy="8.5"
        r="1.5"
      />
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
    >
      <path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="15"
      height="15"
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

function SaveIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
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

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function LogoutIcon() {
  return (
    <svg
      width="19"
      height="19"
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f7",
    color: "#202626",
    fontFamily:
      "'Poppins', Arial, Helvetica, sans-serif",
  },

  loading: {
    minHeight: "100vh",
    background: "#f5f7f7",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    fontFamily:
      "'Poppins', Arial, Helvetica, sans-serif",
  },

  loadingIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    background: "#e6f7f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: "#697474",
  },

  header: {
    width: "100%",
    background: "#ffffff",
    borderBottom: "1px solid #e5eaea",
  },

  headerInner: {
    width: "100%",
    maxWidth: 1320,
    minHeight: 86,
    margin: "0 auto",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  brandTitle: {
    fontSize: 19,
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#1f2929",
  },

  brandSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.4,
    fontWeight: 400,
    color: "#7c8787",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 18,
  },

  manualsLink: {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 9,
    border: "1px solid #dce5e4",
    background: "#ffffff",
    color: "#566161",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    boxSizing: "border-box",
  },

  headerDivider: {
    width: 1,
    height: 34,
    background: "#e3e8e8",
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 3,
  },

  userEmail: {
    maxWidth: 260,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 500,
    color: "#3b4444",
  },

  role: {
    fontSize: 10,
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#00AF9A",
  },

  logout: {
    width: 42,
    height: 42,
    borderRadius: 10,
    border: "1px solid #dfe5e5",
    background: "#ffffff",
    color: "#5e6868",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  container: {
    width: "calc(100% - 56px)",
    maxWidth: 1260,
    margin: "0 auto",
    padding: "30px 0 76px",
    boxSizing: "border-box",
  },

  backButton: {
    border: 0,
    background: "transparent",
    color: "#687272",
    padding: 0,
    margin: "0 0 22px",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },

  ticketHeader: {
    minHeight: 112,
    padding: "22px 24px",
    marginBottom: 20,
    borderRadius: 14,
    border: "1px solid #e0e7e7",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
    boxSizing: "border-box",
  },

  ticketHeaderLeft: {
    minWidth: 0,
    flex: 1,
  },

  ticketNumber: {
    marginBottom: 7,
    fontSize: 10,
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: "0.09em",
    color: "#00AF9A",
  },

  pageTitle: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.3,
    fontWeight: 700,
    color: "#202828",
    wordBreak: "break-word",
  },

  headerMeta: {
    marginTop: 9,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#788282",
  },

  metaDot: {
    color: "#bcc4c4",
  },

  ticketHeaderRight: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    flexShrink: 0,
  },

  headerControl: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  controlLabel: {
    fontSize: 10,
    lineHeight: 1.3,
    fontWeight: 600,
    color: "#7a8585",
  },

  controlSelect: {
    minWidth: 135,
    height: 40,
    padding: "0 30px 0 11px",
    borderRadius: 9,
    border: "1px solid #dfe6e6",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },

  badge: {
    minWidth: 112,
    height: 40,
    padding: "0 12px",
    borderRadius: 9,
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    boxSizing: "border-box",
    fontSize: 11,
    fontWeight: 600,
  },

  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },

  errorMessage: {
    width: "100%",
    marginBottom: 20,
    padding: "13px 15px",
    border: "1px solid #efc1c1",
    borderRadius: 10,
    background: "#fff4f4",
    color: "#b94a4a",
    display: "flex",
    alignItems: "center",
    gap: 9,
    boxSizing: "border-box",
    fontSize: 12,
    lineHeight: 1.5,
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 340px",
    gap: 20,
    alignItems: "start",
  },

  mainColumn: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  sideColumn: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  card: {
    padding: 22,
    borderRadius: 14,
    border: "1px solid #e0e7e7",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  cardHeading: {
    marginBottom: 22,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  cardHeadingCompact: {
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: "#e8f8f5",
    color: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardTitle: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.35,
    fontWeight: 700,
    color: "#252d2d",
  },

  cardSubtitle: {
    margin: "4px 0 0",
    fontSize: 11,
    lineHeight: 1.45,
    color: "#879090",
  },

  readOnlyField: {
    marginBottom: 18,
  },

  fieldLabel: {
    display: "block",
    marginBottom: 7,
    fontSize: 11,
    lineHeight: 1.4,
    fontWeight: 600,
    color: "#5c6767",
  },

  readOnlyValue: {
    minHeight: 42,
    padding: "11px 13px",
    borderRadius: 9,
    border: "1px solid #e3e8e8",
    background: "#f8fafa",
    color: "#303939",
    fontSize: 12,
    lineHeight: 1.55,
    boxSizing: "border-box",
  },

  descriptionBox: {
    minHeight: 120,
    padding: "14px 15px",
    borderRadius: 9,
    border: "1px solid #e3e8e8",
    background: "#f8fafa",
    color: "#394242",
    fontSize: 12,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    boxSizing: "border-box",
  },

  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },

  input: {
    width: "100%",
    height: 42,
    padding: "0 11px",
    borderRadius: 9,
    border: "1px solid #dce4e4",
    background: "#ffffff",
    color: "#303939",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 11,
    boxSizing: "border-box",
  },

  editHint: {
    margin: "2px 0 0",
    fontSize: 10,
    lineHeight: 1.6,
    color: "#929b9b",
  },

  noFollowUps: {
    minHeight: 92,
    padding: "20px",
    borderRadius: 10,
    background: "#f8fafa",
    border: "1px dashed #dce4e4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#8b9494",
    fontSize: 11,
  },

  timeline: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    marginBottom: 24,
  },

  timelineItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },

  timelineAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  timelineAvatarIT: {
    background: "#00AF9A",
    color: "#ffffff",
  },

  timelineAvatarUser: {
    background: "#eef2f2",
    color: "#6d7777",
    border: "1px solid #dce3e3",
  },

  timelineContent: {
    flex: 1,
    minWidth: 0,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #e2e8e8",
    background: "#fafcfc",
  },

  timelineHeader: {
    marginBottom: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  timelineAuthor: {
    fontSize: 11,
    lineHeight: 1.4,
    color: "#384141",
  },

  timelineDate: {
    flexShrink: 0,
    fontSize: 9,
    lineHeight: 1.4,
    color: "#969f9f",
  },

  timelineMessage: {
    color: "#4a5454",
    fontSize: 11,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  followUpImages: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(115px, 1fr))",
    gap: 8,
  },

  followUpImageButton: {
    width: "100%",
    height: 100,
    padding: 0,
    border: "1px solid #dce4e4",
    borderRadius: 8,
    background: "#ffffff",
    overflow: "hidden",
    cursor: "pointer",
  },

  followUpImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },

  followUpComposer: {
    paddingTop: 22,
    borderTop: "1px solid #e7ebeb",
  },

  textarea: {
    width: "100%",
    minHeight: 115,
    resize: "vertical",
    padding: "12px 13px",
    borderRadius: 9,
    border: "1px solid #dce4e4",
    background: "#ffffff",
    color: "#303939",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 11,
    lineHeight: 1.6,
    boxSizing: "border-box",
  },

  previewGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(100px, 1fr))",
    gap: 9,
  },

  previewItem: {
    position: "relative",
    height: 90,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid #dce4e4",
    background: "#f5f7f7",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  removeImage: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 23,
    height: 23,
    padding: 0,
    border: 0,
    borderRadius: "50%",
    background: "rgba(31,39,39,.82)",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: 16,
    lineHeight: "23px",
    textAlign: "center",
    cursor: "pointer",
  },

  composerFooter: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  composerLeft: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },

  attachButton: {
    minHeight: 38,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #dce4e4",
    background: "#ffffff",
    color: "#596363",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    boxSizing: "border-box",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
  },

  composerHint: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#9aa2a2",
  },

  saveRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },

  savedMessage: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#16806c",
    fontSize: 10,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  saveButton: {
    minHeight: 42,
    padding: "0 16px",
    border: 0,
    borderRadius: 9,
    background: "#00AF9A",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 600,
    boxSizing: "border-box",
  },

  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
  },

  tag: {
    minHeight: 30,
    padding: "0 9px",
    borderRadius: 7,
    border: "1px solid",
    background: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    boxSizing: "border-box",
    fontSize: 9,
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: "0.02em",
  },

  tagDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },

  removeTag: {
    width: 17,
    height: 17,
    marginLeft: 2,
    padding: 0,
    border: 0,
    borderRadius: "50%",
    background: "transparent",
    color: "currentColor",
    fontFamily: "Arial, sans-serif",
    fontSize: 14,
    lineHeight: "17px",
    cursor: "pointer",
  },

  noTags: {
    margin: 0,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#909999",
  },

  tagDivider: {
    width: "100%",
    height: 1,
    margin: "18px 0",
    background: "#e8ecec",
  },

  newTagArea: {
    marginTop: 15,
  },

  colorRow: {
    marginTop: 9,
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  colorInput: {
    width: 42,
    height: 38,
    padding: 3,
    border: "1px solid #dce4e4",
    borderRadius: 8,
    background: "#ffffff",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  createTagButton: {
    flex: 1,
    minHeight: 38,
    padding: "0 11px",
    borderRadius: 8,
    border: "1px solid #cfe4e0",
    background: "#eff9f7",
    color: "#008c7b",
    fontFamily: "inherit",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
  },

  infoCard: {
    padding: "8px 18px",
    borderRadius: 14,
    border: "1px solid #e0e7e7",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  infoRow: {
    minHeight: 48,
    borderBottom: "1px solid #edf0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 10,
    lineHeight: 1.4,
    color: "#858e8e",
  },

  imageModal: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    padding: 35,
    background: "rgba(20,26,26,.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  modalImage: {
    maxWidth: "92vw",
    maxHeight: "88vh",
    objectFit: "contain",
    borderRadius: 8,
    boxShadow:
      "0 18px 60px rgba(0,0,0,.35)",
  },

  modalClose: {
    position: "fixed",
    top: 22,
    right: 26,
    width: 42,
    height: 42,
    padding: 0,
    border: "1px solid rgba(255,255,255,.25)",
    borderRadius: "50%",
    background: "rgba(255,255,255,.1)",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: 27,
    lineHeight: "40px",
    textAlign: "center",
    cursor: "pointer",
  },

  notFound: {
    minHeight: 340,
    padding: 30,
    borderRadius: 14,
    border: "1px solid #e0e7e7",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    boxSizing: "border-box",
  },

  notFoundIcon: {
    width: 58,
    height: 58,
    marginBottom: 15,
    borderRadius: 15,
    background: "#e8f8f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  notFoundTitle: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.4,
    fontWeight: 700,
    color: "#303838",
  },

  notFoundText: {
    maxWidth: 420,
    margin: "7px 0 0",
    fontSize: 11,
    lineHeight: 1.6,
    color: "#858e8e",
  },
};
