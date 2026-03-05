import React, { useState, useRef } from 'react';
import { DEFAULT_SEGMENT_METADATA } from './segmentMetadata';
import { useNavigate } from 'react-router-dom';

export default function StockRangeGraph({ data, totalItems, segmentMetadata = DEFAULT_SEGMENT_METADATA, branch, supplier, loading = false }){
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', left: 0, top: 0, direction: 'top' });
  // Permite sobrescrever/estender o metadata via prop
  const mergedMetadata = { ...DEFAULT_SEGMENT_METADATA, ...segmentMetadata };

  const segments = Object.keys(data).map(key => ({
    key,
    value: data[key],
    ...mergedMetadata[key],
  }));

  const segmentsForBar = [...segments].sort((a, b) => a.orderBar - b.orderBar);
  const segmentsForLegend = [...segments].sort((a, b) => a.orderLegend - b.orderLegend);
  const overlapPx = 34; // distância de sobreposição entre segmentos

  // detecta se os valores passados são percentuais (somando ~100) ou absolutos
  const valuesSum = Object.values(data).reduce((s, v) => s + Number(v || 0), 0);
  const valuesArePercent = Math.abs(valuesSum - 100) < 0.5;
  const percentWidths = segmentsForBar.map((segment) => {
    const rawValue = Number(segment.value) || 0;
    if (valuesArePercent) return rawValue;
    return valuesSum > 0 ? (rawValue / valuesSum) * 100 : 0;
  });
  const visibleCount = percentWidths.filter((w) => w > 0).length;
  const totalOverlapPx = Math.max(visibleCount - 1, 0) * overlapPx;
  const prevVisibleIndex = [];
  let lastVisible = -1;
  percentWidths.forEach((w, i) => {
    prevVisibleIndex[i] = lastVisible;
    if (w > 0) lastVisible = i;
  });

  if (loading) {
    return (
      <div className="flex items-center p-5 bg-transparent w-full box-border animate-pulse">
        <div className="font-bold text-2xl text-[#333] whitespace-nowrap flex-none">Estoque</div>

        <div className="relative flex items-center w-full ml-5">
          <div className="flex flex-auto h-9 overflow-hidden w-full items-center rounded-full bg-gray-100">
            <div className="h-full w-full bg-gray-200 rounded-full" />
            
          </div>
        </div>

        <div className="flex flex-col gap-[8px] flex-none ml-6">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center p-5 bg-transparent w-full box-border">
      <div className="font-bold text-2xl text-[#333] whitespace-nowrap flex-none">Estoque</div>

      <div ref={containerRef} className="relative flex items-center w-full">
        <div className="flex flex-auto h-9 ml-5 overflow-hidden w-full items-center rounded-full">
        {segmentsForBar.map((segment, index, array) => {
          // calcula largura da barra: se os valores são absolutos, converte para % usando a soma
          const percentWidth = percentWidths[index];
          const extraPx = percentWidth > 0 ? (percentWidth / 100) * totalOverlapPx : 0;
          const style = {
            width: `calc(${percentWidth}% + ${extraPx}px)`,
            backgroundColor: segment.color,
            // zIndex faz com que os segmentos renderizados primeiro fiquem por cima
            zIndex: array.length - index,
            // aplica margem negativa para sobrepor o anterior (exceto o primeiro)
            marginLeft: index === 0 || prevVisibleIndex[index] === -1 ? '0px' : `-${overlapPx}px`,
          };

          let itemCount = null;
          let percentage = null;

          if (valuesArePercent) {
            percentage = Number(segment.value) || 0;
            if (totalItems) itemCount = Math.round((percentage / 100) * totalItems);
          } else {
            // valores absolutos
            itemCount = Number(segment.value) || 0;
            percentage = valuesSum > 0 ? (Number(segment.value) / valuesSum) * 100 : 0;
          }

          const pctText = `${Math.round(percentage)}%`;
          const labelText = segment.label?.toLowerCase() || segment.key;

          const tooltipText = itemCount !== null
            ? `${pctText} - ${itemCount} itens em ${labelText}`
            : `${pctText} ${segment.label || segment.key}`;

          return (
            <div
              key={segment.key}
              className="group h-full inline-block relative shadow-[inset_0_1px_0_rgba(0,0,0,0.06)] transition-all duration-500 ease-out rounded-full cursor-pointer"
              style={style}
              role="img"
              aria-label={tooltipText}
              onClick={() => {
                try {
                  const params = new URLSearchParams();
                  const statusValue = segment.label || segment.key;
                  params.set('status', statusValue);
                  if (supplier && supplier !== 'Todos') params.set('supplier', supplier);
                  if (branch && branch !== 'Todos') params.set('branch', branch);
                  navigate(`/stock?${params.toString()}`);
                } catch (err) {
                  window.location.href = '/stock';
                }
              }}
            
              onMouseEnter={(e) => {
                const segRect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                const left = segRect.left - containerRect.left + segRect.width / 2;
                const top = segRect.top - containerRect.top;
                setTooltip({ visible: true, text: tooltipText, left, top, direction: 'top' });
              }}
              onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
            >
            </div>
          );
        })}
        {tooltip.visible && (
          <div
            style={{
              left: tooltip.left,
              top: tooltip.top,
              transform: tooltip.direction === 'left' ? 'translate(-100%, -50%)' : 'translate(-50%, -100%)',
            }}
            className="absolute bg-[rgba(0,0,0,0.82)] text-white px-2 py-[6px] rounded-[6px] text-[0.85em] whitespace-nowrap z-50 pointer-events-none transition-opacity duration-150"
          >
            {tooltip.text}
          </div>
        )}
        
      </div>
      </div>

      <div className="flex flex-col gap-[5px] text-md flex-none ml-6 relative z-10">
        {segmentsForLegend.map((segment) => {
          let itemCount = null;
          let percentage = null;
          if (valuesArePercent) {
            percentage = Number(segment.value) || 0;
            if (totalItems) itemCount = Math.round((percentage / 100) * totalItems);
          } else {
            itemCount = Number(segment.value) || 0;
            percentage = valuesSum > 0 ? (Number(segment.value) / valuesSum) * 100 : 0;
          }
          const pctText = `${Math.round(percentage)}%`;
          const labelText = segment.label?.toLowerCase() || segment.key;
          const legendTooltip = itemCount !== null
            ? `${pctText} - ${itemCount} itens em ${labelText}`
            : `${pctText} ${segment.label || segment.key}`;

          return (
            <div
              key={segment.key}
              className="flex items-center text-[#555] whitespace-nowrap cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                const left = rect.left - containerRect.left; // align to left side of legend item
                const top = rect.top - containerRect.top + rect.height / 2;
                setTooltip({ visible: true, text: legendTooltip, left, top, direction: 'left' });
              }}
              onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
              onClick={() => {
                try {
                  const params = new URLSearchParams();
                  const statusValue = segment.label || segment.key;
                  params.set('status', statusValue);
                  if (supplier && supplier !== 'Todos') params.set('supplier', supplier);
                  if (branch && branch !== 'Todos') params.set('branch', branch);
                  navigate(`/stock?${params.toString()}`);
                } catch (err) {
                  window.location.href = '/stock';
                }
              }}
            >
              <span className="inline-block w-3 h-3 mr-2 rounded-[3px]" style={{ backgroundColor: segment.color }} />
              {segment.label || segment.key}
            </div>
          );
        })}
      </div>
    </div>
  );
}