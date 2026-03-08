import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/authContext";
import PrivateRoute from "./components/common/PrivateRoute";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Stock from "./pages/Stock";
import Orders from "./pages/Orders";
import ListUsers from "./pages/ListUsers";
import ListSuppliers from "./pages/ListSuppliers";
import Records from "./pages/Records";
import Profile from "./pages/Profile"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

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

          <Route 
            path="/list_suppliers" 
            element={
              <PrivateRoute allowedRoles={["gestor"]}>
                <ListSuppliers />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/records" 
            element={
              <PrivateRoute allowedRoles={["gestor"]}>
                <Records />
              </PrivateRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}