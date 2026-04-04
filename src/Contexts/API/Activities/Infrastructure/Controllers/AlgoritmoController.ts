import type { Request, Response } from 'express';
import { jwtService } from '../../../../../Shared/Infrastructure/Security/jwtService.js';
import { Activities, AlgorithmRequest, AlgorithmResponse, Config, ConfigType } from '../../Domain/Algorithm.js';

export class AlgoritmoController {
  private jwt = new jwtService()
  
  public async procesarDatos(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization;
      const requestData = ConfigType.parse(req.body)

      const mockData: Activities = {
          "defaultReminders":[
              {
                  "method":"popup",
                  "minutes":15
              }
          ],
          "items":[
              {
                  "id":"ETIQUETA 1 MEDIA",
                  "summary":"tarea 1",
                  "start":{
                      "dateTime":"2026-03-23T08:30:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "end":{
                      "dateTime":"2026-03-23T10:00:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "transparency":"transparent",
                  "reminders":{
                      "useDefault":true
                  },
                  "extras":{
                      "prioridad":"media",
                      "etiquetas":{
                          "etiqueta":1,
                          "color":"#000000"
                      }
                  }
              },
              {
                  "id":"ETIQUETA 1 ALTA",
                  "summary":"tarea 2",
                  "start":{
                      "dateTime":"2026-03-23T11:00:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "end":{
                      "dateTime":"2026-03-23T12:00:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "transparency":"transparent",
                  "reminders":{
                      "useDefault":true
                  },
                  "extras":{
                      "prioridad":"alta",
                      "etiquetas":{
                          "etiqueta":1,
                          "color":"#000000"
                      }
                  }
              },
              {
                  "id":"ETIQUETA 1 BAJA DATE",
                  "summary":"tarea 3",
                  "start":{
                      "date":"2026-03-24"
                  },
                  "end":{
                      "date":"2026-03-25"
                  },
                  "transparency":"transparent",
                  "reminders":{
                      "useDefault":true
                  },
                  "extras":{
                      "prioridad":"baja",
                      "etiquetas":{
                          "etiqueta":1,
                          "color":"#000000"
                      }
                  }
              },
              {
                  "id":"OPAQUE DATE",
                  "summary":"tarea 4",
                  "start":{
                      "date":"2026-03-25"
                  },
                  "end":{
                      "date":"2026-03-26"
                  },
                  "transparency":"opaque",
                  "reminders":{
                      "useDefault":true
                  },
                  "extras":{
                      "prioridad":"baja",
                      "etiquetas":{
                          "etiqueta":1,
                          "color":"#000000"
                      }
                  }
              },
              {
                  "id":"OPAQUE DATETIME",
                  "summary":"tarea 5",
                  "start":{
                      "dateTime":"2026-03-22T14:00:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "end":{
                      "dateTime":"2026-03-22T18:00:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "transparency":"opaque",
                  "reminders":{
                      "useDefault":true
                  },
                  "extras":{
                      "prioridad":"baja",
                      "etiquetas":{
                          "etiqueta":1,
                          "color":"#000000"
                      }
                  }
              },
              {
                  "id":"ETIQUETA 1 BAJA DIA DISTINTO",
                  "summary":"tarea 6",
                  "start":{
                      "dateTime":"2026-03-26T12:00:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "end":{
                      "dateTime":"2026-03-26T18:00:00-10:00",
                      "timeZone":"America/Mexico_City"
                  },
                  "transparency":"transparent",
                  "reminders":{
                      "useDefault":true
                  },
                  "extras":{
                      "prioridad":"baja",
                      "etiquetas":{
                          "etiqueta":1,
                          "color":"#000000"
                      }
                  }
              }
          ]
      }

      if (!token) {
        res.status(401).json({ error: 'Falta el JWT en la cabecera' });
        return;
      }

      if (!requestData){
        res.status(400).json({ error: 'No se enviaron las actividades' })
        return;
      }

      const urlAlgoritmo = process.env.ALGORITMO_API;

      if (!urlAlgoritmo) {
        res.status(500).json({ error: 'No se ha podido iniciar la conexión con la API del algoritmo' });
        return;
      }

      const payload: AlgorithmRequest = {
        config: requestData,
        calendar: mockData
      }

      const requestDataEncoded = this.jwt.encodeData(payload)
      if (!requestDataEncoded){
        res.status(500).json({
          success:false,
          message:'Ocurrió un error al codificarlos datos.'
        })
        return
      }

      const respuestaAlgoritmo = await fetch(`${urlAlgoritmo}/api/sort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'payload': requestDataEncoded
        }
      });

      if (!respuestaAlgoritmo.ok) {
        const errorDelAlgoritmo = await respuestaAlgoritmo.json();
        res.status(respuestaAlgoritmo.status).json(errorDelAlgoritmo);
        return;
      }

      const data: string = await respuestaAlgoritmo.json();

      const decodedData = this.jwt.decodeData<AlgorithmResponse>(data)

      if (!decodedData){
        res.status(500).json({
          success:false,
          message:'Ocurrió un error al obtener la respuesta del algoritmo.'
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Resultados enviados',
        data: decodedData
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
