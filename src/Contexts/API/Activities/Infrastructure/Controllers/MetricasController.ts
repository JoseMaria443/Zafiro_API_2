import type { Request, Response } from 'express';

export class MetricasHipotesisUsuariosController {
  // Guardar una nueva métrica
  public async create(req: Request, res: Response): Promise<void> {
    // Aquí iría la lógica para guardar en la base de datos
    res.status(201).json({ message: 'Métrica guardada (mock)' });
  }

  // Obtener métricas de un usuario
  public async getByUser(req: Request, res: Response): Promise<void> {
    // Aquí iría la lógica para obtener de la base de datos
    res.status(200).json({ message: 'Métricas obtenidas (mock)' });
  }
}

export class MetricaAlgoritmoController {
  // Guardar una nueva métrica
  public async create(req: Request, res: Response): Promise<void> {
    // Aquí iría la lógica para guardar en la base de datos
    res.status(201).json({ message: 'Métrica algoritmo guardada (mock)' });
  }

  // Obtener métricas de un usuario
  public async getByUser(req: Request, res: Response): Promise<void> {
    // Aquí iría la lógica para obtener de la base de datos
    res.status(200).json({ message: 'Métricas algoritmo obtenidas (mock)' });
  }
}
