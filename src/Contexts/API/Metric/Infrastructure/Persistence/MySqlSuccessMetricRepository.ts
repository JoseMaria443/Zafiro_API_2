import { PostgresConnection } from "../../../../../Shared/Infrastructure/Database/PostgresConnection.js";
import SuccessMetric from "../../Domain/SuccessMetric.js";
import SuccessMetricRepository from "../../Domain/SuccessMetricRepository.js";

export class MySqlSuccessMetricRepository implements SuccessMetricRepository {
    private db = PostgresConnection.getInstance()

    async add(data: boolean): Promise<void> {
        await this.db.query(`
            INSERT INTO metrica_algoritmo (exito) VALUES ($1)
            `,
            [data]
        )
    }
}