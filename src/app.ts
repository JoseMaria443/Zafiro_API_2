import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import { CreateActivityUseCase } from './Contexts/API/Activities/Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from './Contexts/API/Activities/Application/SearchUserActivities.js';
import { ActivityPostController } from './Contexts/API/Activities/Infrastructure/Controllers/ActivityPostController.js';
import { MySqlActivityRepository } from './Contexts/API/Activities/Infrastructure/Persistence/MySqlActivityRepository.js';

export const createApp = (): Express => {
  const app = express();
  const activityRepository = new MySqlActivityRepository();
  const createActivityUseCase = new CreateActivityUseCase(activityRepository);
  const searchUserActivitiesUseCase = new SearchUserActivitiesUseCase(activityRepository);
  const activityController = new ActivityPostController(
    createActivityUseCase,
    searchUserActivitiesUseCase
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'API is running' });
  });

  app.post('/api/calendar/activities', (req: Request, res: Response) => {
    void activityController.create(req, res);
  });

  app.get('/api/calendar/activities/user/:userId', (req: Request, res: Response) => {
    void activityController.getUserActivities(req, res);
  });

  app.get('/api/calendar/activities/user/:userId/date/:date', (req: Request, res: Response) => {
    void activityController.getUserActivitiesByDate(req, res);
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
