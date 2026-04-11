import z from "zod";

export const TLXMetricType = z.object({
    id_usuario: z.uuid(),
    demanda_fisica: z.number().min(0),
    demanda_mental: z.number().min(0),
    demanda_temporal: z.number().min(0),
    esfuerzo: z.number().min(0),
    frustracion: z.number().min(0)
})