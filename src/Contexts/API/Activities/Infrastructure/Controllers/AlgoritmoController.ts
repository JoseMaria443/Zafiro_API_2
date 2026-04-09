import type { Request, Response } from 'express';
import { jwtService } from '../../../../../Shared/Infrastructure/Security/jwtService.js';
import { AlgorithmRequest, AlgorithmRequestType, AlgorithmResponse } from '../../Domain/Algorithm.js';

export class AlgoritmoController {
    private jwt = new jwtService()
    
    public async procesarDatos(req: Request, res: Response): Promise<void> {
        try {
            const token = req.headers.authorization;
            const requestData: AlgorithmRequest = AlgorithmRequestType.parse(req.body)

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

            const requestDataEncoded = this.jwt.encodeData(requestData)
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

    // Método healthCheck eliminado por no tener funcionalidad requerida.
}
