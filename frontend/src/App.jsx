import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


import { AuthProvider } from "./context/authContext";


import PrivateRoute from "./components/privateRoute";

// Páginas
import Login from "./pages/Login";
import Home from "./pages/Home";
import ListUsers from "./pages/ListUsers";
import ListSuppliers from "./pages/ListSuppliers";
import Records from "./pages/Records";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* login */}
          <Route path="/" element={<Login />} />

          {/* essas rotas sao protegidas */}
          <Route 
            path="/home" 
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/list_users" 
            element={
              <PrivateRoute>
                <ListUsers />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/list_suppliers" 
            element={
              <PrivateRoute>
                <ListSuppliers />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/records" 
            element={
              <PrivateRoute>
                <Records />
              </PrivateRoute>
            } 
          />

          {/* qualquer rota desconhecida redireciona para login */}
          <Route path="*" element={<Navigate to="/" />} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}