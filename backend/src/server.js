import dotenv from 'dotenv';

dotenv.config();

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend запущен: http://localhost:${PORT}`);
});