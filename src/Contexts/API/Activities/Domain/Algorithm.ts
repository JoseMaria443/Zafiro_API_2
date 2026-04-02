interface RangoTiempo {
    inicio: string
    fin: string
}

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