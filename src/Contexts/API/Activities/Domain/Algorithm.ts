import z from "zod"

interface DateDict {
    date?: string
    dateTime?: string
    timeZone?: string
}

interface ReminderOverride {
    method: 'popup' | 'email'
    minutes: number
}

interface ReminderDict {
    useDefault: boolean
    overrides?: ReminderOverride[]
}

interface EtiquetaDict {
    etiqueta: number
    color: string
}

interface ExtrasDict {
    prioridad: 'baja' | 'media' | 'alta'
    etiquetas: EtiquetaDict
}

interface Agenda {
    id: string
    summary: string
    start: DateDict
    end: DateDict

    recurringEventId?: string
    originalStartTime?: string

    transparency: 'transparent' | 'opaque'
    reminders: ReminderDict

    extras: ExtrasDict
}

export interface AlgorithmResponse {
    status: string
    code: number
    tareas_agendadas: Agenda[]
    tareas_no_agendadas: Agenda[]
}

export interface Activities {
    defaultReminders: ReminderOverride[]
    items: Agenda[]
}

export interface AlgorithmRequest {
    config: Config
    calendar: Activities
}

const RangoTiempoType = z.object({
    inicio: z.string(),
    fin: z.string()
})

export const ConfigType = z.object({
    tiempo_descanso: RangoTiempoType,
    dias_contemplados: z.int().positive().min(3).max(15).default(7),
    gap: z.int().positive().default(15),
    long_first: z.boolean().default(false)
})

const AlgorithmRequestType = z.object({
    config: ConfigType,
    calendar: z
})

export type Config = z.infer<typeof ConfigType>