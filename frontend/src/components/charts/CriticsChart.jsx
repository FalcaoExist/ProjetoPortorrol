import { Bar, BarChart, Tooltip, XAxis, YAxis, ResponsiveContainer, Label, CartesianGrid, ReferenceLine } from 'recharts';
import { useNavigate } from 'react-router-dom';



const margin = {
    top: 20,
    right: 30,
    left: 20,
    bottom: 5,
};
// #endregion

function getIntroOfPage(label) {
    return `${label} — detalhes e métricas.`;
}

function CustomTooltip({ payload, label, active }) {
    if (active && payload && payload.length) {
        return (
            <div className="border border-[#d88488] bg-white p-[10px] rounded-[5px] shadow-[1px_1px_2px_rgba(216,132,136,1)]">
                <p className="m-0 font-bold">{`${label} : ${payload[0].value}`}</p>
                <p className="m-0">{getIntroOfPage(label)}</p>
                <p className="m-0 border-t border-dashed border-[#f5f5f5] pt-2">Anything you want can be displayed here.</p>
            </div>
        );
    }

    return null;
}

export default function CriticsChart({ data, asc = true, branch, supplier }) {
    const navigate = useNavigate();
    const sortedData = [...data].sort((a, b) => asc ? a.qtd - b.qtd : b.qtd - a.qtd);

    const handleNavigation = (name) => {
        if (!name) return;
        const params = new URLSearchParams();
        params.set('sku', name);
        if (supplier && supplier !== 'Todos') params.set('supplier', supplier);
        if (branch && branch !== 'Todos') params.set('branch', branch);
        navigate(`/stock?${params.toString()}`);
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedData} margin={margin} onClick={(e) => handleNavigation(e?.activeLabel)}>
                <XAxis  dataKey="name"  interval={0}  height={60}  tick={{ angle: -45, textAnchor: 'end', cursor: 'pointer' }}  onClick={(e) => handleNavigation(e?.value)} />
                <Label value="Dias de cobertura" angle={-90} position="left" dx={-40} style={{ textAnchor: 'middle' }} />
                <YAxis ticks={[0, 20, 40, 60, 80]} domain={[0, 100]} />
                <CartesianGrid stroke="#e6e6e6" horizontal={true} vertical={false} />
                {/* Linha horizontal personalizada (ex: meta em 60) - lisa e atrás das barras */}
                <ReferenceLine y={60} stroke="#d88488" strokeWidth={1} isFront={false} label={{ value: '', position: 'right', fill: '#E75656' }} />
                <Tooltip content={CustomTooltip} />
                <Bar dataKey="qtd" fill="#212560" barSize={25} onClick={(data) => handleNavigation(data?.name)} />            
            </BarChart>
        </ResponsiveContainer>

    );
}