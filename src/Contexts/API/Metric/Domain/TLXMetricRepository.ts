import { TLXMetric } from "./TLXMetric.js";

export default interface TLXMetricRepository {
    add(data: TLXMetric): Promise<void>
}