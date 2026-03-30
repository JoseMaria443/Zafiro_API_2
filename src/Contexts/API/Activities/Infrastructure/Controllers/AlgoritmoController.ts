import type { Request, Response } from 'express';

export class AlgoritmoController {
  public async procesarDatos(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization;
      const payload = req.get("payload")

      if (!token) {
        res.status(401).json({ error: 'Falta el JWT en la cabecera' });
        return;
      }

      if (!payload){
        res.status(400).json({ error: 'No se enviaron las actividades' })
        return;
      }

      const urlAlgoritmo = process.env.ALGORITMO_API;

      if (!urlAlgoritmo) {
        res.status(500).json({ error: 'No se ha podido iniciar la conexión con la API del algoritmo' });
        return;
      }

      const respuestaAlgoritmo = await fetch(`${urlAlgoritmo}/api/sort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'payload': payload
        }
      });

      if (!respuestaAlgoritmo.ok) {
        let errorDelAlgoritmo;
        errorDelAlgoritmo = await respuestaAlgoritmo.json();
        res.status(respuestaAlgoritmo.status).json(errorDelAlgoritmo);
        return;
      }

      const datosFinalesProcesados = await respuestaAlgoritmo.json();

      // Convertir el objeto a string para el header (puedes ajustar el nombre del header)
      res.setHeader('X-Algoritmo-Result', encodeURIComponent(JSON.stringify(datosFinalesProcesados)));
      res.status(200).json({
        success: true,
        message: 'Resultado enviado en el header X-Algoritmo-Result',
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al comunicarse con el algoritmo' });
    }
  }

  public async healthCheck(res: Response):Promise<void> {
    const urlAlgoritmo = process.env.ALGORITMO_API;
    try {
      const response = await fetch(`${urlAlgoritmo}/api/health`)

      if (!response.ok) {
        let errorDelAlgoritmo;
        try {
          errorDelAlgoritmo = await response.json();
        } catch {
          errorDelAlgoritmo = { error: 'Error desconocido del algoritmo' };
        }
        res.status(response.status).json(errorDelAlgoritmo);
        return;
      }
      const datosFinales = await response.json();
      res.status(200).json({
        success: true,
        data: datosFinales
      })
    } catch (e) {
      res.status(500).json({ error:'Error al conectarse a la API' })
    }
  }
}
