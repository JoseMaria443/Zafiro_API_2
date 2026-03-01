import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import { CreateActivityUseCase } from './Contexts/API/Activities/Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from './Contexts/API/Activities/Application/SearchUserActivities.js';
import { ActivityPostController } from './Contexts/API/Activities/Infrastructure/Controllers/ActivityPostController.js';
import { MySqlActivityRepository } from './Contexts/API/Activities/Infrastructure/Persistence/MySqlActivityRepository.js';
import { RegisterUserUseCase } from './Contexts/API/Users/Application/RegisterUser.js';
import { LoginUserUseCase } from './Contexts/API/Users/Application/LoginUser.js';
import { GetUserUseCase } from './Contexts/API/Users/Application/GetUser.js';
import { UpdateUserUseCase } from './Contexts/API/Users/Application/UpdateUser.js';
import { DeleteUserUseCase } from './Contexts/API/Users/Application/DeleteUser.js';
import { AuthController } from './Contexts/API/Users/Infrastructure/Controllers/AuthController.js';
import { MySqlUserRepository } from './Contexts/API/Users/Infrastructure/Persistence/MySqlUserRepository.js';

export const createApp = (): Express => {
  const app = express();
  
  // Repositorios
  const activityRepository = new MySqlActivityRepository();
  const userRepository = new MySqlUserRepository();
  
  // Casos de uso de actividades
  const createActivityUseCase = new CreateActivityUseCase(activityRepository);
  const searchUserActivitiesUseCase = new SearchUserActivitiesUseCase(activityRepository);
  const activityController = new ActivityPostController(
    createActivityUseCase,
    searchUserActivitiesUseCase
  );

  // Casos de uso de usuarios
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const loginUserUseCase = new LoginUserUseCase(userRepository);
  const getUserUseCase = new GetUserUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);
  const authController = new AuthController(
    registerUserUseCase,
    loginUserUseCase,
    getUserUseCase,
    updateUserUseCase,
    deleteUserUseCase
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'API is running' });
  });

  // Rutas de actividades
  app.post('/api/calendar/activities', (req: Request, res: Response) => {
    void activityController.create(req, res);
  });

  app.get('/api/calendar/activities/user/:userId', (req: Request, res: Response) => {
    void activityController.getUserActivities(req, res);
  });

  app.get('/api/calendar/activities/user/:userId/date/:date', (req: Request, res: Response) => {
    void activityController.getUserActivitiesByDate(req, res);
  });

  // Rutas de usuarios
  app.post('/api/auth/register', (req: Request, res: Response) => {
    void authController.register(req, res);
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    void authController.login(req, res);
  });

  app.get('/api/users/:id', (req: Request, res: Response) => {
    void authController.getProfile(req, res);
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    void authController.update(req, res);
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    void authController.delete(req, res);
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
