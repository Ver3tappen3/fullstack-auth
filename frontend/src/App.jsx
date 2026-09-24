import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000';

function App() {
  const [mode, setMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      getProfile();
    }
  }, []);

  async function getProfile() {
    const savedToken = localStorage.getItem('token');

    if (!savedToken) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        localStorage.removeItem('token');
        setProfile(null);
        return;
      }

      setProfile(data.user);
    } catch (error) {
      setMessage('Не удалось подключиться к серверу');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/login' : '/register';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Произошла ошибка');
        return;
      }

      if (mode === 'register') {
        setMessage('Регистрация успешна! Теперь войдите.');
        setMode('login');
        setPassword('');
      } else {
        localStorage.setItem('token', data.token);
        setMessage('Вход выполнен успешно!');
        setPassword('');
        await getProfile();
      }
    } catch (error) {
      setMessage('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setProfile(null);
    setEmail('');
    setPassword('');
    setMessage('Вы вышли из аккаунта');
  }

  if (profile) {
    return (
      <div className="app">
        <div className="card">
          <h1>Fullstack Auth</h1>

          <div className="success">
            Вы авторизованы
          </div>

          <h2>Профиль</h2>

          <div className="profile">
            <p>
              <strong>ID:</strong> {profile.id}
            </p>

            <p>
              <strong>Email:</strong> {profile.email}
            </p>
          </div>

          <button onClick={logout}>
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="card">
        <h1>Fullstack Auth</h1>

        <p className="subtitle">
          JWT авторизация
        </p>

        <div className="tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setMessage('');
            }}
          >
            Вход
          </button>

          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setMessage('');
            }}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="test@mail.com"
            required
          />

          <label>Пароль</label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? 'Загрузка...'
              : mode === 'login'
                ? 'Войти'
                : 'Зарегистрироваться'}
          </button>
        </form>

        {message && (
          <p className="message">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;