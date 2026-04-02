import type { Request, Response } from 'express';
import { isValidJWT } from 'zod/v4/core';

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

      const datosFinalesProcesados:string = await respuestaAlgoritmo.json();
      if (!isValidJWT(datosFinalesProcesados)){
        res.status(500).json({
          success:false,
          message:'Ocurrió un error al obtener la respuesta del algoritmo'
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Resultados enviados',
        data: datosFinalesProcesados
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
