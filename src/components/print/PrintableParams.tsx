interface PrintableParam {
  label: string;
  value: string;
}

interface PrintableParamsProps {
  title?: string;
  params: PrintableParam[];
  columns?: 2 | 3 | 4;
}

export function PrintableParams({ 
  title = "Parâmetros da Simulação", 
  params, 
  columns = 4 
}: PrintableParamsProps) {
  if (params.length === 0) return null;
  
  return (
    <div className="print-only print-params-block">
      {title && <h3 className="print-params-title">{title}</h3>}
      <div className={`print-params-grid print-params-cols-${columns}`}>
        {params.map((param, i) => (
          <div key={i} className="print-param-item">
            <span className="print-param-label">{param.label}</span>
            <span className="print-param-value">{param.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
