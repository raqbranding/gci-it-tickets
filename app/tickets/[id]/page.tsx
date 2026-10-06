"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

type Tag = {
  id: string;
  nombre: string;
  color: string;
};

export default function TicketPage() {
  const router = useRouter();
  const params = useParams();

  const ticketId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviandoSeguimiento, setEnviandoSeguimiento] =
    useState(false);

  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [rol, setRol] = useState<Rol | null>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>(
    []
  );

  const [nuevoSeguimiento, setNuevoSeguimiento] = useState("");

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsTicket, setTagsTicket] = useState<Tag[]>([]);

  const [nuevoTagNombre, setNuevoTagNombre] = useState("");
  const [nuevoTagColor, setNuevoTagColor] = useState("#00AF9A");

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<
    "OK" | "ERROR" | ""
  >("");

  useEffect(() => {
    if (ticketId) {
      cargarPagina();
    }
  }, [ticketId]);

  async function cargarPagina() {
    setLoading(true);
    setMensaje("");
    setTipoMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: acceso, error: accesoError } = await supabase
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

    const rolUsuario = acceso.rol as Rol;

    setUserId(user.id);
    setUserEmail(user.email ?? "");
    setRol(rolUsuario);

    const { data: ticketData, error: ticketError } =
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
          creado_en,
          actualizado_en,
          resuelto_en,
          resuelto_por
        `
        )
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

    await Promise.all([
      cargarSeguimientos(),
      cargarTags(rolUsuario),
    ]);

    setLoading(false);
  }

  async function cargarSeguimientos() {
    const { data, error } = await supabase
      .from("it_seguimientos")
      .select(
        `
        id,
        ticket_id,
        creado_por,
        mensaje,
        creado_en
      `
      )
      .eq("ticket_id", ticketId)
      .order("creado_en", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error cargando seguimientos:",
        error
      );
      return;
    }

    setSeguimientos((data ?? []) as Seguimiento[]);
  }

  async function cargarTags(rolUsuario: Rol) {
    const { data: relaciones, error: relacionesError } =
      await supabase
        .from("it_ticket_tags")
        .select(
          `
          tag_id,
          it_tags (
            id,
            nombre,
            color
          )
        `
        )
        .eq("ticket_id", ticketId);

    if (!relacionesError && relaciones) {
      const asignados: Tag[] = [];

      relaciones.forEach((relacion: any) => {
        if (relacion.it_tags) {
          asignados.push({
            id: relacion.it_tags.id,
            nombre: relacion.it_tags.nombre,
            color: relacion.it_tags.color,
          });
        }
      });

      setTagsTicket(asignados);
    }

    if (rolUsuario === "ADMIN") {
      const { data: tagsData, error: tagsError } =
        await supabase
          .from("it_tags")
          .select("id, nombre, color")
          .order("nombre");

      if (tagsError) {
        console.error("Error cargando tags:", tagsError);
        return;
      }

      setTags((tagsData ?? []) as Tag[]);
    }
  }

  /* =========================================================
     DATOS DE CONTACTO
  ========================================================= */

  async function guardarDatosContacto() {
    if (!ticket) return;

    if (!nombre.trim() || !empresa.trim() || !email.trim()) {
      mostrarError(
        "Nombre, empresa y correo electrónico son obligatorios."
      );
      return;
    }

    setGuardando(true);
    limpiarMensaje();

    const { error } = await supabase
      .from("it_tickets")
      .update({
        nombre: nombre.trim(),
        empresa: empresa.trim(),
        email: email.trim(),
        telefono: telefono.trim() || null,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (error) {
      mostrarError(
        `No se han podido guardar los datos: ${error.message}`
      );

      setGuardando(false);
      return;
    }

    setTicket((actual) =>
      actual
        ? {
            ...actual,
            nombre: nombre.trim(),
            empresa: empresa.trim(),
            email: email.trim(),
            telefono: telefono.trim() || null,
          }
        : actual
    );

    mostrarOk("Datos de contacto actualizados.");
    setGuardando(false);
  }

  /* =========================================================
     ESTADO - SOLO ADMIN
  ========================================================= */

  async function cambiarEstado(nuevoEstado: Estado) {
    if (!ticket || rol !== "ADMIN") return;

    limpiarMensaje();

    const ahora = new Date().toISOString();

    const cambios =
      nuevoEstado === "RESUELTO"
        ? {
            estado: nuevoEstado,
            actualizado_en: ahora,
            resuelto_en: ahora,
            resuelto_por: userId,
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
      .eq("id", ticket.id);

    if (error) {
      mostrarError(
        `No se ha podido cambiar el estado: ${error.message}`
      );
      return;
    }

    setTicket({
      ...ticket,
      estado: nuevoEstado,
      actualizado_en: ahora,
      resuelto_en:
        nuevoEstado === "RESUELTO" ? ahora : null,
      resuelto_por:
        nuevoEstado === "RESUELTO" ? userId : null,
    });

    mostrarOk("Estado actualizado.");
  }

  /* =========================================================
     IMPORTANCIA - SOLO ADMIN
  ========================================================= */

  async function cambiarImportancia(
    nuevaImportancia: Importancia
  ) {
    if (!ticket || rol !== "ADMIN") return;

    limpiarMensaje();

    const ahora = new Date().toISOString();

    const { error } = await supabase
      .from("it_tickets")
      .update({
        importancia: nuevaImportancia,
        actualizado_en: ahora,
      })
      .eq("id", ticket.id);

    if (error) {
      mostrarError(
        `No se ha podido cambiar la importancia: ${error.message}`
      );
      return;
    }

    setTicket({
      ...ticket,
      importancia: nuevaImportancia,
      actualizado_en: ahora,
    });

    mostrarOk("Importancia actualizada.");
  }

  /* =========================================================
     SEGUIMIENTO
  ========================================================= */

  async function enviarSeguimiento() {
    if (!ticket || !nuevoSeguimiento.trim()) {
      return;
    }

    setEnviandoSeguimiento(true);
    limpiarMensaje();

    const { data, error } = await supabase
      .from("it_seguimientos")
      .insert({
        ticket_id: ticket.id,
        creado_por: userId,
        mensaje: nuevoSeguimiento.trim(),
      })
      .select(
        `
        id,
        ticket_id,
        creado_por,
        mensaje,
        creado_en
      `
      )
      .single();

    if (error) {
      mostrarError(
        `No se ha podido añadir el seguimiento: ${error.message}`
      );

      setEnviandoSeguimiento(false);
      return;
    }

    setSeguimientos((actuales) => [
      ...actuales,
      data as Seguimiento,
    ]);

    setNuevoSeguimiento("");
    setEnviandoSeguimiento(false);
  }

  /* =========================================================
     TAGS
  ========================================================= */

  async function asignarTag(tagId: string) {
    if (!ticket || rol !== "ADMIN" || !tagId) return;

    const yaExiste = tagsTicket.some(
      (tag) => tag.id === tagId
    );

    if (yaExiste) return;

    limpiarMensaje();

    const { error } = await supabase
      .from("it_ticket_tags")
      .insert({
        ticket_id: ticket.id,
        tag_id: tagId,
      });

    if (error) {
      mostrarError(
        `No se ha podido asignar el tag: ${error.message}`
      );
      return;
    }

    const tag = tags.find(
      (item) => item.id === tagId
    );

    if (tag) {
      setTagsTicket((actuales) => [
        ...actuales,
        tag,
      ]);
    }
  }

  async function quitarTag(tagId: string) {
    if (!ticket || rol !== "ADMIN") return;

    limpiarMensaje();

    const { error } = await supabase
      .from("it_ticket_tags")
      .delete()
      .eq("ticket_id", ticket.id)
      .eq("tag_id", tagId);

    if (error) {
      mostrarError(
        `No se ha podido quitar el tag: ${error.message}`
      );
      return;
    }

    setTagsTicket((actuales) =>
      actuales.filter(
        (tag) => tag.id !== tagId
      )
    );
  }

  async function crearTag() {
    if (
      rol !== "ADMIN" ||
      !nuevoTagNombre.trim()
    ) {
      return;
    }

    limpiarMensaje();

    const { data, error } = await supabase
      .from("it_tags")
      .insert({
        nombre: nuevoTagNombre
          .trim()
          .toUpperCase(),
        color: nuevoTagColor,
        creado_por: userId,
      })
      .select("id, nombre, color")
      .single();

    if (error) {
      mostrarError(
        error.code === "23505"
          ? "Ya existe un tag con ese nombre."
          : `No se ha podido crear el tag: ${error.message}`
      );

      return;
    }

    const nuevoTag = data as Tag;

    setTags((actuales) =>
      [...actuales, nuevoTag].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      )
    );

    setNuevoTagNombre("");
    setNuevoTagColor("#00AF9A");

    await asignarTag(nuevoTag.id);
  }

  /* =========================================================
     MENSAJES
  ========================================================= */

  function limpiarMensaje() {
    setMensaje("");
    setTipoMensaje("");
  }

  function mostrarOk(texto: string) {
    setMensaje(texto);
    setTipoMensaje("OK");
  }

  function mostrarError(texto: string) {
    setMensaje(texto);
    setTipoMensaje("ERROR");
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main style={styles.loading}>
        <div style={styles.loader} />

        <p style={styles.loadingText}>
          Cargando ticket...
        </p>
      </main>
    );
  }

  /* =========================================================
     NO ENCONTRADO
  ========================================================= */

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
            onClick={() => router.push("/")}
            style={styles.backButton}
          >
            <ArrowLeftIcon />
            Volver
          </button>

          <div style={styles.notFound}>
            <div style={styles.notFoundIcon}>
              <TicketIcon />
            </div>

            <h1 style={styles.notFoundTitle}>
              Ticket no disponible
            </h1>

            <p style={styles.notFoundText}>
              El ticket no existe o no tienes permiso
              para consultarlo.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     PÁGINA
  ========================================================= */

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
          onClick={() => router.push("/")}
          style={styles.backButton}
        >
          <ArrowLeftIcon />
          Volver a tickets
        </button>

        {/* ===================================================
            CABECERA DEL TICKET
        =================================================== */}

        <section style={styles.ticketHeader}>
          <div style={styles.ticketHeaderLeft}>
            <div style={styles.ticketNumber}>
              {ticket.numero
                ? `TICKET #${ticket.numero}`
                : "TICKET"}
            </div>

            <h1 style={styles.pageTitle}>
              {ticket.titulo}
            </h1>

            <div style={styles.headerMeta}>
              <span>
                Creado {formatearFecha(ticket.creado_en)}
              </span>

              <span style={styles.metaDot}>•</span>

              <span>{ticket.nombre}</span>

              <span style={styles.metaDot}>•</span>

              <span>{ticket.empresa}</span>
            </div>
          </div>

          <div style={styles.ticketHeaderRight}>
            <div style={styles.headerControl}>
              <span style={styles.controlLabel}>
                Importancia
              </span>

              {rol === "ADMIN" ? (
                <select
                  value={ticket.importancia}
                  onChange={(e) =>
                    cambiarImportancia(
                      e.target.value as Importancia
                    )
                  }
                  style={{
                    ...styles.controlSelect,
                    ...getImportanciaStyle(
                      ticket.importancia
                    ),
                  }}
                >
                  <option value="BAJA">● Baja</option>
                  <option value="MEDIA">● Media</option>
                  <option value="ALTA">● Alta</option>
                  <option value="URGENTE">● Urgente</option>
                </select>
              ) : (
                <PriorityBadge
                  importancia={ticket.importancia}
                />
              )}
            </div>

            <div style={styles.headerControl}>
              <span style={styles.controlLabel}>
                Estado
              </span>

              {rol === "ADMIN" ? (
                <select
                  value={ticket.estado}
                  onChange={(e) =>
                    cambiarEstado(
                      e.target.value as Estado
                    )
                  }
                  style={{
                    ...styles.controlSelect,
                    ...getEstadoStyle(ticket.estado),
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
                <StatusBadge estado={ticket.estado} />
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            MENSAJES
        =================================================== */}

        {mensaje && (
          <div
            style={{
              ...styles.message,
              ...(tipoMensaje === "OK"
                ? styles.successMessage
                : styles.errorMessage),
            }}
          >
            {tipoMensaje === "OK" ? (
              <CheckIcon />
            ) : (
              <AlertIcon />
            )}

            <span>{mensaje}</span>
          </div>
        )}

        <div style={styles.layout}>
          {/* =================================================
              COLUMNA PRINCIPAL
          ================================================= */}

          <div style={styles.mainColumn}>
            {/* INCIDENCIA */}

            <section style={styles.card}>
              <div style={styles.cardHeading}>
                <div style={styles.sectionIcon}>
                  <IncidentIcon />
                </div>

                <div>
                  <h2 style={styles.cardTitle}>
                    Incidencia
                  </h2>

                  <p style={styles.cardSubtitle}>
                    Información original enviada al crear
                    el ticket.
                  </p>
                </div>
              </div>

              <div style={styles.readOnlyField}>
                <span style={styles.fieldLabel}>
                  Título
                </span>

                <div style={styles.readOnlyValue}>
                  {ticket.titulo}
                </div>
              </div>

              <div style={styles.readOnlyField}>
                <span style={styles.fieldLabel}>
                  Descripción
                </span>

                <div style={styles.descriptionBox}>
                  {ticket.descripcion}
                </div>
              </div>
            </section>

            {/* SEGUIMIENTO */}

            <section style={styles.card}>
              <div style={styles.cardHeading}>
                <div style={styles.sectionIcon}>
                  <ConversationIcon />
                </div>

                <div>
                  <h2 style={styles.cardTitle}>
                    Seguimiento
                  </h2>

                  <p style={styles.cardSubtitle}>
                    Historial de comunicaciones sobre
                    esta incidencia.
                  </p>
                </div>
              </div>

              {seguimientos.length === 0 ? (
                <div style={styles.noFollowUps}>
                  Todavía no hay notas de seguimiento.
                </div>
              ) : (
                <div style={styles.timeline}>
                  {seguimientos.map((seguimiento) => {
                    const esMio =
                      seguimiento.creado_por === userId;

                    const esAdmin =
                      rol === "USUARIO"
                        ? !esMio
                        : seguimiento.creado_por !==
                          ticket.creado_por;

                    return (
                      <div
                        key={seguimiento.id}
                        style={styles.timelineItem}
                      >
                        <div
                          style={{
                            ...styles.timelineAvatar,
                            background: esAdmin
                              ? "#00AF9A"
                              : "#eef2f2",
                            color: esAdmin
                              ? "#ffffff"
                              : "#5e6666",
                          }}
                        >
                          {esAdmin ? "IT" : "U"}
                        </div>

                        <div style={styles.timelineContent}>
                          <div style={styles.timelineHeader}>
                            <strong
                              style={styles.timelineAuthor}
                            >
                              {esAdmin
                                ? "Informática"
                                : seguimiento.creado_por ===
                                  userId
                                ? "Tú"
                                : ticket.nombre}
                            </strong>

                            <span
                              style={styles.timelineDate}
                            >
                              {formatearFecha(
                                seguimiento.creado_en
                              )}
                            </span>
                          </div>

                          <div style={styles.timelineMessage}>
                            {seguimiento.mensaje}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={styles.followUpComposer}>
                <label style={styles.fieldLabel}>
                  Añadir seguimiento
                </label>

                <textarea
                  value={nuevoSeguimiento}
                  onChange={(e) =>
                    setNuevoSeguimiento(e.target.value)
                  }
                  placeholder={
                    rol === "ADMIN"
                      ? "Escribe una nota o respuesta para el usuario..."
                      : "Añade información o responde a Informática..."
                  }
                  style={styles.textarea}
                />

                <div style={styles.composerFooter}>
                  <span style={styles.composerHint}>
                    La nota quedará registrada en el
                    historial del ticket.
                  </span>

                  <button
                    type="button"
                    onClick={enviarSeguimiento}
                    disabled={
                      enviandoSeguimiento ||
                      !nuevoSeguimiento.trim()
                    }
                    style={{
                      ...styles.sendButton,
                      opacity:
                        enviandoSeguimiento ||
                        !nuevoSeguimiento.trim()
                          ? 0.55
                          : 1,
                    }}
                  >
                    <SendIcon />

                    {enviandoSeguimiento
                      ? "Enviando..."
                      : "Añadir seguimiento"}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              COLUMNA LATERAL
          ================================================= */}

          <aside style={styles.sideColumn}>
            {/* CONTACTO */}

            <section style={styles.card}>
              <div style={styles.cardHeadingCompact}>
                <div style={styles.sectionIcon}>
                  <UserIcon />
                </div>

                <div>
                  <h2 style={styles.cardTitle}>
                    Datos de contacto
                  </h2>

                  <p style={styles.cardSubtitle}>
                    Información del solicitante.
                  </p>
                </div>
              </div>

              <div style={styles.formStack}>
                <Field label="Nombre">
                  <input
                    value={nombre}
                    onChange={(e) =>
                      setNombre(e.target.value)
                    }
                    disabled={rol === "ADMIN"}
                    style={{
                      ...styles.input,
                      ...(rol === "ADMIN"
                        ? styles.disabledInput
                        : {}),
                    }}
                  />
                </Field>

                <Field label="Empresa">
                  <input
                    value={empresa}
                    onChange={(e) =>
                      setEmpresa(e.target.value)
                    }
                    disabled={rol === "ADMIN"}
                    style={{
                      ...styles.input,
                      ...(rol === "ADMIN"
                        ? styles.disabledInput
                        : {}),
                    }}
                  />
                </Field>

                <Field label="Correo electrónico">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    disabled={rol === "ADMIN"}
                    style={{
                      ...styles.input,
                      ...(rol === "ADMIN"
                        ? styles.disabledInput
                        : {}),
                    }}
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(e.target.value)
                    }
                    disabled={rol === "ADMIN"}
                    style={{
                      ...styles.input,
                      ...(rol === "ADMIN"
                        ? styles.disabledInput
                        : {}),
                    }}
                  />
                </Field>

                {rol === "USUARIO" && (
                  <button
                    type="button"
                    onClick={guardarDatosContacto}
                    disabled={guardando}
                    style={{
                      ...styles.saveButton,
                      opacity: guardando ? 0.6 : 1,
                    }}
                  >
                    {guardando
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>
                )}
              </div>
            </section>

            {/* TAGS */}

            <section style={styles.card}>
              <div style={styles.cardHeadingCompact}>
                <div style={styles.sectionIcon}>
                  <TagIcon />
                </div>

                <div>
                  <h2 style={styles.cardTitle}>Tags</h2>

                  <p style={styles.cardSubtitle}>
                    Clasificación de la incidencia.
                  </p>
                </div>
              </div>

              {tagsTicket.length === 0 ? (
                <p style={styles.noTags}>
                  Sin tags asignados.
                </p>
              ) : (
                <div style={styles.tagsContainer}>
                  {tagsTicket.map((tag) => (
                    <span
                      key={tag.id}
                      style={{
                        ...styles.tag,
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                    >
                      <span
                        style={{
                          ...styles.tagDot,
                          background: tag.color,
                        }}
                      />

                      {tag.nombre}

                      {rol === "ADMIN" && (
                        <button
                          type="button"
                          onClick={() =>
                            quitarTag(tag.id)
                          }
                          style={styles.removeTag}
                          title="Quitar tag"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {rol === "ADMIN" && (
                <>
                  <div style={styles.tagDivider} />

                  <label style={styles.fieldLabel}>
                    Añadir tag existente
                  </label>

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        asignarTag(e.target.value);
                        e.target.value = "";
                      }
                    }}
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
                              asignado.id === tag.id
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

                  <div style={styles.newTagArea}>
                    <label style={styles.fieldLabel}>
                      Crear nuevo tag
                    </label>

                    <input
                      value={nuevoTagNombre}
                      onChange={(e) =>
                        setNuevoTagNombre(e.target.value)
                      }
                      placeholder="Ej. OUTLOOK"
                      style={styles.input}
                    />

                    <div style={styles.colorRow}>
                      <input
                        type="color"
                        value={nuevoTagColor}
                        onChange={(e) =>
                          setNuevoTagColor(e.target.value)
                        }
                        style={styles.colorInput}
                      />

                      <button
                        type="button"
                        onClick={crearTag}
                        disabled={!nuevoTagNombre.trim()}
                        style={{
                          ...styles.createTagButton,
                          opacity: nuevoTagNombre.trim()
                            ? 1
                            : 0.55,
                        }}
                      >
                        + Crear y añadir
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* INFORMACIÓN */}

            <section style={styles.infoCard}>
              <div style={styles.infoRow}>
                <span>Creado</span>

                <strong>
                  {formatearFecha(ticket.creado_en)}
                </strong>
              </div>

              <div style={styles.infoRow}>
                <span>Última actualización</span>

                <strong>
                  {formatearFecha(ticket.actualizado_en)}
                </strong>
              </div>

              {ticket.resuelto_en && (
                <div style={styles.infoRow}>
                  <span>Resuelto</span>

                  <strong>
                    {formatearFecha(ticket.resuelto_en)}
                  </strong>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
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
            <SupportIcon />
          </div>

          <div>
            <div style={styles.brandTitle}>
              IT Support
            </div>

            <div style={styles.brandSubtitle}>
              Gestión de incidencias informáticas
            </div>
          </div>
        </div>

        <div style={styles.userArea}>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>
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

  const current = config[importancia];

  return (
    <span
      style={{
        ...styles.badge,
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

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IncidentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function ConversationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 13 11 22l-9-9V4a2 2 0 0 1 2-2h9Z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#00AF9A" strokeWidth="1.8">
      <path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

  loadingText: {
    margin: 0,
    color: "#7b8282",
    fontSize: "12px",
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
  },

  brandTitle: {
    fontSize: "17px",
    fontWeight: 700,
  },

  brandSubtitle: {
    marginTop: "3px",
    color: "#8a9191",
    fontSize: "11px",
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
    fontSize: "12px",
    fontWeight: 500,
  },

  role: {
    color: "#00AF9A",
    fontSize: "10px",
    fontWeight: 700,
  },

  logout: {
    width: "38px",
    height: "38px",
    border: "1px solid #dfe4e4",
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
    padding: "32px 0 70px",
  },

  backButton: {
    padding: 0,
    marginBottom: "23px",
    border: "none",
    background: "transparent",
    color: "#677070",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    cursor: "pointer",
  },

  ticketHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "30px",
    marginBottom: "24px",
  },

  ticketHeaderLeft: {
    minWidth: 0,
  },

  ticketNumber: {
    color: "#00A992",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.6px",
    marginBottom: "5px",
  },

  pageTitle: {
    margin: "0 0 8px",
    fontSize: "26px",
    fontWeight: 700,
  },

  headerMeta: {
    color: "#858d8d",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "7px",
    fontSize: "10px",
  },

  metaDot: {
    color: "#c4caca",
  },

  ticketHeaderRight: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
  },

  headerControl: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  controlLabel: {
    color: "#8e9696",
    fontSize: "9px",
  },

  controlSelect: {
    minWidth: "125px",
    height: "36px",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 10px",
    outline: "none",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.8fr) minmax(300px, 0.8fr)",
    gap: "20px",
    alignItems: "start",
  },

  mainColumn: {
    minWidth: 0,
  },

  sideColumn: {
    minWidth: 0,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e9e9",
    borderRadius: "14px",
    padding: "23px",
    marginBottom: "20px",
  },

  cardHeading: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "18px",
    marginBottom: "20px",
    borderBottom: "1px solid #edf0f0",
  },

  cardHeadingCompact: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    paddingBottom: "17px",
    marginBottom: "18px",
    borderBottom: "1px solid #edf0f0",
  },

  sectionIcon: {
    width: "40px",
    height: "40px",
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
    fontSize: "14px",
    fontWeight: 700,
  },

  cardSubtitle: {
    margin: 0,
    color: "#8a9191",
    fontSize: "10px",
  },

  readOnlyField: {
    marginBottom: "20px",
  },

  fieldLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#444a4a",
    fontSize: "10px",
    fontWeight: 600,
  },

  readOnlyValue: {
    color: "#303535",
    fontSize: "13px",
    fontWeight: 500,
  },

  descriptionBox: {
    background: "#f8fafa",
    border: "1px solid #edf0f0",
    borderRadius: "9px",
    padding: "15px",
    color: "#4f5656",
    fontSize: "12px",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },

  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  input: {
    width: "100%",
    height: "40px",
    boxSizing: "border-box",
    border: "1px solid #d9dede",
    borderRadius: "8px",
    padding: "0 11px",
    background: "#ffffff",
    color: "#303535",
    outlineColor: "#00AF9A",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
  },

  disabledInput: {
    background: "#f7f9f9",
    color: "#717979",
    cursor: "default",
  },

  saveButton: {
    height: "40px",
    border: "none",
    borderRadius: "8px",
    background: "#00AF9A",
    color: "#ffffff",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
  },

  badge: {
    minWidth: "105px",
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

  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  noFollowUps: {
    padding: "25px 0 30px",
    color: "#929999",
    fontSize: "11px",
    textAlign: "center",
  },

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginBottom: "25px",
  },

  timelineItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
  },

  timelineAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: 700,
    flexShrink: 0,
  },

  timelineContent: {
    flex: 1,
    minWidth: 0,
  },

  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "5px",
  },

  timelineAuthor: {
    fontSize: "10px",
  },

  timelineDate: {
    color: "#9aa1a1",
    fontSize: "9px",
  },

  timelineMessage: {
    background: "#f7f9f9",
    borderRadius: "8px",
    padding: "11px 13px",
    color: "#4d5454",
    fontSize: "11px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },

  followUpComposer: {
    paddingTop: "20px",
    borderTop: "1px solid #edf0f0",
  },

  textarea: {
    width: "100%",
    minHeight: "105px",
    resize: "vertical",
    boxSizing: "border-box",
    border: "1px solid #d9dede",
    borderRadius: "8px",
    padding: "12px",
    outlineColor: "#00AF9A",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  composerFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginTop: "10px",
  },

  composerHint: {
    color: "#969d9d",
    fontSize: "9px",
  },

  sendButton: {
    height: "38px",
    padding: "0 14px",
    border: "none",
    borderRadius: "8px",
    background: "#00AF9A",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
  },

  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
  },

  tag: {
    minHeight: "28px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "20px",
    padding: "0 9px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "9px",
    fontWeight: 600,
  },

  tagDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  removeTag: {
    padding: 0,
    marginLeft: "2px",
    border: "none",
    background: "transparent",
    color: "currentColor",
    fontSize: "14px",
    cursor: "pointer",
  },

  noTags: {
    margin: 0,
    color: "#929999",
    fontSize: "10px",
  },

  tagDivider: {
    height: "1px",
    background: "#edf0f0",
    margin: "18px 0",
  },

  newTagArea: {
    marginTop: "18px",
  },

  colorRow: {
    display: "grid",
    gridTemplateColumns: "46px 1fr",
    gap: "8px",
    marginTop: "8px",
  },

  colorInput: {
    width: "46px",
    height: "38px",
    padding: "3px",
    border: "1px solid #d9dede",
    borderRadius: "8px",
    background: "#ffffff",
    cursor: "pointer",
  },

  createTagButton: {
    height: "38px",
    border: "1px solid #00AF9A",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#008f7e",
    fontFamily: "'Poppins', Arial, sans-serif",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #e5e9e9",
    borderRadius: "14px",
    padding: "18px 20px",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "9px 0",
    borderBottom: "1px solid #f0f2f2",
    color: "#858d8d",
    fontSize: "9px",
  },

  message: {
    borderRadius: "9px",
    padding: "11px 14px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "10px",
  },

  successMessage: {
    background: "#eaf8f4",
    border: "1px solid #c9ebe2",
    color: "#087965",
  },

  errorMessage: {
    background: "#fff1f1",
    border: "1px solid #f0cece",
    color: "#a63d3d",
  },

  notFound: {
    minHeight: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  notFoundIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "14px",
    background: "#ecf9f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "15px",
  },

  notFoundTitle: {
    margin: "0 0 7px",
    fontSize: "17px",
  },

  notFoundText: {
    margin: 0,
    color: "#8a9191",
    fontSize: "11px",
  },
};
