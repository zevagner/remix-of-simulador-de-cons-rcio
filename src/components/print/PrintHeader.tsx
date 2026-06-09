interface PrintHeaderProps {
  moduleName: string;
  consortiumType?: string;
  summaryItems?: Array<{
    label: string;
    value: string;
  }>;
  conclusion?: string;
}

export function PrintHeader({ moduleName, consortiumType, summaryItems, conclusion }: PrintHeaderProps) {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="print-header">
      <div className="print-header-top">
        <div className="print-header-title">
          <h1>{moduleName}</h1>
          {consortiumType && <span className="print-consortium-type">{consortiumType}</span>}
        </div>
        <div className="print-header-meta">
          <span className="print-date">{currentDate} às {currentTime}</span>
        </div>
      </div>
      
      {summaryItems && summaryItems.length > 0 && (
        <div className="print-executive-summary">
          <h2>Resumo da Simulação</h2>
          <div className="print-summary-grid">
            {summaryItems.map((item, index) => (
              <div key={index} className="print-summary-item">
                <span className="print-summary-label">{item.label}</span>
                <span className="print-summary-value">{item.value}</span>
              </div>
            ))}
          </div>
          {conclusion && (
            <p className="print-conclusion">{conclusion}</p>
          )}
        </div>
      )}
    </div>
  );
}
