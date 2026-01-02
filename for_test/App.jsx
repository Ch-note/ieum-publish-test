import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Meeting from "./pages/Meeting";
import Result from "./pages/Result";
import Upload from "./pages/Upload";
import AppLayout from "./components/AppLayout";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAppContext();
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/meeting"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Meeting />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Upload />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Result />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ▼▼▼ [추가] 이 블록을 추가하세요! ▼▼▼ */}
        <Route
          path="/result/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Result />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;
