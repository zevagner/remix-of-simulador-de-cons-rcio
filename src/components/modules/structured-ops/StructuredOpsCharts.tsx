import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { formatCurrency } from '@/core/finance';
import { BID_COLORS, COST_COLORS } from './structuredOpsConstants';

interface ChartDataItem {
  name: string;
  value: number;
  percent?: number;
  color?: string;
}

interface Props {
  bidChartData: ChartDataItem[];
  costChartData: ChartDataItem[];
  installmentChartData: ChartDataItem[];
}

export function StructuredOpsCharts({ bidChartData, costChartData, installmentChartData }: Props) {
  const singleBidSlice = bidChartData.length === 1 ? bidChartData[0] : null;
  return (
    <div id="structured-ops-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
      {/* Composição dos Lances */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Composição dos Lances</CardTitle></CardHeader>
        <CardContent>
          {singleBidSlice ? (
            <div className="h-[250px] flex flex-col items-center justify-center text-center px-4 gap-2">
              <p className="text-sm text-muted-foreground">
                {singleBidSlice.name === 'Lance Próprio' ? 'Lance inteiramente próprio' : 'Lance inteiramente embutido'}
              </p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(singleBidSlice.value)}</p>
            </div>
          ) : bidChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart style={{ background: "transparent" }}>
                <Pie
                  data={bidChartData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent ?? 0).toFixed(0)}%`}
                  outerRadius={80} fill="#8884d8" dataKey="value"
                >
                  {bidChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BID_COLORS[index % BID_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhum lance configurado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composição dos Custos */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Composição dos Custos</CardTitle></CardHeader>
        <CardContent>
          {costChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart style={{ background: "transparent" }}>
                <Pie
                  data={costChartData} cx="50%" cy="50%" labelLine={false}
                  label={({ value }) => `${((value / costChartData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%`}
                  outerRadius={80} fill="#8884d8" dataKey="value"
                >
                  {costChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COST_COLORS[index % COST_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhum custo configurado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparação de Parcelas — só faz sentido quando há diferença real */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Comparação de Parcelas</CardTitle></CardHeader>
        <CardContent>
          {installmentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart style={{ background: "transparent" }} data={installmentChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />

                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {installmentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="value" position="right"
                    formatter={(value: number) => formatCurrency(value)}
                    style={{ fontSize: 11, fill: '#000' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              Sem lance configurado — parcela inicial e pós‑contemplação são idênticas.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
