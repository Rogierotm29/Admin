import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminCaritasApp from "./AdminCaritasApp";
import ConfirmReservation from "./ConfirmReservation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminCaritasApp />} />
        <Route path="/confirm-reservation" element={<ConfirmReservation />} />
      </Routes>
    </BrowserRouter>
  );
}
