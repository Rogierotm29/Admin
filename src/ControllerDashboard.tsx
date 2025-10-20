import axios from "axios";

const API_URL = "/api/admin/dashboard";

export const dashboardService = {
    getReservationsHistogram,
    getPersonsHistogram,
    getReservationsStateCount,
    getServiceReservationsTypeCount,
};

async function getReservationsHistogram() {
    try {
        const response = await axios.get(`${API_URL}/reservations-histogram`);
        return response.data; // { frequencies: [...] }
    } catch (error) {
        console.error("Error fetching reservations histogram:", error);
        throw error;
    }
}

async function getPersonsHistogram() {
    try {
        const response = await axios.get(`${API_URL}/persons-histogram`);
        return response.data; // { frequencies: [...] }
    } catch (error) {
        console.error("Error fetching persons histogram:", error);
        throw error;
    }
}

async function getReservationsStateCount() {
    try {
        const response = await axios.get(`${API_URL}/reservations-state-count`);
        return response.data; // { pending: [...], active: [...], ... }
    } catch (error) {
        console.error("Error fetching reservations state count:", error);
        throw error;
    }
}

async function getServiceReservationsTypeCount() {
    try {
        const response = await axios.get(`${API_URL}/service-reservations-type-count`);
        return response.data; // { transportations, breakfasts, ... }
    } catch (error) {
        console.error("Error fetching service reservations type count:", error);
        throw error;
    }
}
