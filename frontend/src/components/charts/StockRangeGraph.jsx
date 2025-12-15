import React from 'react';
import './StockRangeGraph.css';

const SEGMENT_METADATA = {
  excesso: {
    label: 'Excesso',
    color: '#4a89f3', 
    orderBar: 1,      
    orderLegend: 4,   
  },
  rupturaIminente: {
    label: 'Ruptura iminente',
    color: '#e54c4c', 
    orderBar: 2,      
    orderLegend: 3,
  },
  subdimensionado: {
    label: 'Subdimensionado',
    color: '#ff9944', 
    orderBar: 3,
    orderLegend: 2,
  },
  ok: {
    label: 'Ok',
    color: '#e0e0e0', 
    orderBar: 4,
    orderLegend: 1,   
  },
};


const EXAMPLE_DATA = {
  excesso: 18,
  rupturaIminente: 32,
  subdimensionado: 25,
  ok: 55, // A soma dos valores deve ser 100
};


const StockRangeGraph = ({ data = EXAMPLE_DATA, totalItems }) => {

  const segments = Object.keys(data).map(key => ({
    key,
    value: data[key],
    ...SEGMENT_METADATA[key],
  }));

    const segmentsForBar = [...segments].sort((a, b) => a.orderBar - b.orderBar);
    const segmentsForLegend = [...segments].sort((a, b) => a.orderLegend - b.orderLegend);

  // detecta se os valores passados são percentuais (somando ~100) ou absolutos
  const valuesSum = Object.values(data).reduce((s, v) => s + Number(v || 0), 0);
  const valuesArePercent = Math.abs(valuesSum - 100) < 0.5;

  return (
    <div className="stock-range-container">
      <div className="stock-range-label">Estoque</div>
      
      <div className="range-bar">
        {segmentsForBar.map((segment, index, array) => {
          // calcula largura da barra: se os valores são absolutos, converte para % usando a soma
          const percentWidth = valuesArePercent ? Number(segment.value) : (Number(segment.value) / valuesSum) * 100;
          const style = {
            width: `${percentWidth}%`,
            backgroundColor: segment.color,
          };

          // aplica border-radius nos cantos extremos via estilo inline (única responsabilidade JS)
          if (index === 0) {
            style.borderTopLeftRadius = '12px';
            style.borderBottomLeftRadius = '12px';
          }
          if (index === array.length - 1) {
            style.borderTopRightRadius = '12px';
            style.borderBottomRightRadius = '12px';
          }

          let itemCount = null;
          let percentage = null;

          if (valuesArePercent) {
            percentage = Number(segment.value);
            if (totalItems) itemCount = Math.round((percentage / 100) * totalItems);
          } else {
            // valores absolutos
            itemCount = Number(segment.value);
            percentage = valuesSum > 0 ? (Number(segment.value) / valuesSum) * 100 : 0;
          }

          const pctText = `${Math.round(percentage)}%`;
          const labelText = segment.label.toLowerCase();

          const tooltipText = itemCount !== null
            ? `${pctText} - ${itemCount} itens em ${labelText}`
            : `${pctText} ${segment.label}`;

          return (
            <div
              key={segment.key}
              className="segment"
              style={style}
              role="img"
              aria-label={tooltipText}
            >
              <div className="segment-tooltip">{tooltipText}</div>
            </div>
          );
        })}
      </div>

      {/* A Legenda (renderizada na ordem correta) */}
      <div className="range-legend">
        {segmentsForLegend.map((segment) => (
          <div key={segment.key} className="legend-item">
            <span className="color-box" style={{ backgroundColor: segment.color }} />
            {segment.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockRangeGraph;
