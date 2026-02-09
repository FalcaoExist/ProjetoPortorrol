import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/authContext";
import PrivateRoute from "./components/common/PrivateRoute";

// Páginas
import Login from "./pages/Login";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import Orders from "./pages/Orders";
import ListUsers from "./pages/ListUsers";
import ListSuppliers from "./pages/ListSuppliers";
import Records from "./pages/Records";
import Profile from "./pages/Profile"
import NewOrder from "./pages/NewOrder";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/" element={<Login />} />

          {/* Rotas Protegidas */}
          
          {/* Dashboard: Acessível para todos */}
          <Route 
            path="/home" 
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/stock"
            element={
              <PrivateRoute>
                <Stock />
              </PrivateRoute>
            }
          />
          <Route 
            path="/orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route 
            path="/new-order"
            element={
              <PrivateRoute>
                <NewOrder />
              </PrivateRoute>
            }
          />
          <Route 
          path="/profile"
          element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/list_users" 
            element={
              <PrivateRoute allowedRoles={["gestor"]}>
                <ListUsers />
              </PrivateRoute>
            } 
          />

          {/* Fornecedores: Acessível para todos */}
          <Route 
            path="/list_suppliers" 
            element={
              <PrivateRoute allowedRoles={["gestor"]}>
                <ListSuppliers />
              </PrivateRoute>
            } 
          />

          {/* [PROTEGIDO] Apenas Gestor pode acessar Registros */}
          <Route 
            path="/records" 
            element={
              <PrivateRoute allowedRoles={["gestor"]}>
                <Records />
              </PrivateRoute>
            } 
          />

          {/* Rota coringa: redireciona para login */}
          <Route path="*" element={<Navigate to="/" />} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}