import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { generateToken } from './jwt.js';
import { authMiddleware } from './authMiddleware.js';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

const users = [];

app.get('/', (req, res) => {
  res.json({
    message: 'Auth API работает!',
  });
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email и пароль обязательны',
      });
    }

    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      return res.status(409).json({
        message: 'Пользователь уже существует',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword,
    };

    users.push(user);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Ошибка сервера',
    });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email и пароль обязательны',
      });
    }

    const user = users.find((user) => user.email === email);

    if (!user) {
      return res.status(401).json({
        message: 'Неверный email или пароль',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Неверный email или пароль',
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.json({
      message: 'Вход выполнен успешно',
      token,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Ошибка сервера',
    });
  }
});

app.get('/profile', authMiddleware, (req, res) => {
  res.json({
    message: 'Это защищённый профиль',
    user: req.user,
  });
});

export default app;