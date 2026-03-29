import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import BoardPage from "./pages/BoardPage";
import HomePage from "./pages/HomePage";
import { NotificationProvider } from "./context/NotificationContext";
import Toast from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";

export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/board/:boardId" element={<BoardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
        <ConfirmDialog />
      </BrowserRouter>
    </NotificationProvider>
  );
}
