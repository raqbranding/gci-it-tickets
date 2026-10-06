export const metadata = {
  title: "GCI IT Tickets",
  description: "Sistema de gestión de incidencias informáticas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
