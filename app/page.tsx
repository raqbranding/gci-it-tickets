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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo electrónico o contraseña incorrectos.");
      setLoading(false);
      return;
    }

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
        {/* ICONO SUPPORT */}
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
            fontSize: "26px",
            fontWeight: 700,
            margin: "0 0 7px",
            color: "#202424",
          }}
        >
          IT Support
        </h1>

        <p
          style={{
            color: "#7b8282",
            margin: "0 0 30px",
            fontSize: "14px",
          }}
        >
          Accede al sistema de incidencias informáticas
        </p>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: "13px",
              color: "#343838",
              marginBottom: "8px",
            }}
          >
            Correo electrónico
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nombre@empresa.com"
            autoComplete="email"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #dfe4e4",
              borderRadius: "9px",
              fontSize: "14px",
              marginBottom: "20px",
              outlineColor: "#00AF9A",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: "13px",
              color: "#343838",
              marginBottom: "8px",
            }}
          >
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #dfe4e4",
              borderRadius: "9px",
              fontSize: "14px",
              marginBottom: "18px",
              outlineColor: "#00AF9A",
            }}
          />

          {error && (
            <div
              style={{
                background: "#fff2f2",
                color: "#b42318",
                padding: "11px 13px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "18px",
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
              border: "none",
              background: "#00AF9A",
              color: "#ffffff",
              borderRadius: "9px",
              padding: "14px",
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
