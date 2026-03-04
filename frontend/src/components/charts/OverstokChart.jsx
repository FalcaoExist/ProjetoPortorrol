import { Bar, BarChart, Tooltip, XAxis, YAxis, ResponsiveContainer, Label, CartesianGrid, ReferenceLine } from 'recharts';
import { useNavigate } from 'react-router-dom';
import BarChartSkeleton from './BarChartSkeleton';



const margin = {
    top: 20,
    right: 30,
    left: 20,
    bottom: 5,
};
// #endregion


function CustomTooltip({ payload, label, active }) {
    if (active && payload && payload.length) {
        return (
            <div className="border border-[#d88488] bg-white p-[10px] rounded-[5px] shadow-[1px_1px_2px_rgba(216,132,136,1)]">
                <p className="m-0 font-bold">{`${label} : ${payload[0].value} dias de cobertura`}</p>
                <p className="m-0 font-bold">{`Estoque total: ${payload[0].payload.estoque_atual}`}</p>
                <p className="m-0 font-bold">{`Demanda mensal: ${(parseFloat(payload[0].payload.demanda_mensal_media) || 0).toFixed(1)}`}</p>
                <p className="m-0 font-bold">{`Demanda diária: ${(parseFloat(payload[0].payload.demanda_diaria) || 0).toFixed(1)}`}</p>
                <p className="m-0 font-bold">{`Ranking Global: ${(payload[0].payload.ranking_global)}`}</p>
                <p className="m-0 font-bold">{`Ranking Fornecedor: ${(payload[0].payload.ranking_fornecedor)}`}</p>
            </div>
        );
    }

    return null;
}

export default function OverstokChart({
    data = [],
    branch,
    supplier,
    loading = false,
    emptyMessage = "Não foram encontrados SKUs em excesso para esse fornecedor.",
}) {
    const navigate = useNavigate();
    const hasData = Array.isArray(data) && data.length > 0;
    const sortedData = hasData ? [...data].sort((a, b) => b.qtd - a.qtd) : [];

    const handleNavigation = (name) => {
        if (!name) return;
        const params = new URLSearchParams();
        params.set('sku', name);
        if (supplier && supplier !== 'Todos') params.set('supplier', supplier);
        if (branch && branch !== 'Todos') params.set('branch', branch);
        navigate(`/stock?${params.toString()}`);
    };

      const CustomTick = ({ x, y, payload }) => (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" transform="rotate(-45)" 
            style={{ cursor: 'pointer', pointerEvents: 'all' }} 
            onClick={(e) => { e.stopPropagation(); payload && payload.value && handleNavigation(payload.value); }} 
            >
                {payload.value}
            </text>
        </g>
    );

    if (loading) {
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
        <ResponsiveContainer width="100%" height={300}>
             <BarChart data={sortedData} margin={margin} onClick={(e) => handleNavigation(e?.activeLabel)}>
                <XAxis dataKey="name"  interval={0}  height={120}  tick={<CustomTick />}/>
                <Label value="Dias de cobertura" angle={-90} position="left" dx={-55} style={{ textAnchor: 'middle' }} />
                <YAxis ticks={[100, 200, 300, 400, 500, 600]} domain={[100, 600]} />
                <CartesianGrid stroke="#e6e6e6" horizontal={true} vertical={false} />
                <Tooltip content={CustomTooltip} />
                <Bar dataKey="qtd" fill="#212560" barSize={25} onClick={(data) => handleNavigation(data?.name)} />
            </BarChart>
        </ResponsiveContainer>
        
    );
}