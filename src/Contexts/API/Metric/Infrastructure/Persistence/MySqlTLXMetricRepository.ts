import { PostgresConnection } from "../../../../../Shared/Infrastructure/Database/PostgresConnection.js";
import { TLXMetric } from "../../Domain/TLXMetric.js";
import TLXMetricRepository from "../../Domain/TLXMetricRepository.js";

export class MySqlTLXMetricRepository implements TLXMetricRepository {
    private db = PostgresConnection.getInstance()

    async add(data: TLXMetric): Promise<void> {
        await this.db.query(`
            INSERT INTO metricas_hipotesis_usuarios (id_usuario, demanda_fisica, demanda_mental, demanda_temporal, esfuerzo, frustracion) VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [data.id_usuario, data.demanda_fisica, data.demanda_mental, data.demanda_temporal, data.esfuerzo, data.frustracion]
        )
    }
}