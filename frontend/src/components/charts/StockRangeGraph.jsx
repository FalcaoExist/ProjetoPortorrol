import React from 'react';

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

const StockRangeGraph = ({ data, totalItems }) => {

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
    <div className="flex items-center p-5 bg-transparent w-full box-border">
      <div className="font-bold text-[1.2em] text-[#333] whitespace-nowrap flex-none">Estoque</div>

      <div className="flex flex-auto h-9 ml-5 overflow-visible w-full items-center rounded-full">
        {segmentsForBar.map((segment, index, array) => {
          // calcula largura da barra: se os valores são absolutos, converte para % usando a soma
          const percentWidth = valuesArePercent ? Number(segment.value) : (Number(segment.value) / valuesSum) * 100;
          const overlapPx = 34; // distância de sobreposição entre segmentos
          const style = {
            width: `${percentWidth}%`,
            backgroundColor: segment.color,
            // zIndex faz com que os segmentos renderizados primeiro fiquem por cima
            zIndex: array.length - index,
            // aplica margem negativa para sobrepor o anterior (exceto o primeiro)
            marginLeft: index === 0 ? '0px' : `-${overlapPx}px`,
          };

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
              className="group h-full inline-block relative shadow-[inset_0_1px_0_rgba(0,0,0,0.06)] transition-all duration-500 ease-out rounded-full"
              style={style}
              role="img"
              aria-label={tooltipText}
            >
              <div className="absolute bottom-[calc(100%_+_8px)] left-1/2 -translate-x-1/2 bg-[rgba(0,0,0,0.82)] text-white px-2 py-[6px] rounded-[6px] text-[0.85em] whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-150 ease-in-out z-20 group-hover:opacity-100">
                {tooltipText}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-[5px] text-[0.9em]  flex-none">
        {segmentsForLegend.map((segment) => (
          <div key={segment.key} className="flex items-center text-[#555] whitespace-nowrap">
            <span className="inline-block w-3 h-3 mr-2 rounded-[3px]" style={{ backgroundColor: segment.color }} />
            {segment.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockRangeGraph;
