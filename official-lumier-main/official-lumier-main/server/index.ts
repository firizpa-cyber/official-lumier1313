import express from 'express';
import cors from 'cors';
import proxyRouter from './routes/proxy.js';
import liveRouter from './routes/live.js';
import channelsRouter from './routes/channels.js';
import contentRouter from './routes/content.js';
import corsProxyRouter from './routes/cors-proxy.js';
import authRouter from './routes/auth.js';
import profilesRouter from './routes/profiles.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/proxy', proxyRouter);
app.use('/api/live', liveRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/content', contentRouter);
app.use('/api/cors-proxy', corsProxyRouter);
app.use('/api/auth', authRouter);
app.use('/api/profiles', profilesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
