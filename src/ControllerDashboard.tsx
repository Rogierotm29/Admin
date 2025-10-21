import axios from "axios";

const API_URL = "https://api.caritas.automvid.store"; // general API root; append the rest on each call

export const dashboardService = {
    getReservationsHistogram,
    getPersonsHistogram,
    getReservationsStateCount,
    getReservations,
    getReservationById,
    updateReservationState,
    getServiceReservationsTypeCount,
    getServiceReservationDetails,
    confirmServiceReservation,
};

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

async function getReservationsHistogram() {
    try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard/reservations-histogram`, getAuthHeaders());
        return response.data; // { frequencies: [...] }
    } catch (error) {
        console.error("Error fetching reservations histogram:", error);
        throw error;
    }
}

async function getPersonsHistogram() {
    try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard/persons-histogram`, getAuthHeaders());
        return response.data; // { frequencies: [...] }
    } catch (error) {
        console.error("Error fetching persons histogram:", error);
        throw error;
    }
}

async function getReservationsStateCount() {
    try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard/reservations-state-count`, getAuthHeaders());
        return response.data; // { pending: [...], active: [...], ... }
    } catch (error) {
        console.error("Error fetching reservations state count:", error);
        throw error;
    }
}

async function getServiceReservationsTypeCount() {
    try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard/service-reservations-type-count`, getAuthHeaders());
        return response.data; // { transportations, breakfasts, ... }
    } catch (error) {
        console.error("Error fetching service reservations type count:", error);
        throw error;
    }
}

// New: fetch pending and active reservations for the dashboard
export type ReservationItem = {
    reservationId: string;
    userFullName: string;
    hostelName: string;
    peopleCount: number;
    startDate: string;
    endDate: string | null;
};

export type ReservationsResponse = {
    pendingReservation: ReservationItem[];
    activeReservations: ReservationItem[];
};

async function getReservations(): Promise<ReservationsResponse> {
    try {
        const response = await axios.get<ReservationsResponse>(`${API_URL}/api/admin/dashboard/reservations`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error fetching reservations:", error);
        throw error;
    }
}

async function getReservationById(id: string): Promise<any> {
    try {
        const response = await axios.get(`${API_URL}/api/admin/reservations/${id}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error fetching reservation by id:", error);
        throw error;
    }
}

async function getServiceReservationDetails(id: string): Promise<any> {
    // Construimos la URL completa
    const url = `${API_URL}/api/admin/service-reservations/${id}/details`;
    try {
        // Hacemos la petición
        const response = await axios.get(url, getAuthHeaders());
        return response.data;

    } catch (error: any) {
        // Re-lanzamos el error para manejo arriba
        throw error;
    }
}

async function confirmServiceReservation(id: string): Promise<any> {
    try {
        return await axios.post(`${API_URL}/api/admin/service-reservations/confirm/${id}`, null, getAuthHeaders());
    } catch (error) {
        throw error;
    }
}

async function updateReservationState(id: string, state: string): Promise<any> {
    try {
        const response = await axios.put(`${API_URL}/api/admin/reservations/${id}`, { state }, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error;
        throw error;
    }
}
