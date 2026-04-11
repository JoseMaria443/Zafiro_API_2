import type { Request, Response } from 'express';

export class TLXMetricController {
    // Guardar una nueva métrica
    public async create(req: Request, res: Response): Promise<void> {
        // Aquí iría la lógica para guardar en la base de datos
        res.status(201).json({ message: 'Métrica guardada (mock)' });
    }
}
