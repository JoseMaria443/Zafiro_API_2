import type { Request, Response } from 'express';
export class MetricaAlgoritmoController {

  // Guardar una nueva métrica
  public async create(req: Request, res: Response): Promise<void> {
    
    res.status(200).json({ message: 'Métrica algoritmo guardada (mock)' });
  }
}
