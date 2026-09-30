import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/profile");
        setUser(response.data.user);
      } catch (err) {
        setError(
          err.response?.data?.message || "Не удалось загрузить профиль"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <h2>Ошибка</h2>
          <p className="error-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1>Dashboard</h1>

        <p className="subtitle">
          Добро пожаловать, {user?.name || user?.email}!
        </p>

        <div className="profile-info">
          <div className="info-item">
            <span>Email</span>
            <strong>{user?.email}</strong>
          </div>

          <div className="info-item">
            <span>Имя</span>
            <strong>{user?.name || "Не указано"}</strong>
          </div>

          <div className="info-item">
            <span>О себе</span>
            <strong>{user?.bio || "Не указано"}</strong>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/settings" className="button">
            Настройки профиля
          </Link>

          <Link to="/about" className="button secondary-button">
            О приложении
          </Link>
        </div>
      </div>
    </div>
  );
} 