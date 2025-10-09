import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

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
type Rango = { inicio: string; fin: string };
type Reserva = {
  id: string;
  nombre: string;
  rango: Rango;
  personas: number;
  intereses?: string[];
  servicios: Servicio[];
  nombres?: string[];
};

/* ===== Mock data (cámbialo por tu API) ===== */
const initialPending: Reserva[] = [
  {
    id: "r1",
    nombre: "Familia López",
    rango: { inicio: "2025-10-10", fin: "2025-10-20" },
    personas: 5,
    intereses: ["Lavar", "Transporte"],
    servicios: [
      { id: "s1", nombre: "Lavandería", cantidad: 1 },
      { id: "s2", nombre: "Transporte", cantidad: 1 },
    ],
  },
  {
    id: "r2",
    nombre: "Grupo Jóvenes",
    rango: { inicio: "2025-11-01", fin: "2025-11-05" },
    personas: 12,
    intereses: ["Alimentos"],
    servicios: [{ id: "s3", nombre: "Comedor", cantidad: 2 }],
  },
];

const initialConfirmed: Reserva[] = [
  {
    id: "c1",
    nombre: "Sr. Martínez",
    rango: { inicio: "2025-10-03", fin: "2025-10-04" },
    personas: 1,
    intereses: ["Consulta"],
    servicios: [{ id: "s4", nombre: "Trabajo Social", cantidad: 1 }],
  },
];

const catalogoServicios = [
  { id: "s1", nombre: "Lavandería" },
  { id: "s2", nombre: "Transporte" },
  { id: "s3", nombre: "Comedor" },
  { id: "s4", nombre: "Trabajo Social" },
  { id: "s5", nombre: "Albergue" },
];

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
function ReservasPage({ defaultList = "pendientes" }: { defaultList?: "pendientes" | "confirmadas" }) {
  const [pending, setPending] = useState<Reserva[]>(initialPending);
  const [confirmed, setConfirmed] = useState<Reserva[]>(initialConfirmed);
  const [active, setActive] = useState<"pendientes" | "confirmadas">(defaultList);
  const [detalle, setDetalle] = useState<null | { tipo: "P" | "C"; id: string }>(null);

  // sincroniza si cambiamos de pestaña (prop)
  useEffect(() => { setActive(defaultList); }, [defaultList]);

  const lista = active === "pendientes" ? pending : confirmed;

  function aceptar(id: string) {
    const res = pending.find(r => r.id === id);
    if (!res) return;
    setPending(prev => prev.filter(r => r.id !== id));
    setConfirmed(prev => [{ ...res }, ...prev]);
    setActive("confirmadas");
    setDetalle({ tipo: "C", id: res.id });
  }
  function rechazar(id: string) {
    setPending(prev => prev.filter(r => r.id !== id));
    setDetalle(null);
  }

  const detalleReserva = useMemo(() => {
    if (!detalle) return null;
    const src = detalle.tipo === "P" ? pending : confirmed;
    return src.find(r => r.id === detalle.id) || null;
  }, [detalle, pending, confirmed]);

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
                      {new Date(r.rango.inicio).toLocaleDateString()} – {new Date(r.rango.fin).toLocaleDateString()}
                    </p>
                    {!!r.intereses?.length && (
                      <p className="text-xs mt-1" style={{ color: colors.subtext }}>Intereses: {r.intereses.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {active === "pendientes" ? (
                      <>
                        <Button className="whitespace-nowrap" tone="warning" onClick={() => setDetalle({ tipo: "P", id: r.id })}>Detalles</Button>
                        <Button className="whitespace-nowrap" tone="accent" onClick={() => aceptar(r.id)}>Aceptar</Button>
                        <Button className="whitespace-nowrap" tone="ghost" onClick={() => rechazar(r.id)}>Rechazar</Button>
                      </>
                    ) : (
                      <Button className="whitespace-nowrap" tone="accent" onClick={() => setDetalle({ tipo: "C", id: r.id })}>Ver detalles</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {lista.length === 0 && <p className="text-sm" style={{ color: colors.subtext }}>No hay elementos en esta lista.</p>}
          </div>
        </Card>
      </div>

      {/* Detalle */}
      <div className="space-y-4">
        <SectionTitle title="Detalle de la reservación" subtitle="Gestiona personas y servicios" />
        <Card>
          {!detalleReserva ? (
            <p style={{ color: colors.subtext }}>Selecciona una reserva para ver y editar sus detalles.</p>
          ) : (
            <ReservaDetalle
              data={detalleReserva}
              onUpdate={(upd) => {
                if (detalle?.tipo === "P") setPending(p => p.map(x => x.id === upd.id ? upd : x));
                else setConfirmed(c => c.map(x => x.id === upd.id ? upd : x));
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function ReservaDetalle({ data, onUpdate }: { data: Reserva; onUpdate: (d: Reserva) => void }) {
  const [personas, setPersonas] = useState<string[]>(
    Array.from({ length: Math.max(1, data.personas) }).map((_, i) => data?.nombres?.[i] || `Persona ${i + 1}`)
  );
  const [servicios, setServicios] = useState<Servicio[]>(data.servicios || []);

  function addPersona() { setPersonas(p => [...p, `Persona ${p.length + 1}`]); }
  function removePersona(i: number) { setPersonas(p => p.filter((_, idx) => idx !== i)); }

  function addServicio() { setServicios(s => [...s, { id: "", nombre: "", cantidad: 1 }]); }
  function removeServicio(i: number) { setServicios(s => s.filter((_, idx) => idx !== i)); }

  function changeServicioId(i: number, value: string) {
    setServicios(s => s.map((sv, idx) => idx === i
      ? { ...sv, id: value, nombre: catalogoServicios.find(c => c.id === value)?.nombre || sv.nombre }
      : sv));
  }
  function changeServicioQty(i: number, value: number) {
    setServicios(s => s.map((sv, idx) => idx === i ? { ...sv, cantidad: value } : sv));
  }

  function save() {
    onUpdate({ ...data, personas: personas.length, nombres: personas, servicios });
  }

  return (
    <div className="space-y-6">
      {/* Cabecera + botón guardar */}
      <div className="grid gap-4 md:grid-cols-[1fr,auto]">
        <div>
          <h3 className="font-semibold mb-1">{data.nombre}</h3>
          <p className="text-sm" style={{ color: colors.subtext }}>
            {new Date(data.rango.inicio).toLocaleDateString()} – {new Date(data.rango.fin).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-start md:items-end justify-end gap-2">
          <Button tone="primary" onClick={save}>Guardar cambios</Button>
        </div>
      </div>

      {/* Personas (arriba) */}
      <div>
        <SectionTitle title="Personas" subtitle="Añade o elimina asistentes" />
        <div className="space-y-2">
          {personas.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={p}
                onChange={e => setPersonas(arr => arr.map((x, idx) => idx === i ? e.target.value : x))}
                className="flex-1 rounded-lg px-3 py-2 text-sm bg-transparent border"
                style={{ borderColor: colors.stroke, color: colors.text }}
              />
              <Button tone="ghost" onClick={() => removePersona(i)}>−</Button>
            </div>
          ))}
          <Button tone="ghost" onClick={addPersona}>Agregar persona</Button>
        </div>
      </div>

      {/* Servicios (abajo) */}
      <div>
        <SectionTitle title="Servicios de la reservación" subtitle="Selecciona y asigna cantidades" />
        <div className="space-y-3">
          {servicios.map((sv, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <select
                className="col-span-7 rounded-lg px-3 py-2 text-sm bg-transparent border"
                style={{ borderColor: colors.stroke, color: colors.text }}
                value={sv.id}
                onChange={e => changeServicioId(i, e.target.value)}
              >
                <option value="" disabled style={{ color: "#000" }}>Selecciona servicio</option>
                {catalogoServicios.map(c => (
                  <option key={c.id} value={c.id} style={{ color: "#000" }}>{c.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="col-span-3 rounded-lg px-3 py-2 text-sm bg-transparent border"
                style={{ borderColor: colors.stroke, color: colors.text }}
                value={sv.cantidad}
                onChange={e => changeServicioQty(i, Number(e.target.value))}
              />
              <Button className="col-span-2 whitespace-nowrap" tone="ghost" onClick={() => removeServicio(i)}>Eliminar</Button>
            </div>
          ))}
          <Button tone="ghost" onClick={addServicio}>Agregar servicio</Button>
        </div>
      </div>
    </div>
  );
}

/* ===== 2) Dashboard ===== */
function DashboardPage() {
  const reservasMes = [
    { mes: "Ene", total: 32 }, { mes: "Feb", total: 27 }, { mes: "Mar", total: 41 }, { mes: "Abr", total: 38 },
    { mes: "May", total: 29 }, { mes: "Jun", total: 44 }, { mes: "Jul", total: 35 }, { mes: "Ago", total: 50 },
    { mes: "Sep", total: 47 }, { mes: "Oct", total: 52 }, { mes: "Nov", total: 39 }, { mes: "Dic", total: 46 },
  ];
  const estadoActual = [
    { label: "Pendientes", value: 7 },
    { label: "Confirmadas", value: 21 },
  ];
  const serviciosMasUsados = [
    { nombre: "Comedor", usos: 72 },
    { nombre: "Transporte", usos: 41 },
    { nombre: "Lavandería", usos: 27 },
    { nombre: "Albergue", usos: 19 },
  ];
  const serviciosInteres = [
    { nombre: "Psicología", interesados: 34 },
    { nombre: "Odontología", interesados: 21 },
    { nombre: "Asesoría Legal", interesados: 18 },
  ];

  const chartBox = { height: 260 };

  return (
    <div className="grid gap-6 md:grid-cols-2">
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

/* ===== 3) Página Confirmadas ===== */
function ConfirmadasPage() {
  return <ReservasPage defaultList="confirmadas" />;
}

/* ===== Shell / Layout ===== */
const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "reservas", label: "Reservas" },
  { key: "confirmadas", label: "Confirmadas" },
] as const;
type TabKey = typeof tabs[number]["key"];

export default function AdminCaritasApp() {
  const [tab, setTab] = useState<TabKey>("dashboard");

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
        {tab === "reservas" && <ReservasPage />}
        {tab === "confirmadas" && <ConfirmadasPage />}
      </main>

      <footer className="border-t mt-8 px-4 py-6 text-xs" style={{ borderColor: colors.stroke, color: colors.subtext }}>
        <div className="max-w-7xl mx-auto">UI de ejemplo para integrar con tu API (React + Tailwind + Recharts).</div>
      </footer>
    </div>
  );
}
