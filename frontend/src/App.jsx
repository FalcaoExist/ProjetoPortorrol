import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ListUsers from "./pages/ListUsers";
import ListSuppliers from "./pages/ListSuppliers";

function TesteBackend() {
  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>Frontend rodando</h1>
      <p>Conversando com o backend: {import.meta.env.VITE_API_URL}</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/list_users" element={<ListUsers />} />
        <Route path="/list_suppliers" element={<ListSuppliers />} />
      </Routes>
    </BrowserRouter>
  );
}
