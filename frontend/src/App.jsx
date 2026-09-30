import {
  useEffect,
  useState
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import api, {
  setAccessToken
} from "./api";

import "./App.css";

import DashboardPage from "./pages/DashboardPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";

const initialRegisterForm = {
  name: "",
  email: "",
  password: ""
};


function getError(error) {
  return (
    error.response?.data?.message ||
    "Произошла неизвестная ошибка"
  );
}


function App() {
  const [mode, setMode] =
    useState("login");

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);
    
  useEffect(() => {
    restoreSession();
  }, []);


  async function restoreSession() {
    try {
      const response =
        await api.post("/refresh");


      setAccessToken(
        response.data.accessToken
      );


      setUser(
        response.data.user
      );
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }


  async function logout() {
    try {
      await api.post("/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  function ProtectedRoute({ children }) {
  if (loading) {
      return <div className="screen-center">Загрузка...</div>;
  }
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  }


  if (loading) {
  return (
    <div className="screen-center">
        Проверяем сессию...
        </div>
  );
}

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : (
            <AuthForm
              mode={mode}
              setMode={setMode}
              onSuccess={newUser => {
                setUser(newUser);
              }}
            />
          )
        } />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function AuthForm({
  mode,
  setMode,
  onSuccess
}) {
  const isLogin =
    mode === "login";


  const [form, setForm] =
    useState(
      isLogin
        ? {
            email: "",
            password: ""
          }
        : initialRegisterForm
    );


  const [error, setError] =
    useState("");


  const [message, setMessage] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  function changeMode(nextMode) {
    setMode(nextMode);


    if (nextMode === "login") {
      setForm({
        email: "",
        password: ""
      });
    } else {
      setForm({
        ...initialRegisterForm
      });
    }


    setError("");
    setMessage("");
  }


  function update(
    field,
    value
  ) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }


  function validate() {
    if (
      !form.email.includes("@")
    ) {
      return "Введите корректный email";
    }


    if (
      form.password.length < 6
    ) {
      return (
        "Пароль должен содержать минимум 6 символов"
      );
    }


    if (
      !isLogin &&
      form.name.trim().length < 2
    ) {
      return (
        "Введите имя минимум из 2 символов"
      );
    }


    return "";
  }


  async function submit(event) {
    event.preventDefault();


    setError("");
    setMessage("");


    const validationError =
      validate();


    if (validationError) {
      setError(
        validationError
      );

      return;
    }


    setLoading(true);


    try {
      if (isLogin) {

        const response =
          await api.post(
            "/login",
            {
              email: form.email,
              password:
                form.password
            }
          );


        setAccessToken(
          response.data.accessToken
        );


        onSuccess(
          response.data.user
        );
      } else {

        await api.post(
          "/register",
          form
        );


        setMessage(
          "Регистрация успешна. Теперь войдите."
        );


        setMode("login");


        setForm({
          email: form.email,
          password: ""
        });
      }
    } catch (error) {
      setError(
        getError(error)
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="screen-center">
      <div className="auth-card">

        <div className="brand">
          <span>🔐</span>

          <h1>
            Fullstack Auth
          </h1>
        </div>


        <p className="subtitle">
          {isLogin
            ? "Войдите в свой аккаунт"
            : "Создайте новый аккаунт"}
        </p>


        <div className="tabs">

          <button
            className={
              isLogin
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              changeMode("login")
            }
          >
            Вход
          </button>


          <button
            className={
              !isLogin
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              changeMode("register")
            }
          >
            Регистрация
          </button>

        </div>


        <form
          onSubmit={submit}
        >

          {!isLogin && (
            <label>
              Имя

              <input
                value={form.name}
                onChange={event =>
                  update(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Введите имя"
                maxLength={50}
              />
            </label>
          )}


          <label>
            Email

            <input
              type="email"
              value={form.email}
              onChange={event =>
                update(
                  "email",
                  event.target.value
                )
              }
              placeholder="example@mail.com"
              autoComplete="email"
            />
          </label>


          <label>
            Пароль

            <input
              type="password"
              value={form.password}
              onChange={event =>
                update(
                  "password",
                  event.target.value
                )
              }
              placeholder="Минимум 6 символов"
              autoComplete={
                isLogin
                  ? "current-password"
                  : "new-password"
              }
            />
          </label>


          {error && (
            <div className="alert error">
              {error}
            </div>
          )}


          {message && (
            <div className="alert success">
              {message}
            </div>
          )}


          <button
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Подождите..."
              : isLogin
                ? "Войти"
                : "Создать аккаунт"}
          </button>

        </form>

      </div>
    </div>
  );
}

function Profile({
  user,
  setUser,
  logout
}) {
  const [name, setName] =
    useState(user.name);


  const [bio, setBio] =
    useState(user.bio || "");


  const [message, setMessage] =
    useState("");


  const [error, setError] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  async function saveProfile(event) {
    event.preventDefault();


    setError("");
    setMessage("");


    if (
      name.trim().length < 2
    ) {
      setError(
        "Имя должно содержать минимум 2 символа"
      );

      return;
    }


    if (bio.length > 300) {
      setError(
        "Описание не должно превышать 300 символов"
      );

      return;
    }


    setLoading(true);


    try {
      const response =
        await api.patch(
          "/profile",
          {
            name: name.trim(),
            bio: bio.trim()
          }
        );


      setUser(
        response.data.user
      );


      setName(
        response.data.user.name
      );


      setBio(
        response.data.user.bio
      );


      setMessage(
        "Профиль сохранён"
      );
    } catch (error) {
      setError(
        getError(error)
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="profile-page">

      <header className="topbar">

        <strong>
          🔐 Fullstack Auth
        </strong>


        <button
          className="logout-button"
          onClick={logout}
        >
          Выйти
        </button>

      </header>


      <main className="profile-card">

        <div className="avatar">
          {user.name
            .charAt(0)
            .toUpperCase()}
        </div>


        <h1>
          Профиль
        </h1>


        <p className="profile-email">
          {user.email}
        </p>


        <form
          onSubmit={saveProfile}
        >

          <label>
            Имя

            <input
              value={name}
              onChange={event =>
                setName(
                  event.target.value
                )
              }
              maxLength={50}
            />
          </label>


          <label>
            О себе

            <textarea
              value={bio}
              onChange={event =>
                setBio(
                  event.target.value
                )
              }
              maxLength={300}
              rows={5}
              placeholder="Расскажите немного о себе"
            />
          </label>


          <div className="counter">
            {bio.length}/300
          </div>


          {error && (
            <div className="alert error">
              {error}
            </div>
          )}


          {message && (
            <div className="alert success">
              {message}
            </div>
          )}


          <button
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Сохраняем..."
              : "Сохранить изменения"}
          </button>

        </form>

      </main>

    </div>
  );
}


export default App;