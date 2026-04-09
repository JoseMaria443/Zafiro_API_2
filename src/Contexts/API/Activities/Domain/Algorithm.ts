import z from "zod"

const DateRangeType = z.object({
    date: z.string().optional(),
    dateTime: z.string().optional(),
    timeZone: z.string().optional(),
})

const ReminderOverrideType = z.object({
    method: z.literal(['popup', 'email']),
    minutes: z.int().positive()
})

const ReminderType = z.object({
    useDefault: z.boolean().default(true),
    overrides: z.array(ReminderOverrideType).optional()
})

const TagType = z.object({
    etiqueta: z.int().positive(),
    color: z.string().min(7).max(7)
})

const ExtrasType = z.object({
    prioridad: z.literal(['alta', 'media', 'baja']),
    etiquetas: TagType
})

const AgendaType = z.object({
    id: z.string(),
    summary: z.string(),
    start: DateRangeType,
    end: DateRangeType,

    recurringEventId: z.string().optional(),
    originalStartTime: z.string().optional(),

    transparency: z.literal(['transparent', 'opaque']),
    reminders: ReminderType,

    extras: ExtrasType
})

export const AgendaArrayType = z.array(AgendaType)
export type AgendaArray = z.infer<typeof AgendaArrayType>

type Agenda = z.infer<typeof AgendaType>

export interface AlgorithmResponse {
    success: true
    status: string
    code: number
    tareas_agendadas: Agenda[]
    tareas_no_agendadas: Agenda[]
}

const ActivitiesType = z.object({
    defaultReminders: z.array(ReminderOverrideType),
    items: z.array(AgendaType)
})
type Activities = z.infer<typeof ActivitiesType>

const RangoTiempoType = z.object({
    inicio: z.string(),
    fin: z.string()
})

export const ConfigType = z.object({
    tiempo_descanso: RangoTiempoType,
    dias_contemplados: z.int().positive().min(3).max(15).default(7),
    gap: z.int().positive().default(15),
    long_first: z.boolean().default(false),
    tag: z.int().positive().optional()
})

export const AlgorithmRequestType = z.object({
    config: ConfigType,
    calendar: ActivitiesType
})

export type AlgorithmRequest = z.infer<typeof AlgorithmRequestType>

export type Config = z.infer<typeof ConfigType>