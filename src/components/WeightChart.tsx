import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "../i18n";
import { useUnit } from "../unit";

export interface WeightChartPoint {
  date: string;
  label: string;
  weightKg: number;
}

export interface WeightChartProps {
  data: WeightChartPoint[];
}

export default function WeightChart({ data }: WeightChartProps) {
  const { t } = useI18n();
  const { formatWeight, toDisplayWeight } = useUnit();
  if (data.length === 0) {
    return <p className="py-5 text-center text-sm text-muted">{t("noWeightChart")}</p>;
  }

  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          accessibilityLayer={false}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#8e8e93" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#8e8e93" }}
            width={36}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => toDisplayWeight(v).toFixed(1)}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? formatWeight(value) : String(value ?? ""),
              t("weight"),
            ]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
          />
          <Line
            type="natural"
            dataKey="weightKg"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
