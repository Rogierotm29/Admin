import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import { dashboardService } from "./ControllerDashboard";

/* Paleta (ajústala si tienes guía oficial) */
const colors = {
  primary: "#1f7dbf",
  primaryDark: "#155a85",
  accent: "#26a69a",
  warning: "#f59e0b",
  bg: "#0b1220",
  card: "#0f172a",
  stroke: "#1e293b",
  text: "#e2e8f0",
  subtext: "#94a3b8",
};

/* ===== Tipos ===== */
type Servicio = { id: string; nombre: string; cantidad: number };
type Rango = { inicio: string | null; fin: string | null };
type Reserva = {
  id: string;
  nombre: string;
  rango: Rango;
  personas: number;
  intereses?: string[];
  servicios: Servicio[];
  nombres?: string[];
};

// Start empty; we'll load from API
// we'll pass initial lists via props from the top-level component



/* ===== Utils UI ===== */
function clsx(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(" ");
}
function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx("rounded-2xl p-5 shadow-xl border", props.className)}
      style={{ background: colors.card, borderColor: colors.stroke, color: colors.text }}
    >
      {props.children}
    </div>
  );
}
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle && <p className="text-sm" style={{ color: colors.subtext }}>{subtitle}</p>}
    </div>
  );
}
function Button(
  { children, onClick, tone = "primary", className }:
    { children: React.ReactNode; onClick?: () => void; tone?: "primary" | "accent" | "warning" | "ghost"; className?: string }
) {
  const tones: Record<string, string> = {
    primary: colors.primary,
    accent: colors.accent,
    warning: colors.warning,
    ghost: "transparent",
  };
  const fg = tone === "ghost" ? colors.text : "#fff";
  const border = tone === "ghost" ? colors.stroke : "transparent";
  return (
    <button
      onClick={onClick}
      className={clsx("px-4 py-2 rounded-xl transition-colors text-sm font-medium border", className)}
      style={{ background: tones[tone], color: fg, borderColor: border }}
    >
      {children}
    </button>
  );
}

/* ===== 1) Página Reservas ===== */
function ReservasPage({ defaultList = "pendientes", initialPendingList = [], initialConfirmedList = [], onViewDetails, onFinalize }:
  { defaultList?: "pendientes" | "confirmadas"; initialPendingList?: Reserva[]; initialConfirmedList?: Reserva[]; onViewDetails?: (id: string) => void; onFinalize?: (id: string) => Promise<void> }) {
  const [pending, setPending] = useState<Reserva[]>(initialPendingList);
  const [confirmed, setConfirmed] = useState<Reserva[]>(initialConfirmedList);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<"pendientes" | "confirmadas">(defaultList);

  // sincroniza si cambiamos de pestaña (prop)
  useEffect(() => { setActive(defaultList); }, [defaultList]);

  const lista = active === "pendientes" ? pending : confirmed;

  function aceptar(id: string) {
    // optimistically update UI after successful API call
    const res = pending.find(r => r.id === id);
    if (!res) return;
    // call API to set ACTIVE
    (async () => {
      try {
        setUpdatingIds(s => ({ ...s, [id]: true }));
        await dashboardService.updateReservationState(id, "ACTIVE");
        // move to confirmed list
        setPending(prev => prev.filter(r => r.id !== id));
        setConfirmed(prev => [{ ...res }, ...prev]);
        setActive("confirmadas");
        onViewDetails?.(res.id);
      } catch (err) {
        console.error(err);
        // TODO: show a toast or error message
      } finally {
        setUpdatingIds(s => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
      }
    })();
  }
  function rechazar(id: string) {
    const res = pending.find(r => r.id === id);
    if (!res) return;
    (async () => {
      try {
        setUpdatingIds(s => ({ ...s, [id]: true }));
        await dashboardService.updateReservationState(id, "CANCELLED");
        // On cancel, remove from pending and clear detail selection.
        // We DO NOT move cancelled reservations to the confirmed list.
        setPending(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error(err);
      } finally {
        setUpdatingIds(s => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
      }
    })();
  }

  // finalize a confirmed reservation (default: set state to COMPLETED)
  async function finalizar(id: string) {
    const res = confirmed.find(r => r.id === id);
    if (!res) return;
    setUpdatingIds(s => ({ ...s, [id]: true }));
    try {
      if (onFinalize) {
        await onFinalize(id);
      } else {
        await dashboardService.updateReservationState(id, "INACTIVE");
      }
      // remove from confirmed list after finalizing
      setConfirmed(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingIds(s => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    }
  }



  return (
    <div
      className="grid gap-6 md:grid-cols-[520px,1fr] xl:grid-cols-[580px,1fr]"
      style={{ color: colors.text }}
    >
      {/* Lista */}
      <div className="space-y-4">
        <SectionTitle title="Reservas" subtitle="Pendientes y confirmadas" />
        <div className="flex gap-2 mb-2">
          <Button tone={active === "pendientes" ? "warning" : "ghost"} onClick={() => setActive("pendientes")}>
            Pendientes ({pending.length})
          </Button>
          <Button tone={active === "confirmadas" ? "accent" : "ghost"} onClick={() => setActive("confirmadas")}>
            Confirmadas ({confirmed.length})
          </Button>
        </div>

        <Card className="p-4">
          <div className="space-y-3">
            {lista.map(r => (
              <div key={r.id} className="border rounded-xl p-4" style={{ borderColor: colors.stroke }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-[220px]">
                    <p className="font-semibold">{r.nombre} · {r.personas} personas</p>
                    <p className="text-xs" style={{ color: colors.subtext }}>
                      {formatDate(r.rango.inicio)} – {formatDate(r.rango.fin)}
                    </p>
                    {!!r.intereses?.length && (
                      <p className="text-xs mt-1" style={{ color: colors.subtext }}>Intereses: {r.intereses.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {active === "pendientes" ? (
                      <>
                        <Button className="whitespace-nowrap" tone="warning" onClick={() => onViewDetails?.(r.id)}>Detalles</Button>
                        <Button className="whitespace-nowrap" tone="accent" onClick={() => aceptar(r.id)}>Aceptar</Button>
                        <Button className="whitespace-nowrap" tone="ghost" onClick={() => rechazar(r.id)}>Rechazar</Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button className="whitespace-nowrap" tone="accent" onClick={() => onViewDetails?.(r.id)}>Ver detalles</Button>
                        <Button className="whitespace-nowrap" tone="primary" onClick={() => finalizar(r.id)}>
                          {updatingIds[r.id] ? "Finalizando..." : "Finalizar"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {lista.length === 0 && <p className="text-sm" style={{ color: colors.subtext }}>No hay elementos en esta lista.</p>}
          </div>
        </Card>
      </div>


    </div>
  );
}


/* ===== Detalle completo desde API ===== */
type ApiUser = { id: string; firstName: string; lastName: string; phoneNumber?: string };
type ApiHostel = { id: string; name: string; description?: string; price?: number; maxCapacity?: number; locationUrl?: string; imageUrls?: string[] };
type ApiPerson = { id: string; firstName: string; lastName: string; birthDate?: string; alergies?: string[]; discapacities?: string[]; medicines?: string[] };
type ApiPersonReservation = { id: string; person: ApiPerson };
type ApiReservationFull = {
  id: string;
  user: ApiUser;
  hostel: ApiHostel;
  startDate: string;
  endDate: string | null;
  state: string;
  personReservations: ApiPersonReservation[];
  serviceReservations: any[];
};

function ReservationFullDetail({ data, onClose }: { data: ApiReservationFull; onClose?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold mb-1">Reserva: {data.id}</h3>
          <p style={{ color: colors.subtext }}>{data.hostel?.name} · {data.user?.firstName} {data.user?.lastName}</p>
          <p className="text-sm" style={{ color: colors.subtext }}>{formatDate(data.startDate)} – {formatDate(data.endDate)}</p>
          <p className="text-sm" style={{ color: colors.subtext }}>Estado: {data.state}</p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && <Button tone="ghost" onClick={onClose}>Cerrar</Button>}
        </div>
      </div>

      {/* Images intentionally not rendered */}

      <Card>
        <h4 className="font-semibold mb-2">Información del usuario</h4>
        <p>{data.user.firstName} {data.user.lastName}</p>
        {data.user.phoneNumber && <p style={{ color: colors.subtext }}>{data.user.phoneNumber}</p>}
      </Card>

      <Card>
        <h4 className="font-semibold mb-2">Personas en la reserva</h4>
        <div className="space-y-3">
          {data.personReservations.map(pr => (
            <div key={pr.id} className="border rounded-lg p-3" style={{ borderColor: colors.stroke }}>
              <p className="font-medium">{pr.person.firstName} {pr.person.lastName}</p>
              <p className="text-sm" style={{ color: colors.subtext }}>Nacimiento: {formatDate(pr.person.birthDate)}</p>
              {!!pr.person.alergies?.length && <p className="text-sm" style={{ color: colors.subtext }}>Alergias: {pr.person.alergies.join(", ")}</p>}
              {!!pr.person.discapacities?.length && <p className="text-sm" style={{ color: colors.subtext }}>Discapacidades: {pr.person.discapacities.join(", ")}</p>}
              {!!pr.person.medicines?.length && <p className="text-sm" style={{ color: colors.subtext }}>Medicinas: {pr.person.medicines.join(", ")}</p>}
            </div>
          ))}
          {data.personReservations.length === 0 && <p style={{ color: colors.subtext }}>No hay personas registradas.</p>}
        </div>
      </Card>

      <Card>
        <h4 className="font-semibold mb-2">Servicios asociados</h4>
        <div className="space-y-3">
          {data.serviceReservations.map((sr: any) => (
            <div key={sr.id} className="border rounded-lg p-3 flex justify-between items-center" style={{ borderColor: colors.stroke }}>
              <div>
                <p className="font-medium">{sr.service?.type || 'Servicio'}</p>
                <p className="text-sm" style={{ color: colors.subtext }}>Fecha: {formatDate(sr.orderDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Cantidad: {sr.costCount}</p>
                <p className="text-sm" style={{ color: colors.subtext }}>Precio unit.: ${sr.service?.price ?? 0}</p>
                <p className="text-sm font-semibold">Total: ${((sr.service?.price ?? 0) * (sr.costCount ?? 0)).toFixed(2)}</p>
              </div>
            </div>
          ))}
          {data.serviceReservations.length === 0 && <p style={{ color: colors.subtext }}>No hay servicios asociados.</p>}

          <div className="pt-2 border-t mt-2" style={{ borderColor: colors.stroke }}>
            <p className="font-semibold">Total servicios: ${data.serviceReservations.reduce((sum: number, sr: any) => sum + ((sr.service?.price ?? 0) * (sr.costCount ?? 0)), 0).toFixed(2)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

/* ===== 2) Dashboard ===== */
// Tipos para mayor claridad
interface ReservaMes {
  mes: string;
  total: number;
}

interface EstadoActual {
  label: string;
  value: number;
}

interface ServicioMasUsado {
  nombre: string;
  usos: number;
}

interface ServicioInteres {
  nombre: string;
  interesados: number;
}

function DashboardPage() {
  // 👇 Tipamos explícitamente los estados
  const [reservasMes, setReservasMes] = useState<ReservaMes[]>([]);
  const [estadoActual, setEstadoActual] = useState<EstadoActual[]>([]);
  const [serviciosMasUsados, setServiciosMasUsados] = useState<ServicioMasUsado[]>([]);
  const [serviciosInteres, setServiciosInteres] = useState<ServicioInteres[]>([]);

  const chartBox = { height: 260 };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          reservationsHistogram,
          personsHistogram,
          reservationsState,
          serviceReservationsTypeCount,
        ] = await Promise.all([
          dashboardService.getReservationsHistogram(),
          dashboardService.getPersonsHistogram(),
          dashboardService.getReservationsStateCount(),
          dashboardService.getServiceReservationsTypeCount(),
        ]);

        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        // --- 1️⃣ Reservas mensuales ---
        const reservasMesData: ReservaMes[] = reservationsHistogram.frequencies.map(
          (total: number, i: number) => ({
            mes: meses[i],
            total,
          })
        );
        setReservasMes(reservasMesData);

        // --- 2️⃣ Pendientes vs Confirmadas ---
        const pendientes = reservationsState.pending.reduce((a: number, b: number) => a + b, 0);
        const confirmadas = reservationsState.active.reduce((a: number, b: number) => a + b, 0);
        setEstadoActual([
          { label: "Pendientes", value: pendientes },
          { label: "Confirmadas", value: confirmadas },
        ]);

        // --- 3️⃣ Servicios más usados ---
        const serviciosMasUsadosData: ServicioMasUsado[] = Object.entries(serviceReservationsTypeCount).map(
          ([nombre, usos]) => ({
            nombre,
            usos: Number(usos), // 👈 convertimos a número explícitamente
          })
        );
        setServiciosMasUsados(serviciosMasUsadosData);

        // --- 4️⃣ Servicios de interés ---
        const serviciosInteresData: ServicioInteres[] = personsHistogram.frequencies.map(
          (interesados: number, i: number) => ({
            nombre: meses[i],
            interesados,
          })
        );
        setServiciosInteres(serviciosInteresData);
      } catch (error) {
        console.error("Error cargando los datos del dashboard:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* --- Reservas mensuales --- */}
      <Card>
        <SectionTitle title="Reservas mensuales" subtitle="Histograma (total por mes)" />
        <div className="w-full" style={chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reservasMes}>
              <CartesianGrid stroke={colors.stroke} />
              <XAxis dataKey="mes" stroke={colors.subtext} />
              <YAxis stroke={colors.subtext} />
              <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.stroke}`, color: colors.text }} />
              <Legend />
              <Bar dataKey="total" name="Reservas" fill={colors.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* --- Estado actual --- */}
      <Card>
        <SectionTitle title="Pendientes vs Confirmadas" subtitle="Estado actual" />
        <div className="w-full" style={chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estadoActual}>
              <CartesianGrid stroke={colors.stroke} />
              <XAxis dataKey="label" stroke={colors.subtext} />
              <YAxis stroke={colors.subtext} />
              <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.stroke}`, color: colors.text }} />
              <Legend />
              <Bar dataKey="value" name="Cantidad" fill={colors.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* --- Servicios más usados --- */}
      <Card>
        <SectionTitle title="Servicios más usados / mensuales" />
        <div className="w-full" style={chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviciosMasUsados}>
              <CartesianGrid stroke={colors.stroke} />
              <XAxis dataKey="nombre" stroke={colors.subtext} />
              <YAxis stroke={colors.subtext} />
              <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.stroke}`, color: colors.text }} />
              <Legend />
              <Bar dataKey="usos" name="Usos" fill={colors.primaryDark} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* --- Servicios de interés --- */}
      <Card>
        <SectionTitle title="Servicios de interés" subtitle="Encuestas / solicitudes" />
        <div className="w-full" style={chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviciosInteres}>
              <CartesianGrid stroke={colors.stroke} />
              <XAxis dataKey="nombre" stroke={colors.subtext} />
              <YAxis stroke={colors.subtext} />
              <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.stroke}`, color: colors.text }} />
              <Legend />
              <Bar dataKey="interesados" name="Interesados" fill={colors.warning} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// Confirmadas page removed per request — use Reservas with defaultList="confirmadas" if needed elsewhere

/* ===== Shell / Layout ===== */
const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "reservas", label: "Reservas" },
] as const;
type TabKey = typeof tabs[number]["key"];

export default function AdminCaritasApp() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [pendingFromApi, setPendingFromApi] = useState<Reserva[]>([]);
  const [confirmedFromApi, setConfirmedFromApi] = useState<Reserva[]>([]);
  const [loadingReservations, setLoadingReservations] = useState<boolean>(false);
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const [fullReservation, setFullReservation] = useState<ApiReservationFull | null>(null);
  const [loadingFullReservation, setLoadingFullReservation] = useState<boolean>(false);
  const [fullReservationError, setFullReservationError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingReservations(true);
      setReservationsError(null);
      try {
        const data = await dashboardService.getReservations();
        if (!mounted) return;
        // Map API shape to Reserva
        const mapItem = (it: import("./ControllerDashboard").ReservationItem): Reserva => ({
          id: it.reservationId,
          nombre: it.userFullName,
          rango: { inicio: it.startDate || null, fin: it.endDate || null },
          personas: it.peopleCount,
          servicios: [],
        });

        setPendingFromApi(data.pendingReservation.map(mapItem));
        setConfirmedFromApi(data.activeReservations.map(mapItem));
      } catch (err) {
        console.error(err);
        setReservationsError("No se pudieron cargar las reservas");
      } finally {
        setLoadingReservations(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const viewDetails = async (id: string) => {
    setFullReservation(null);
    setFullReservationError(null);
    setLoadingFullReservation(true);
    try {
      const res = await dashboardService.getReservationById(id);
      setFullReservation(res as ApiReservationFull);
    } catch (err) {
      console.error(err);
      setFullReservationError("No se pudo cargar el detalle de la reserva");
    } finally {
      setLoadingFullReservation(false);
    }
  };

  return (
    <div style={{ background: colors.bg, minHeight: "100vh" }}>
      <header className="sticky top-0 z-10 border-b" style={{ background: colors.card, borderColor: colors.stroke }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-6 rounded-sm" style={{ background: colors.primary }} />
            <h1 className="font-semibold" style={{ color: colors.text }}>Cáritas – Panel Admin</h1>
          </div>
          <nav className="flex items-center gap-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx("px-3 py-2 rounded-lg text-sm font-medium border")}
                style={{
                  color: tab === t.key ? "#fff" : colors.subtext,
                  background: tab === t.key ? colors.primary : "transparent",
                  borderColor: tab === t.key ? "transparent" : colors.stroke,
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === "dashboard" && <DashboardPage />}
        {tab === "reservas" && (
          <>
            {loadingReservations ? (
              <Card><p style={{ color: colors.subtext }}>Cargando reservas...</p></Card>
            ) : reservationsError ? (
              <Card><p style={{ color: colors.subtext }}>{reservationsError}</p></Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-[520px,1fr] xl:grid-cols-[580px,1fr]">
                <div>
                  <ReservasPage initialPendingList={pendingFromApi} initialConfirmedList={confirmedFromApi} onViewDetails={viewDetails} />
                </div>
                <div className="space-y-4">
                  <SectionTitle title="Detalle de la reservación" subtitle="Gestiona personas y servicios" />
                  <Card>
                    {loadingFullReservation ? (
                      <p style={{ color: colors.subtext }}>Cargando detalle...</p>
                    ) : fullReservationError ? (
                      <p style={{ color: colors.subtext }}>{fullReservationError}</p>
                    ) : fullReservation ? (
                      <ReservationFullDetail data={fullReservation} onClose={() => setFullReservation(null)} />
                    ) : (
                      <p style={{ color: colors.subtext }}>Selecciona una reserva para ver y editar sus detalles.</p>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
        {/* Confirmadas tab removed */}
      </main>

      <footer className="border-t mt-8 px-4 py-6 text-xs" style={{ borderColor: colors.stroke, color: colors.subtext }}>
        <div className="max-w-7xl mx-auto">UI de ejemplo para integrar con tu API (React + Tailwind + Recharts).</div>
      </footer>
    </div>
  );
}

