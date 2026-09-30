import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="page-container">
      <div className="card">
        <h1>О приложении</h1>

        <p className="subtitle">
          Fullstack Authentication Service
        </p>

        <section className="about-section">
          <h2>Что это?</h2>

          <p>
            Это fullstack-приложение с системой регистрации,
            авторизации и управления пользовательским профилем.
          </p>
        </section>

        <section className="about-section">
          <h2>Возможности</h2>

          <ul>
            <li>Регистрация нового пользователя</li>
            <li>Авторизация по email и паролю</li>
            <li>JWT Access Token</li>
            <li>Автоматическое обновление Access Token</li>
            <li>Refresh Token в HttpOnly Cookie</li>
            <li>Защищённые страницы</li>
            <li>Редактирование профиля</li>
            <li>Валидация данных</li>
            <li>Обработка ошибок</li>
            <li>Logout и завершение сессии</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Технологии</h2>

          <div className="technology-list">
            <span>React</span>
            <span>React Router</span>
            <span>Axios</span>
            <span>Node.js</span>
            <span>Express</span>
            <span>JWT</span>
            <span>bcrypt</span>
          </div>
        </section>

        <Link to="/" className="button secondary-button">
          На главную
        </Link>
      </div>
    </div>
  );
}