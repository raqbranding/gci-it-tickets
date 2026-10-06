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
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "42px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: "34px" }}>
          <div
            style={{
              color: "#00AF9A",
              fontSize: "34px",
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
          >
            GCI
          </div>

          <div
            style={{
              color: "#555",
              fontSize: "12px",
              letterSpacing: "1.5px",
              marginTop: "2px",
            }}
          >
            GLOBAL COFFEE INDUSTRIES
          </div>
        </div>

        <h1
          style={{
            fontSize: "26px",
            margin: "0 0 8px",
            color: "#222",
          }}
        >
          IT Tickets
        </h1>

        <p
          style={{
            color: "#777",
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
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #dfe4e4",
              borderRadius: "9px",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: "13px",
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
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #dfe4e4",
              borderRadius: "9px",
              fontSize: "14px",
              marginBottom: "18px",
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
              color: "#fff",
              borderRadius: "9px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "ACCEDIENDO..." : "INICIAR SESIÓN"}
          </button>
        </form>
      </div>
    </main>
  );
}
