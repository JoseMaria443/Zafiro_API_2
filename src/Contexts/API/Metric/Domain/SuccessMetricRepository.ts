import SuccessMetric from "./SuccessMetric.js";

export default interface SuccessMetricRepository {
    add(data: SuccessMetric): Promise<void>
}