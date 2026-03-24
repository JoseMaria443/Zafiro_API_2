import type { Request, Response } from 'express';

export class AlgoritmoController {
  public async procesarDatos(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization;

      if (!token) {
        res.status(401).json({ error: 'Falta el JWT en la cabecera' });
        return;
      }

      const urlAlgoritmo = process.env.ALGORITMO_API;

      if (!urlAlgoritmo) {
        res.status(500).json({ error: 'Variable ALGORITMO_API no configurada' });
        return;
      }

      const respuestaAlgoritmo = await fetch(`${urlAlgoritmo}/api/endpoint-deseado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(req.body),
      });

      if (!respuestaAlgoritmo.ok) {
        let errorDelAlgoritmo;
        try {
          errorDelAlgoritmo = await respuestaAlgoritmo.json();
        } catch {
          errorDelAlgoritmo = { error: 'Error desconocido del algoritmo' };
        }
        res.status(respuestaAlgoritmo.status).json(errorDelAlgoritmo);
        return;
      }

      const datosFinalesProcesados = await respuestaAlgoritmo.json();

      res.status(200).json({
        success: true,
        data: datosFinalesProcesados,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al comunicarse con el algoritmo' });
    }
  }
}
