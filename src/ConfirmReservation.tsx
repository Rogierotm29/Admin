import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardService } from "./ControllerDashboard";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

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

type ServiceReservationDetails = {
  orderDate?: string;
  count?: number;
  hostelName?: string;
  place?: string;
  fromHostel?: boolean;
  pickupTime?: string;
};

const ConfirmReservation: React.FC = () => {
  const query = useQuery();
  const id = query.get("id");
  const navigate = useNavigate();

  const [data, setData] = useState<ServiceReservationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDetails() {
      if (!id) {
        setError("no-id");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp = await dashboardService.getServiceReservationDetails(id);
        if (!mounted) return;
        setData(resp || null);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("fetch-error");
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDetails();
    return () => { mounted = false; };
  }, [id]);

  const handleAccept = async () => {
    if (!id) return;
    setAccepting(true);
    setError(null);
    try {
      await dashboardService.confirmServiceReservation(id);
      setAccepted(true);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'accept-error';
      setError(msg);
    } finally {
      setAccepting(false);
    }
  };

  const renderContent = () => {
    if (!id) return <p style={{ color: colors.subtext }}>data not available</p>;
    if (loading) return <p style={{ color: colors.subtext }}>Cargando...</p>;
    if (error || !data) return <p style={{ color: colors.subtext }}>data not available</p>;

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm" style={{ color: colors.subtext }}>Fecha de orden</p>
          <div className="mt-1 text-lg font-medium">{data.orderDate}</div>
        </div>

        <div>
          <p className="text-sm" style={{ color: colors.subtext }}>Cantidad</p>
          <div className="mt-1 text-lg font-medium">{data.count}</div>
        </div>

        {data.hostelName && (
          <div>
            <p className="text-sm" style={{ color: colors.subtext }}>Albergue</p>
            <div className="mt-1 text-lg font-medium">{data.hostelName}</div>
          </div>
        )}

        {data.place && (
          <div>
            <p className="text-sm" style={{ color: colors.subtext }}>Lugar de recogida</p>
            <div className="mt-1 text-lg font-medium">{data.place}</div>
          </div>
        )}

        {typeof data.fromHostel === "boolean" && (
          <div>
            <p className="text-sm" style={{ color: colors.subtext }}>Desde albergue</p>
            <div className="mt-1 text-lg font-medium">{data.fromHostel ? "Sí" : "No"}</div>
          </div>
        )}

        {data.pickupTime && (
          <div>
            <p className="text-sm" style={{ color: colors.subtext }}>Hora de recogida</p>
            <div className="mt-1 text-lg font-medium">{data.pickupTime}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: colors.bg, minHeight: "100vh" }}>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <SectionTitle title="Confirmar reserva" subtitle="Revisa los detalles del servicio" />
            <Card>
              <div className="mb-4 text-sm" style={{ color: colors.subtext }}>ID: <strong style={{ color: colors.text }}>{id || "-"}</strong></div>
              {renderContent()}

              {/* Acción: Aceptar */}
              <div className="mt-6">
                <button
                  disabled={accepting || accepted}
                  onClick={handleAccept}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: accepted ? "#10b981" : "#1f7dbf", color: "#fff" }}
                >
                  {accepting ? "Aceptando..." : accepted ? "Aceptada" : "Aceptar"}
                </button>
                {error === "accept-error" && <p className="text-sm mt-2" style={{ color: colors.warning }}>No se pudo aceptar la reserva.</p>}
                {accepted && <p className="text-sm mt-2" style={{ color: colors.accent }}>Reserva aceptada.</p>}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmReservation;
