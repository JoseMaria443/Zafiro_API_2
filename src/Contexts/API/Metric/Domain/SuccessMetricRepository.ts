import SuccessMetric from "./SuccessMetric.js";

export default interface SuccessMetricRepository {
    add(data: boolean): Promise<void>
}