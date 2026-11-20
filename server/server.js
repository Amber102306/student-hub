import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import professorRoutes from './routes/professorRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import classRoutes from './routes/classRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/grades', gradeRoutes);

app.use(notFound);
app.use(errorHandler);

await connectDB();
app.listen(process.env.PORT || 5000, () => console.log(`API running on port ${process.env.PORT || 5000}`));