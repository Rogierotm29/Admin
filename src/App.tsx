import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminCaritasApp from "./AdminCaritasApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminCaritasApp />} />
      </Routes>
    </BrowserRouter>
  );
}
