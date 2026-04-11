import { PostgresConnection } from "../../../../../Shared/Infrastructure/Database/PostgresConnection.js";
import SuccessMetric from "../../Domain/SuccessMetric.js";
import SuccessMetricRepository from "../../Domain/SuccessMetricRepository.js";

export class MySqlSuccessMetricRepository implements SuccessMetricRepository {
    private db = PostgresConnection.getInstance()

    async add(data: SuccessMetric): Promise<void> {
        await this.db.query(`
            INSERT INTO metrica_algoritmo (id_usuario, exito) VALUES ($1, $2)
            `,
            [data.id_usuario, data.exito]
        )
    }
}