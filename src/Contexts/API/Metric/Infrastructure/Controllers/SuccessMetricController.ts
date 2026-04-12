import type { Request, Response } from 'express';
import SuccessMetric from '../../Domain/SuccessMetric.js';
import SuccessMetricRepository from '../../Domain/SuccessMetricRepository.js';

export class MetricaAlgoritmoController {
  constructor(
    private repository: SuccessMetricRepository
  ) {}

  // Guardar una nueva métrica
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const { exito } = req.body
      if (exito === true || exito === false) {
        const response = await this.repository.add(exito)
        res.status(200).json({ message: 'Métrica de algoritmo guardada' });
      } else {
        res.status(400).json({ message: 'No se recibieron los datos correctamente' })
        return
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
      return
    }
  }
}
