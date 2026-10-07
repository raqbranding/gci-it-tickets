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
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://helpdesk.globalcoffeeindustries.com";

    const ticketUrl =
      `${baseUrl}/tickets/${ticketId}`;

    const asunto = numero
      ? `Estamos gestionando tu incidencia IT #${numero} · ${titulo}`
      : `Estamos gestionando tu incidencia IT · ${titulo}`;

    const { data, error } =
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "IT Support <onboarding@resend.dev>",

        to: [email],

        subject: asunto,

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
            </head>

            <body
              style="
                margin:0;
                padding:0;
                background:#f5f7f7;
                font-family:'Poppins',Arial,Helvetica,sans-serif;
                color:#252a2a;
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background:#f5f7f7;
                  padding:40px 15px;
                  font-family:'Poppins',Arial,Helvetica,sans-serif;
                "
              >
                <tr>
                  <td align="center">

                    <table
                      width="600"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="
                        width:100%;
                        max-width:600px;
                        background:#ffffff;
                        border-radius:14px;
                        overflow:hidden;
                        border:1px solid #e5e9e9;
                        font-family:'Poppins',Arial,Helvetica,sans-serif;
                      "
                    >

                      <!-- CABECERA -->

                      <tr>
                        <td
                          style="
                            background:#00AF9A;
                            padding:24px 30px;
                          "
                        >
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                          >
                            <tr>
                              <td
                                style="
                                  width:42px;
                                  height:42px;
                                  background:#ffffff;
                                  border-radius:10px;
                                  text-align:center;
                                  vertical-align:middle;
                                  color:#00AF9A;
                                  font-family:'Poppins',Arial,Helvetica,sans-serif;
                                  font-size:20px;
                                  font-weight:700;
                                "
                              >
                                IT
                              </td>

                              <td
                                style="
                                  padding-left:13px;
                                "
                              >
                                <div
                                  style="
                                    color:#ffffff;
                                    font-family:'Poppins',Arial,Helvetica,sans-serif;
                                    font-size:18px;
                                    font-weight:700;
                                  "
                                >
                                  IT Support
                                </div>

                                <div
                                  style="
                                    color:#d9fffa;
                                    font-family:'Poppins',Arial,Helvetica,sans-serif;
                                    font-size:11px;
                                    margin-top:3px;
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
                            padding:32px 30px;
                          "
                        >

                          <div
                            style="
                              color:#00A992;
                              font-family:'Poppins',Arial,Helvetica,sans-serif;
                              font-size:11px;
                              font-weight:700;
                              text-transform:uppercase;
                              letter-spacing:.5px;
                              margin-bottom:8px;
                            "
                          >
                            INCIDENCIA EN GESTIÓN
                          </div>

                          <h1
                            style="
                              margin:0 0 10px;
                              color:#202424;
                              font-family:'Poppins',Arial,Helvetica,sans-serif;
                              font-size:22px;
                              line-height:1.35;
                              font-weight:700;
                            "
                          >
                            ${escapeHtml(titulo)}
                          </h1>

                          <p
                            style="
                              margin:0 0 25px;
                              color:#7c8585;
                              font-family:'Poppins',Arial,Helvetica,sans-serif;
                              font-size:13px;
                              line-height:1.6;
                            "
                          >
                            Hola ${escapeHtml(nombre)}, el equipo de
                            Informática ha comenzado a gestionar tu
                            incidencia.
                          </p>

                          <!-- DATOS -->

                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                              background:#f7f9f9;
                              border-radius:10px;
                              margin-bottom:24px;
                              font-family:'Poppins',Arial,Helvetica,sans-serif;
                            "
                          >
                            <tr>
                              <td
                                style="
                                  padding:18px 20px;
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
                                  "Solicitante",
                                  nombre
                                )}

                                ${filaDato(
                                  "Empresa",
                                  empresa
                                )}

                                ${filaDato(
                                  "Estado",
                                  "En gestión"
                                )}

                              </td>
                            </tr>
                          </table>

                          <p
                            style="
                              margin:0;
                              color:#555d5d;
                              font-family:'Poppins',Arial,Helvetica,sans-serif;
                              font-size:13px;
                              line-height:1.7;
                            "
                          >
                            Te avisaremos si necesitamos información
                            adicional o cuando haya novedades sobre
                            la incidencia.
                          </p>

                          <!-- BOTÓN -->

                          <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                              margin-top:28px;
                            "
                          >
                            <tr>
                              <td align="left">

                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  border="0"
                                >
                                  <tr>
                                    <td
                                      bgcolor="#00AF9A"
                                      style="
                                        background:#00AF9A;
                                        border-radius:8px;
                                        text-align:center;
                                      "
                                    >
                                      <a
                                        href="${ticketUrl}"
                                        target="_blank"
                                        style="
                                          display:inline-block;
                                          padding:13px 22px;
                                          color:#ffffff;
                                          text-decoration:none;
                                          font-family:'Poppins',Arial,Helvetica,sans-serif;
                                          font-size:12px;
                                          line-height:16px;
                                          font-weight:600;
                                          white-space:nowrap;
                                        "
                                      >
                                        Ver incidencia
                                      </a>
                                    </td>
                                  </tr>
                                </table>

                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>

                      <!-- FOOTER -->

                      <tr>
                        <td
                          style="
                            padding:18px 30px;
                            background:#f8fafa;
                            border-top:1px solid #edf0f0;
                            color:#929999;
                            font-family:'Poppins',Arial,Helvetica,sans-serif;
                            font-size:10px;
                            line-height:1.5;
                          "
                        >
                          Este correo ha sido generado
                          automáticamente por IT Support de
                          Global Coffee Industries.
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

    if (error) {
      console.error(
        "Error Resend incidencia en gestión:",
        error
      );

      return NextResponse.json(
        {
          error:
            "No se ha podido enviar el correo.",
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error(
      "Error enviando notificación de incidencia en gestión:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno enviando la notificación.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(
  value: unknown
) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function filaDato(
  etiqueta: string,
  valor: unknown
) {
  return `
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        border-bottom:1px solid #e8ecec;
        font-family:'Poppins',Arial,Helvetica,sans-serif;
      "
    >
      <tr>
        <td
          style="
            padding:9px 0;
            width:130px;
            color:#8a9292;
            font-family:'Poppins',Arial,Helvetica,sans-serif;
            font-size:11px;
            vertical-align:top;
          "
        >
          ${escapeHtml(etiqueta)}
        </td>

        <td
          style="
            padding:9px 0;
            color:#303535;
            font-family:'Poppins',Arial,Helvetica,sans-serif;
            font-size:11px;
            font-weight:600;
            vertical-align:top;
          "
        >
          ${escapeHtml(valor)}
        </td>
      </tr>
    </table>
  `;
}
