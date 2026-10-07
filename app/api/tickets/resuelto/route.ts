import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const {
      numero,
      ticketId,
      titulo,
      nombre,
      empresa,
      email,
    } = body;

    /*
     * VALIDACIÓN
     */

    if (
      !ticketId ||
      !titulo ||
      !nombre ||
      !empresa ||
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan datos obligatorios para enviar la notificación.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * URL DEL TICKET
     */

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://helpdesk.globalcoffeeindustries.com";

    const ticketUrl =
      `${baseUrl}/tickets/${ticketId}`;

    /*
     * ASUNTO
     */

    const subject = numero
      ? `Incidencia IT #${numero} resuelta · ${titulo}`
      : `Incidencia IT resuelta · ${titulo}`;

    /*
     * ENVÍO
     */

    const { data, error } =
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "IT Support <helpdesk@globalcoffeeindustries.com>",

        to: [email],

        subject,

        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />

  <title>
    Incidencia resuelta
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f7f7;
    font-family:'Poppins',Arial,Helvetica,sans-serif;
    color:#273030;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      background:#f4f7f7;
      margin:0;
      padding:0;
    "
  >
    <tr>
      <td
        align="center"
        style="
          padding:40px 20px;
        "
      >

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:620px;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
            border:1px solid #e1e8e7;
          "
        >

          <!-- CABECERA -->

          <tr>
            <td
              style="
                background:#00AF9A;
                padding:28px 32px;
              "
            >

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>

                  <td
                    width="52"
                    valign="middle"
                  >
                    <div
                      style="
                        width:44px;
                        height:44px;
                        border-radius:11px;
                        background:rgba(255,255,255,0.18);
                        text-align:center;
                        line-height:44px;
                        font-size:22px;
                        color:#ffffff;
                      "
                    >
                      ✓
                    </div>
                  </td>

                  <td
                    valign="middle"
                    style="
                      padding-left:12px;
                    "
                  >
                    <div
                      style="
                        font-size:19px;
                        line-height:1.3;
                        font-weight:700;
                        color:#ffffff;
                      "
                    >
                      IT Support
                    </div>

                    <div
                      style="
                        margin-top:3px;
                        font-size:11px;
                        line-height:1.4;
                        font-weight:400;
                        color:rgba(255,255,255,0.82);
                      "
                    >
                      Global Coffee Industries
                    </div>
                  </td>

                </tr>
              </table>

            </td>
          </tr>

          <!-- CONTENIDO -->

          <tr>
            <td
              style="
                padding:34px 34px 38px;
              "
            >

              <div
                style="
                  margin-bottom:12px;
                  font-size:10px;
                  line-height:1.4;
                  font-weight:700;
                  letter-spacing:1.2px;
                  color:#00AF9A;
                "
              >
                INCIDENCIA RESUELTA
              </div>

              <h1
                style="
                  margin:0 0 14px;
                  padding:0;
                  font-size:23px;
                  line-height:1.35;
                  font-weight:700;
                  color:#252d2d;
                "
              >
                Tu incidencia ha sido resuelta
              </h1>

              <p
                style="
                  margin:0 0 8px;
                  padding:0;
                  font-size:13px;
                  line-height:1.7;
                  font-weight:400;
                  color:#566161;
                "
              >
                Hola ${escapeHtml(nombre)},
              </p>

              <p
                style="
                  margin:0 0 26px;
                  padding:0;
                  font-size:13px;
                  line-height:1.7;
                  font-weight:400;
                  color:#566161;
                "
              >
                El equipo de Informática ha marcado
                tu incidencia como resuelta.
              </p>

              <!-- DATOS -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  margin-bottom:25px;
                  border-collapse:separate;
                  border-spacing:0;
                  background:#f8fafa;
                  border:1px solid #e3e9e8;
                  border-radius:11px;
                  overflow:hidden;
                "
              >

                ${
                  numero
                    ? filaDato(
                        "Ticket",
                        `#${numero}`
                      )
                    : ""
                }

                ${filaDato(
                  "Incidencia",
                  titulo
                )}

                ${filaDato(
                  "Solicitante",
                  nombre
                )}

                ${filaDato(
                  "Empresa",
                  empresa
                )}

                ${filaDato(
                  "Estado",
                  "Resuelto",
                  true
                )}

              </table>

              <p
                style="
                  margin:0 0 25px;
                  padding:0;
                  font-size:12px;
                  line-height:1.7;
                  font-weight:400;
                  color:#687272;
                "
              >
                Si el problema persiste o necesitas
                añadir alguna información adicional,
                puedes acceder a la incidencia y
                añadir un nuevo seguimiento.
              </p>

              <!-- BOTÓN -->

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  margin:0 0 30px;
                "
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#00AF9A"
                    style="
                      border-radius:9px;
                    "
                  >
                    <a
                      href="${ticketUrl}"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:13px 22px;
                        font-family:'Poppins',Arial,Helvetica,sans-serif;
                        font-size:12px;
                        line-height:1;
                        font-weight:600;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:9px;
                      "
                    >
                      Ver incidencia
                    </a>
                  </td>
                </tr>
              </table>

              <!-- PIE -->

              <div
                style="
                  padding-top:20px;
                  border-top:1px solid #e8ecec;
                "
              >
                <p
                  style="
                    margin:0;
                    padding:0;
                    font-size:10px;
                    line-height:1.6;
                    font-weight:400;
                    color:#929b9b;
                  "
                >
                  Este correo ha sido enviado
                  automáticamente por el sistema
                  de incidencias de IT de
                  Global Coffee Industries.
                </p>
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

    /*
     * ERROR DE RESEND
     */

    if (error) {
      console.error(
        "Error enviando correo de incidencia resuelta:",
        error
      );

      return NextResponse.json(
        {
          error:
            "No se ha podido enviar el correo.",
          detalle: error,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * OK
     */

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    console.error(
      "Error en /api/tickets/resuelto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno enviando la notificación.",
        detalle:
          error?.message ??
          "Error desconocido",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function escapeHtml(
  valor: string | number | null | undefined
) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function filaDato(
  etiqueta: string,
  valor: string | number,
  ultima = false
) {
  return `
    <tr>
      <td
        style="
          width:125px;
          padding:12px 14px;
          border-bottom:${
            ultima
              ? "0"
              : "1px solid #e6ebeb"
          };
          font-family:'Poppins',Arial,Helvetica,sans-serif;
          font-size:10px;
          line-height:1.5;
          font-weight:600;
          color:#889292;
          vertical-align:top;
        "
      >
        ${escapeHtml(etiqueta)}
      </td>

      <td
        style="
          padding:12px 14px;
          border-bottom:${
            ultima
              ? "0"
              : "1px solid #e6ebeb"
          };
          font-family:'Poppins',Arial,Helvetica,sans-serif;
          font-size:11px;
          line-height:1.5;
          font-weight:500;
          color:#354040;
          vertical-align:top;
        "
      >
        ${escapeHtml(valor)}
      </td>
    </tr>
  `;
}
