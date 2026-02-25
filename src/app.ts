import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'API is running' });
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada',
    });
  });

  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  );

  return app;
};
