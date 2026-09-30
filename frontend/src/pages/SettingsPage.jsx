import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: "",
    bio: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/profile");

        const user = response.data.user;

        setForm({
          name: user?.name || "",
          bio: user?.bio || "",
        });
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (form.name.trim().length < 2) {
      setError("Имя должно содержать минимум 2 символа");
      return;
    }

    if (form.name.trim().length > 50) {
      setError("Имя не должно содержать больше 50 символов");
      return;
    }

    if (form.bio.length > 500) {
      setError("Описание не должно содержать больше 500 символов");
      return;
    }

    setSaving(true);

    try {
      await api.patch("/profile", {
        name: form.name.trim(),
        bio: form.bio.trim(),
      });

      setSuccess("Профиль успешно обновлён");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Не удалось сохранить изменения"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1>Настройки профиля</h1>

        <p className="subtitle">
          Измените информацию о своём профиле
        </p>

        {error && (
          <div className="alert error-alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert success-alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Имя</label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Введите имя"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">О себе</label>

            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Расскажите немного о себе"
              maxLength={500}
              rows={5}
            />

            <small>{form.bio.length}/500</small>
          </div>

          <button
            type="submit"
            className="button"
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>

        <div className="page-links">
          <Link to="/dashboard">
            Вернуться в Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 