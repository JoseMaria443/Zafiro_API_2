import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import { CreateActivityUseCase } from './Contexts/API/Activities/Application/CreateActivity.js';
import { SearchUserActivitiesUseCase } from './Contexts/API/Activities/Application/SearchUserActivities.js';
import { ActivityPostController } from './Contexts/API/Activities/Infrastructure/Controllers/ActivityPostController.js';
import { MySqlActivityRepository } from './Contexts/API/Activities/Infrastructure/Persistence/MySqlActivityRepository.js';
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
import { CreateTagUseCase } from './Contexts/API/Tags/Application/CreateTag.js';
import { SearchTagsUseCase } from './Contexts/API/Tags/Application/SearchTags.js';
import { UpdateTagUseCase } from './Contexts/API/Tags/Application/UpdateTag.js';
import { DeleteTagUseCase } from './Contexts/API/Tags/Application/DeleteTag.js';
import { TagController } from './Contexts/API/Tags/Infrastructure/Controllers/TagController.js';
import { MySqlTagRepository } from './Contexts/API/Tags/Infrastructure/Persistence/MySqlTagRepository.js';
import { CreatePriorityUseCase } from './Contexts/API/Priorities/Application/CreatePriority.js';
import { SearchPrioritiesUseCase } from './Contexts/API/Priorities/Application/SearchPriorities.js';
import { UpdatePriorityUseCase } from './Contexts/API/Priorities/Application/UpdatePriority.js';
import { DeletePriorityUseCase } from './Contexts/API/Priorities/Application/DeletePriority.js';
import { PriorityController } from './Contexts/API/Priorities/Infrastructure/Controllers/PriorityController.js';
import { MySqlPriorityRepository } from './Contexts/API/Priorities/Infrastructure/Persistence/MySqlPriorityRepository.js';
import { AuthMiddleware } from './Shared/Infrastructure/Middleware/AuthMiddleware.js';
import { AlgoritmoController } from './Contexts/API/Activities/Infrastructure/Controllers/AlgoritmoController.js';

export const createApp = (): Express => {
  const app = express();

  const parseAllowedOrigins = (): string[] => {
    const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3001';
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  };

  const allowedOrigins = parseAllowedOrigins();
  
  // Middleware de autenticación
  const authMiddleware = new AuthMiddleware();
  
  // Repositorios
  const activityRepository = new MySqlActivityRepository();
  const userRepository = new MySqlUserRepository();
  const userSettingsRepository = new MySqlUserSettingsRepository();
  const tagRepository = new MySqlTagRepository();
  const priorityRepository = new MySqlPriorityRepository();
  
  // Casos de uso de actividades
  const createActivityUseCase = new CreateActivityUseCase(activityRepository);
  const searchUserActivitiesUseCase = new SearchUserActivitiesUseCase(activityRepository);
  const activityController = new ActivityPostController(
    createActivityUseCase,
    searchUserActivitiesUseCase,
    activityRepository
  );

  // Casos de uso de usuarios
  const loginUserUseCase = new LoginUserUseCase(userRepository);
  const getUserUseCase = new GetUserUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);
  const authController = new AuthController(
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

  // Casos de uso de etiquetas (tags)
  const createTagUseCase = new CreateTagUseCase(tagRepository);
  const searchTagsUseCase = new SearchTagsUseCase(tagRepository);
  const updateTagUseCase = new UpdateTagUseCase(tagRepository);
  const deleteTagUseCase = new DeleteTagUseCase(tagRepository);
  const tagController = new TagController(
    createTagUseCase,
    searchTagsUseCase,
    updateTagUseCase,
    deleteTagUseCase
  );

  // Casos de uso de prioridades
  const createPriorityUseCase = new CreatePriorityUseCase(priorityRepository);
  const searchPrioritiesUseCase = new SearchPrioritiesUseCase(priorityRepository);
  const updatePriorityUseCase = new UpdatePriorityUseCase(priorityRepository);
  const deletePriorityUseCase = new DeletePriorityUseCase(priorityRepository);
  const priorityController = new PriorityController(
    createPriorityUseCase,
    searchPrioritiesUseCase,
    updatePriorityUseCase,
    deletePriorityUseCase
  );

  const algorithmController = new AlgoritmoController()

  const runProtected = (req: Request, res: Response, action: () => void): void => {
    void authMiddleware.authenticate(req, res, action);
  };

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowOrigin =
      typeof origin === 'string' && allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0] || '*';

    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'API is running' });
  });

  // Rutas de actividades
  app.post('/api/activities', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.create(req, res);
    });
  });

  app.get('/api/activities/me', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.getMyActivities(req, res);
    });
  });

  app.get('/api/activities/me/range', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.getMyActivitiesByRange(req, res);
    });
  });

  app.get('/api/activities/user/:userId', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.getUserActivities(req, res);
    });
  });

  app.get('/api/activities/user/:userId/date/:date', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.getUserActivitiesByDate(req, res);
    });
  });

  app.get('/api/activities/:id', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.getById(req, res);
    });
  });

  app.patch('/api/activities/:id', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.update(req, res);
    });
  });

  app.delete('/api/activities/:id', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void activityController.delete(req, res);
    });
  });

  // Rutas de usuarios - Públicas
  app.post('/api/auth/session', (req: Request, res: Response) => {
    void authController.loginSession(req, res);
  });

  app.post('/api/auth/register/session', (req: Request, res: Response) => {
    void authController.registerSession(req, res);
  });

  // Rutas de usuarios - Protegidas con JWT
  app.get('/api/users/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void authController.getProfile(req, res);
    });
  });

  app.patch('/api/users/:id', (req: Request, res: Response, next: NextFunction) => {
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

  app.patch('/api/users/:userId/settings', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void userSettingsController.update(req, res);
    });
  });

  app.delete('/api/users/:userId/settings', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void userSettingsController.delete(req, res);
    });
  });

  // Rutas de etiquetas (Tags) - Protegidas con JWT
  app.post('/api/tags', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void tagController.create(req, res);
    });
  });

  app.get('/api/tags/user/:userId', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void tagController.getUserTags(req, res);
    });
  });

  app.get('/api/tags/me', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void tagController.getMyTags(req, res);
    });
  });

  app.get('/api/tags/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void tagController.getTagById(req, res);
    });
  });

  app.patch('/api/tags/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void tagController.update(req, res);
    });
  });

  app.delete('/api/tags/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void tagController.delete(req, res);
    });
  });

  // Rutas de prioridades - Protegidas con JWT
  app.post('/api/priorities', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void priorityController.create(req, res);
    });
  });

  app.get('/api/priorities/user/:userId', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void priorityController.getUserPriorities(req, res);
    });
  });

  app.get('/api/priorities/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void priorityController.getPriorityById(req, res);
    });
  });

  app.get('/api/priorities/activity/:activityId', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void priorityController.getPriorityByActivityId(req, res);
    });
  });

  app.patch('/api/priorities/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void priorityController.update(req, res);
    });
  });

  app.delete('/api/priorities/:id', (req: Request, res: Response, next: NextFunction) => {
    runProtected(req, res, () => {
      void priorityController.delete(req, res);
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

  app.get('/api/integrations/google/events', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void authController.googleEvents(req, res);
    });
  });

  app.delete('/api/integrations/google/disconnect', (req: Request, res: Response) => {
    runProtected(req, res, () => {
      void authController.googleDisconnect(req, res);
    });
  });

  app.post('/api/algorithm/health', (req: Request, res: Response) => {
    void algorithmController.healthCheck(res)
  })

  app.post('/api/algorithm/sort', (req: Request, res: Response) => {
    void algorithmController.procesarDatos(req, res)
  })

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
