import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import Invoices from "@/pages/Invoices";
import Reconciliation from "@/pages/Reconciliation";
import Insights from "@/pages/Insights";
import Calculator from "@/pages/Calculator";
import Export from "@/pages/Export";
import { Toaster } from "@/components/ui/sonner";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/campaigns" element={<Campaigns />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/reconciliation" element={<Reconciliation />} />
                            <Route path="/insights" element={<Insights />} />
                            <Route path="/calculator" element={<Calculator />} />
                            <Route path="/export" element={<Export />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <Toaster position="top-right" />
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
