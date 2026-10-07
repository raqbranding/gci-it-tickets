
  loading: {
    minHeight: "100vh",
    background: "#f5f7f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "12px",
    color: "#7e8787",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "13px",
  },

  headerInner: {
    maxWidth: "1320px",
    minHeight: "86px",
    margin: "0 auto",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  brandIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  brandTitle: {
    fontSize: "19px",
    fontWeight: 700,
  },

  brandSubtitle: {
    color: "#899191",
    fontSize: "12px",
    marginTop: "3px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  manualsLink: {
    height: "40px",
    padding: "0 14px",
    border: "1px solid #dfe4e4",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#555d5d",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  headerDivider: {
    width: "1px",
    height: "34px",
    background: "#e7ebeb",
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
    fontSize: "13px",
  },

  role: {
    color: "#00AF9A",
    fontSize: "10px",
    fontWeight: 700,
  },

  logoutButton: {
    width: "42px",
    height: "42px",
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
    width: "calc(100% - 56px)",
    maxWidth: "1260px",
    margin: "0 auto",
    padding: "38px 0 76px",
  },

  pageHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    marginBottom: "28px",
  },

  title: {
    margin: "0 0 6px",
    fontSize: "28px",
    fontWeight: 700,
  },

  subtitle: {
    margin: 0,
    color: "#858d8d",
    fontSize: "13px",
  },

  newTicketButton: {
    height: "46px",
    padding: "0 19px",
    border: "none",
    borderRadius: "9px",
    background: "#00AF9A",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  errorMessage: {
    padding: "13px 15px",
    marginBottom: "18px",
    border: "1px solid #efcaca",
    borderRadius: "9px",
    background: "#fff1f1",
    color: "#aa4141",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
  },

  statusGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  statusCard: {
    minHeight: "106px",
    border: "1px solid",
    borderRadius: "13px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    cursor: "pointer",
  },

  statusIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "11px",
    background: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statusCount: {
    fontSize: "25px",
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: "6px",
  },

  statusTitle: {
    color: "#626969",
    fontSize: "12px",
    fontWeight: 500,
  },

  filtersCard: {
    background: "#ffffff",
    border: "1px solid #e5e9e9",
    borderRadius: "13px",
    padding: "20px",
    marginBottom: "20px",
  },

  searchWrapper: {
    height: "46px",
    boxSizing: "border-box",
    border: "1px solid #dce1e1",
    borderRadius: "8px",
    padding: "0 14px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#929999",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#333838",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "12px",
  },

  filtersRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },

  filterField: {
    minWidth: "140px",
    flex: "1 1 140px",
  },

  filterLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#777f7f",
    fontSize: "11px",
    fontWeight: 600,
  },

  select: {
    width: "100%",
    height: "42px",
    boxSizing: "border-box",
    border: "1px solid #dce1e1",
    borderRadius: "8px",
    padding: "0 11px",
    background: "#ffffff",
    color: "#4e5656",
    outlineColor: "#00AF9A",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "11px",
  },

  clearButton: {
    height: "42px",
    padding: "0 13px",
    border: "none",
    background: "transparent",
    color: "#00A992",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  listCard: {
    background: "#ffffff",
    border: "1px solid #e5e9e9",
    borderRadius: "13px",
    overflow: "hidden",
  },

  listHeader: {
    padding: "21px 22px",
    borderBottom: "1px solid #edf0f0",
  },

  listTitle: {
    margin: "0 0 4px",
    fontSize: "16px",
    fontWeight: 700,
  },

  listSubtitle: {
    margin: 0,
    color: "#919898",
    fontSize: "11px",
  },

  ticketList: {
    display: "flex",
    flexDirection: "column",
  },

  ticketRow: {
    minHeight: "118px",
    padding: "19px 22px",
    boxSizing: "border-box",
    borderBottom: "1px solid #edf0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "25px",
    cursor: "pointer",
  },

  ticketMain: {
    minWidth: 0,
    flex: 1,
  },

  ticketTopLine: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
  },

  ticketNumber: {
    color: "#00A992",
    fontSize: "11px",
    fontWeight: 700,
  },

  ticketDate: {
    color: "#a0a6a6",
    fontSize: "10px",
  },

  ticketTitle: {
    margin: "0 0 8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#292e2e",
  },

  ticketMeta: {
    color: "#858d8d",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "7px",
    fontSize: "11px",
  },

  metaDot: {
    color: "#c4caca",
  },

  ticketActions: {
    display: "flex",
    alignItems: "flex-end",
    gap: "13px",
    flexShrink: 0,
  },

  actionBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  actionLabel: {
    color: "#969d9d",
    fontSize: "10px",
  },

  priorityBadge: {
    minWidth: "112px",
    height: "40px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "11px",
    fontWeight: 600,
  },

  statusBadge: {
    minWidth: "140px",
    height: "40px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "11px",
    fontWeight: 600,
  },

  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  estadoSelect: {
    minWidth: "140px",
    height: "40px",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "8px",
    padding: "0 11px",
    outline: "none",
    fontFamily:
      "'Poppins', Arial, sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },

  openButton: {
    width: "40px",
    height: "40px",
    border: "1px solid #dfe4e4",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#6d7575",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  emptyState: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "30px",
  },

  emptyIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "13px",
    background: "#ecf9f7",
    color: "#00AF9A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  },

  emptyTitle: {
    margin: "0 0 5px",
    fontSize: "15px",
  },

  emptyText: {
    margin: 0,
    color: "#909797",
    fontSize: "12px",
  },
