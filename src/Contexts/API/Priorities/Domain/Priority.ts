export type PriorityValue = 'baja' | 'media' | 'alta';

export class Priority {
  constructor(
    public readonly id: string,
    public readonly idActividad: string,
    public readonly valor: PriorityValue,
    public readonly color: string
  ) {}

  static toPrimitives(priority: Priority): any {
    return {
      id: priority.id,
      idActividad: priority.idActividad,
      valor: priority.valor,
      color: priority.color,
    };
  }
}
