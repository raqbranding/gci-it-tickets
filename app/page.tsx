export default function Home() {
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
          maxWidth: "600px",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "42px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.07)",
          textAlign: "center",
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
            margin: "0 auto 24px",
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
            margin: "0 0 8px",
            fontSize: "28px",
            fontWeight: 700,
            color: "#202424",
          }}
        >
          IT Support
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#7b8282",
          }}
        >
          Sistema de gestión de incidencias informáticas
        </p>
      </div>
    </main>
  );
}
