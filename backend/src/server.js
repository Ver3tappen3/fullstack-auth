import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import helmet from "helmet";

import { readDb, writeDb } from "./db.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "development_access_secret";

const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "development_refresh_secret";

const ACCESS_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

const REFRESH_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(
  express.json({
    limit: "20kb"
  })
);

app.use(cookieParser());

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio || "",
    createdAt: user.createdAt
  };
}


function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: "access"
    },
    ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN
    }
  );
}


function createRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: "refresh",
      jti: crypto.randomUUID()
    },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN
    }
  );
}


function setRefreshCookie(res, token) {
  res.cookie(
    "refreshToken",
    token,
    {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge:
        7 *
        24 *
        60 *
        60 *
        1000,
      path: "/"
    }
  );
}


function clearRefreshCookie(res) {
  res.clearCookie(
    "refreshToken",
    {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/"
    }
  );
}


function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}


function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 6
  );
}

function authMiddleware(req, res, next) {
  const header =
    req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Требуется авторизация"
    });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(
      token,
      ACCESS_SECRET
    );

    if (payload.type !== "access") {
      return res.status(401).json({
        message: "Недействительный токен"
      });
    }

    req.userId = payload.sub;

    next();
  } catch {
    return res.status(401).json({
      message:
        "Access token истёк или недействителен"
    });
  }
}

app.get("/", (req, res) => {
  res.json({
    message: "Fullstack Auth API",
    status: "ok"
  });
});

app.post("/register", async (req, res) => {
  const name =
    String(req.body.name || "").trim();

  const email =
    String(req.body.email || "")
      .trim()
      .toLowerCase();

  const password =
    String(req.body.password || "");


  if (name.length < 2) {
    return res.status(400).json({
      message:
        "Имя должно содержать минимум 2 символа"
    });
  }


  if (name.length > 50) {
    return res.status(400).json({
      message:
        "Имя не должно превышать 50 символов"
    });
  }


  if (!validateEmail(email)) {
    return res.status(400).json({
      message:
        "Введите корректный email"
    });
  }


  if (!validatePassword(password)) {
    return res.status(400).json({
      message:
        "Пароль должен содержать минимум 6 символов"
    });
  }


  const db = readDb();


  const existingUser =
    db.users.find(
      user => user.email === email
    );


  if (existingUser) {
    return res.status(409).json({
      message:
        "Пользователь с таким email уже существует"
    });
  }


  const passwordHash =
    await bcrypt.hash(password, 12);


  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    bio: "",
    createdAt:
      new Date().toISOString()
  };


  db.users.push(user);

  writeDb(db);


  return res.status(201).json({
    message:
      "Регистрация успешна",
    user:
      sanitizeUser(user)
  });
});

app.post("/login", async (req, res) => {
  const email =
    String(req.body.email || "")
      .trim()
      .toLowerCase();

  const password =
    String(req.body.password || "");

  if (
    !validateEmail(email) ||
    !password
  ) {
    return res.status(400).json({
      message:
        "Введите email и пароль"
    });
  }

  const db = readDb();

  const user =
    db.users.find(
      item => item.email === email
    );

  if (
    !user ||
    !(await bcrypt.compare(
      password,
      user.passwordHash
    ))
  ) {
    return res.status(401).json({
      message:
        "Неверный email или пароль"
    });
  }

  const accessToken =
    createAccessToken(user);

  const refreshToken =
    createRefreshToken(user);

  db.refreshTokens =
    db.refreshTokens.filter(
      item =>
        item.userId !== user.id
    );

  db.refreshTokens.push({
    token: refreshToken,
    userId: user.id,
    createdAt:
      new Date().toISOString()
  });

  writeDb(db);

  setRefreshCookie(
    res,
    refreshToken
  );

  return res.json({
    message:
      "Вход выполнен",
    accessToken,
    user:
      sanitizeUser(user)
  });
});

app.post("/refresh", (req, res) => {
  const refreshToken =
    req.cookies.refreshToken;


  if (!refreshToken) {
    return res.status(401).json({
      message:
        "Refresh token отсутствует"
    });
  }

  try {
    const payload =
      jwt.verify(
        refreshToken,
        REFRESH_SECRET
      );


    if (
      payload.type !== "refresh"
    ) {
      return res.status(401).json({
        message:
          "Недействительный refresh token"
      });
    }

    const db = readDb();

    const storedToken =
      db.refreshTokens.find(
        item =>
          item.token === refreshToken
      );

    if (!storedToken) {
      clearRefreshCookie(res);

      return res.status(401).json({
        message:
          "Сессия недействительна"
      });
    }

    const user =
      db.users.find(
        item =>
          item.id === payload.sub
      );


    if (!user) {
      clearRefreshCookie(res);

      return res.status(401).json({
        message:
          "Пользователь не найден"
      });
    }

    const newRefreshToken =
      createRefreshToken(user);

    const accessToken =
      createAccessToken(user);


    db.refreshTokens =
      db.refreshTokens.filter(
        item =>
          item.token !== refreshToken
      );


    db.refreshTokens.push({
      token: newRefreshToken,
      userId: user.id,
      createdAt:
        new Date().toISOString()
    });


    writeDb(db);


    setRefreshCookie(
      res,
      newRefreshToken
    );


    return res.json({
      accessToken,
      user:
        sanitizeUser(user)
    });
  } catch {
    clearRefreshCookie(res);

    return res.status(401).json({
      message:
        "Refresh token истёк или недействителен"
    });
  }
});

app.post("/logout", (req, res) => {
  const refreshToken =
    req.cookies.refreshToken;

  const db = readDb();


  if (refreshToken) {
    db.refreshTokens =
      db.refreshTokens.filter(
        item =>
          item.token !== refreshToken
      );

    writeDb(db);
  }


  clearRefreshCookie(res);


  return res.json({
    message:
      "Вы вышли из аккаунта"
  });
});

app.get(
  "/profile",
  authMiddleware,
  (req, res) => {
    const db = readDb();


    const user =
      db.users.find(
        item =>
          item.id === req.userId
      );


    if (!user) {
      return res.status(404).json({
        message:
          "Пользователь не найден"
      });
    }


    return res.json({
      user:
        sanitizeUser(user)
    });
  }
);

app.patch(
  "/profile",
  authMiddleware,
  (req, res) => {
    const name =
      String(req.body.name || "")
        .trim();

    const bio =
      String(req.body.bio || "")
        .trim();


    if (
      name.length < 2 ||
      name.length > 50
    ) {
      return res.status(400).json({
        message:
          "Имя должно содержать от 2 до 50 символов"
      });
    }


    if (bio.length > 300) {
      return res.status(400).json({
        message:
          "Описание не должно превышать 300 символов"
      });
    }


    const db = readDb();


    const user =
      db.users.find(
        item =>
          item.id === req.userId
      );


    if (!user) {
      return res.status(404).json({
        message:
          "Пользователь не найден"
      });
    }


    user.name = name;
    user.bio = bio;


    writeDb(db);


    return res.json({
      message:
        "Профиль обновлён",
      user:
        sanitizeUser(user)
    });
  }
);

app.use(
  (req, res) => {
    res.status(404).json({
      message:
        "Маршрут не найден"
    });
  }
);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Внутренняя ошибка сервера"
  });
});

app.listen(
  PORT,
  () => {
    console.log(
      `Auth backend запущен: http://localhost:${PORT}`
    );
  }
);