import axios from "axios";

const API_URL = "/api/admin/dashboard";

export const dashboardService = {
    getReservationsHistogram,
    getPersonsHistogram,
    getReservationsStateCount,
    getReservations,
    getReservationById,
    updateReservationState,
    getServiceReservationsTypeCount,
};

async function getReservationsHistogram() {
    try {
        const response = await axios.get(`${API_URL}/reservations-histogram`);
        console.log("Fetched reservations histogram:", response.data);
        return response.data; // { frequencies: [...] }
    } catch (error) {
        console.error("Error fetching reservations histogram:", error);
        throw error;
    }
}

async function getPersonsHistogram() {
    try {
        const response = await axios.get(`${API_URL}/persons-histogram`);
        console.log("Fetched reservations histogram:", response.data);
        return response.data; // { frequencies: [...] }
    } catch (error) {
        console.error("Error fetching persons histogram:", error);
        throw error;
    }
}

async function getReservationsStateCount() {
    try {
        const response = await axios.get(`${API_URL}/reservations-state-count`);
        console.log("Fetched reservations histogram:", response.data);
        return response.data; // { pending: [...], active: [...], ... }
    } catch (error) {
        console.error("Error fetching reservations state count:", error);
        throw error;
    }
}

async function getServiceReservationsTypeCount() {
    try {
        const response = await axios.get(`${API_URL}/service-reservations-type-count`);
        console.log("Fetched reservations histogram:", response.data);
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
        const response = await axios.get<ReservationsResponse>(`${API_URL}/reservations`);
        console.log("Fetched reservations:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching reservations:", error);
        throw error;
    }
}

async function getReservationById(id: string): Promise<any> {
    try {
        const response = await axios.get(`${API_URL.replace('/dashboard', '')}/reservations/${id}`);
        console.log("Fetched reservation by id:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching reservation by id:", error);
        throw error;
    }
}

async function updateReservationState(id: string, state: string): Promise<any> {
    try {
        const base = API_URL.replace('/dashboard', '');
        const response = await axios.put(`${base}/reservations/${id}`, { state });
        console.log(`Updated reservation ${id} => ${state}`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error updating reservation ${id}:`, error);
        throw error;
    }
}
