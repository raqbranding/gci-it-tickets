"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    // 1. LOGIN
    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setError("ERROR LOGIN: " + loginError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("ERROR: Supabase no ha devuelto ningún usuario.");
      setLoading(false);
      return;
    }

    // 2. COMPROBAR ACCESO A IT TICKETS
    const { data: acceso, error: accesoError } = await supabase
      .from("it_usuarios")
      .select("user_id, rol, activo")
      .eq("user_id", data.user.id)
      .maybeSingle();

    // Mostrar temporalmente el error REAL
    if (accesoError) {
      setError(
        "ERROR ACCESO: " +
          accesoError.message +
          " | Código: " +
          accesoError.code
      );

      setLoading(false);
      return;
    }

    if (!acceso) {
      setError(
        "ERROR: Login correcto, pero Supabase no encuentra este UID en it_usuarios. UID: " +
          data.user.id
      );

      setLoading(false);
      return;
    }

    if (!acceso.activo) {
      setError("ERROR: El usuario existe en it_usuarios pero está inactivo.");
      setLoading(false);
      return;
    }

    // 3. TODO CORRECTO
    router.push("/");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Poppins', Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "42px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.07)",
        }}
      >
        <div
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "16px",
            background: "#00AF9A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
          }}
        >
          <svg
            width="31"
            height="31"
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
        </div>

        <h1
          style={{
            margin: "0 0 7px",
            fontFamily: "'Poppins', Arial, sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            color: "#202424",
          }}
        >
          IT Support
        </h1>

        <p
          style={{
            margin: "0 0 30px",
            fontFamily: "'Poppins', Arial, sans-serif",
            color: "#7b8282",
            fontSize: "14px",
          }}
        >
          Accede al sistema de incidencias informáticas
        </p>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontFamily: "'Poppins', Arial, sans-serif",
              color: "#343838",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Correo electrónico
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="nombre@empresa.com"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: "20px",
              border: "1px solid #dfe4e4",
              borderRadius: "9px",
              outlineColor: "#00AF9A",
              fontFamily: "'Poppins', Arial, sans-serif",
              fontSize: "14px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontFamily: "'Poppins', Arial, sans-serif",
              color: "#343838",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: "18px",
              border: "1px solid #dfe4e4",
              borderRadius: "9px",
              outlineColor: "#00AF9A",
              fontFamily: "'Poppins', Arial, sans-serif",
              fontSize: "14px",
            }}
          />

          {error && (
            <div
              style={{
                marginBottom: "18px",
                padding: "12px 14px",
                background: "#fff2f2",
                color: "#b42318",
                borderRadius: "8px",
                fontFamily: "'Poppins', Arial, sans-serif",
                fontSize: "12px",
                lineHeight: "1.5",
                wordBreak: "break-word",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "9px",
              background: "#00AF9A",
              color: "#ffffff",
              fontFamily: "'Poppins', Arial, sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "ACCEDIENDO..." : "INICIAR SESIÓN"}
          </button>
        </form>
      </div>
    </main>
  );
}
