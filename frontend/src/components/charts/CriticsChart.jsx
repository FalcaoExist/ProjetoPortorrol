import { Bar, BarChart, Tooltip, XAxis, YAxis, ResponsiveContainer, Label, CartesianGrid, ReferenceLine } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import BarChartSkeleton from './BarChartSkeleton';
import dashboardService from '../../services/dashboardService';
import { logger } from '../../utils/logger';



const margin = {
    top: 20,
    right: 30,
    left: 20,
    bottom: 40,
};
// #endregion


function CustomTooltip({ payload, label, active }) {
    if (active && payload && payload.length) {
        const row = payload[0].payload || {};
        const supplierName = row.supplier_name || row.fornecedor || row.primary_supplier || row.suppliers?.name || "";
        const unidadesPendentes = Number(row.unidades_pendentes || row.pedidos_pendentes || 0);
        return (
            <div className="border border-[#d88488] bg-white p-[10px] rounded-[5px] shadow-[1px_1px_2px_rgba(216,132,136,1)]">
                <p className="m-0 font-bold">{`${label} : ${row.dias_cobertura} dias de cobertura`}</p>
                {supplierName && <p className="m-0 font-bold">{`Fornecedor: ${supplierName}`}</p>}
                <p className="m-0 font-bold">{`Estoque total: ${row.estoque_atual}`}</p>
                {unidadesPendentes > 0 && <p className="m-0 font-bold">{`🚚 Unidades pendentes: ${unidadesPendentes}`}</p>}
                <p className="m-0 font-bold">{`Demanda mensal: ${(parseFloat(row.demanda_mensal_media) || 0).toFixed(1)}`}</p>
                <p className="m-0 font-bold">{`Demanda diária: ${(parseFloat(row.demanda_diaria) || 0).toFixed(1)}`}</p>
                <p className="m-0 font-bold">{`Ranking Global: ${(row.ranking_global)}`}</p>
                <p className="m-0 font-bold">{`Ranking Fornecedor: ${(row.ranking_fornecedor)}`}</p>
                
            </div>
        );
    }

    return null;
}

export default function CriticsChart({
    data = [],
    asc = true,
    branch,
    supplier,
    loading = false,
    emptyMessage = "Não foram encontrados SKUs críticos para esse fornecedor.",
}) {
    const navigate = useNavigate();
    const [showOnlyWithoutPending, setShowOnlyWithoutPending] = useState(false);
    const [filteredCriticalData, setFilteredCriticalData] = useState([]);
    const [loadingFilteredCriticalData, setLoadingFilteredCriticalData] = useState(false);
    const sourceData = showOnlyWithoutPending ? filteredCriticalData : data;
    const hasData = Array.isArray(sourceData) && sourceData.length > 0;
    const isAllSuppliers = !supplier || supplier === "Todos";
    const rawChartData = hasData
        ? sourceData.map((row) => {
            const supplierName = row.supplier_name || row.fornecedor || row.primary_supplier || row.suppliers?.name || "";
            const unidadesPendentes = Number(row.unidades_pendentes || row.pedidos_pendentes || 0);
            const hasPendencia = unidadesPendentes > 0;
            const nomeProduto = row.nome_produto || row.name || row.item || "";
            const baseDisplayName = isAllSuppliers && supplierName ? `${nomeProduto} - ${supplierName}` : nomeProduto;
            return {
                ...row,
                nome_produto: nomeProduto,
                skuName: nomeProduto,
                displayName: baseDisplayName,
                displayNameWithIcon: hasPendencia
                    ? `🚚 ${baseDisplayName}`
                    : baseDisplayName,
                unidades_pendentes: unidadesPendentes,
            };
        })
        : [];

    const chartData = useMemo(() => rawChartData, [rawChartData]);

    useEffect(() => {
        let isMounted = true;

        const loadFilteredCriticalData = async () => {
            if (!showOnlyWithoutPending) return;

            setLoadingFilteredCriticalData(true);
            try {
                const response = await dashboardService.getCriticalItems(20, supplier, true);
                const safeList = Array.isArray(response) ? response : [];
                const mapped = safeList.map((item) => ({
                    name: item.codigo,
                    qtd: item.dias_cobertura,
                    dias: item.dias_cobertura,
                    demanda_real: item.demanda_mensal_media,
                    ...item,
                }));

                if (isMounted) {
                    setFilteredCriticalData(mapped);
                }
            } catch (error) {
                logger.error('Erro ao carregar SKUs críticos sem pendências:', error);
                if (isMounted) {
                    setFilteredCriticalData([]);
                }
            } finally {
                if (isMounted) {
                    setLoadingFilteredCriticalData(false);
                }
            }
        };

        loadFilteredCriticalData();

        return () => {
            isMounted = false;
        };
    }, [showOnlyWithoutPending, supplier]);

    const hasFilteredData = chartData.length > 0;

    const resolveSkuName = (value) => {
        if (!value) return "";
        const found = chartData.find((row) =>
            row.nome_produto === value ||
            row.skuName === value ||
            row.displayName === value ||
            row.displayNameWithIcon === value
        );
        return found?.nome_produto || found?.skuName || value;
    };

    const handleNavigation = (skuName) => {
        if (!skuName) return;
        const params = new URLSearchParams();
        params.set('sku', skuName);
        if (supplier && supplier !== 'Todos') params.set('supplier', supplier);
        if (branch && branch !== 'Todos') params.set('branch', branch);
        if (showOnlyWithoutPending) params.set('pendingUnits', 'zero');
        navigate(`/stock?${params.toString()}`);
    };

       const CustomTick = ({ x, y, payload }) => (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" transform="rotate(-45)" 
            style={{ cursor: 'pointer', pointerEvents: 'all' }} 
            onClick={(e) => {
                e.stopPropagation();
                const targetSku = resolveSkuName(payload?.payload?.nome_produto || payload?.payload?.skuName || payload?.value);
                if (targetSku) handleNavigation(targetSku);
            }} 
            >
                {payload.value}
            </text>
        </g>
    );

    if (loading || loadingFilteredCriticalData) {
        return <BarChartSkeleton />;
    }

    if (!hasData) {
        return (
            <div className="h-[300px] w-full px-16 py-4">
                <div className="h-full w-full rounded-lg border border-gray-100 bg-gray-50 p-4 flex items-center justify-center">
                    <p className="text-gray-500 font-poppins">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-end px-16 pb-2">
                <button
                    type="button"
                    onClick={() => setShowOnlyWithoutPending((prev) => !prev)}
                    className="px-3 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-100"
                >
                    {showOnlyWithoutPending ? "Mostrar todos" : "Somente sem pendências"}
                </button>
            </div>

            {!hasFilteredData ? (
                <div className="h-[300px] w-full px-16 py-4">
                    <div className="h-full w-full rounded-lg border border-gray-100 bg-gray-50 p-4 flex items-center justify-center">
                        <p className="text-gray-500 font-poppins">Nenhum SKU sem unidades pendentes para esse filtro.</p>
                    </div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={margin}
                        onClick={(e) => {
                            const targetSku = resolveSkuName(e?.activePayload?.[0]?.payload?.skuName || e?.activeLabel);
                            if (targetSku) handleNavigation(targetSku);
                        }}
                    >
                        <XAxis  dataKey="displayNameWithIcon"  interval={0}  height={90} tick={<CustomTick />}/>
                        <Label value="Dias de cobertura" angle={-90} position="left" dx={-40} style={{ textAnchor: 'middle' }} />
                        <YAxis ticks={[0, 20, 40, 60, 80]} domain={[0, 100]} />
                        <CartesianGrid stroke="#e6e6e6" horizontal={true} vertical={false} />
                        <ReferenceLine y={60} stroke="#d88488" strokeWidth={1} isFront={false} label={{ value: '', position: 'right', fill: '#E75656' }} />
                        <Tooltip content={CustomTooltip} />
                        <Bar dataKey="qtd" fill="#212560" barSize={25}
                            onClick={(entry) => {
                                const targetSku = resolveSkuName(entry?.nome_produto || entry?.skuName || entry?.displayName);
                                if (targetSku) handleNavigation(targetSku);
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>

    );
}