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
import { CreateUserSettingsUseCase } from './Contexts/API/Users/Application/CreateUserSettings.js';
import { SearchUserSettingsUseCase } from './Contexts/API/Users/Application/SearchUserSettings.js';
import { UpdateUserSettingsUseCase } from './Contexts/API/Users/Application/UpdateUserSettings.js';
import { DeleteUserSettingsUseCase } from './Contexts/API/Users/Application/DeleteUserSettings.js';
import { AuthController } from './Contexts/API/Users/Infrastructure/Controllers/AuthController.js';
import { UserSettingsController } from './Contexts/API/Users/Infrastructure/Controllers/UserSettingsController.js';
import { MySqlUserRepository } from './Contexts/API/Users/Infrastructure/Persistence/MySqlUserRepository.js';
import { MySqlUserSettingsRepository } from './Contexts/API/Users/Infrastructure/Persistence/MySqlUserSettingsRepository.js';
import { AuthMiddleware } from './Shared/Infrastructure/Middleware/AuthMiddleware.js';

export const createApp = (): Express => {
  const app = express();
  
  // Middleware de autenticación
  const authMiddleware = new AuthMiddleware();
  
  // Repositorios
  const activityRepository = new MySqlActivityRepository();
  const userRepository = new MySqlUserRepository();
  const userSettingsRepository = new MySqlUserSettingsRepository();
  
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

  // Casos de uso de ajustes de usuario
  const createUserSettingsUseCase = new CreateUserSettingsUseCase(userSettingsRepository);
  const searchUserSettingsUseCase = new SearchUserSettingsUseCase(userSettingsRepository);
  const updateUserSettingsUseCase = new UpdateUserSettingsUseCase(userSettingsRepository);
  const deleteUserSettingsUseCase = new DeleteUserSettingsUseCase(userSettingsRepository);
  const userSettingsController = new UserSettingsController(
    createUserSettingsUseCase,
    searchUserSettingsUseCase,
    updateUserSettingsUseCase,
    deleteUserSettingsUseCase
  );

  const runProtected = (req: Request, res: Response, action: () => void): void => {
    void authMiddleware.authenticate(req, res, action);
  };

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

  // Rutas de usuarios - Públicas
  app.post('/api/auth/register', (req: Request, res: Response) => {
    void authController.register(req, res);
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    void authController.login(req, res);
  });

  // Rutas de usuarios - Protegidas con JWT
  app.get('/api/users/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void authController.getProfile(req, res);
    });
  });

  app.put('/api/users/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void authController.update(req, res);
    });
  });

  app.delete('/api/users/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void authController.delete(req, res);
    });
  });

  // Rutas de ajustes de usuario - Protegidas con JWT
  app.post('/api/users/:userId/settings', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void userSettingsController.create(req, res);
    });
  });

  app.get('/api/users/:userId/settings', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void userSettingsController.getByUserId(req, res);
    });
  });

  app.put('/api/users/:userId/settings', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void userSettingsController.update(req, res);
    });
  });

  app.delete('/api/users/:userId/settings', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void userSettingsController.delete(req, res);
    });
  });

  // Integración Google Calendar - protegidas (JWT o Clerk)
  app.get('/api/integrations/google/connect', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void authController.googleConnect(req, res);
    });
  });

  app.get('/api/integrations/google/callback', (req: Request, res: Response) => {
    void authController.googleCallback(req, res);
  });

  app.post('/api/integrations/google/sync', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void authController.googleSync(req, res);
    });
  });

  app.get('/api/integrations/google/status', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void authController.googleStatus(req, res);
    });
  });

  app.delete('/api/integrations/google/disconnect', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void authController.googleDisconnect(req, res);
    });
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
