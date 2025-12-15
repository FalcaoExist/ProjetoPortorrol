import { Bar, BarChart, Tooltip, XAxis, YAxis, ResponsiveContainer, Label, CartesianGrid, ReferenceLine } from 'recharts';

// #region Sample data (20 columns)
const data = [
    { name: 'Page A', qtd: 12, },
    { name: 'Page B', qtd: 25, },
    { name: 'Page C', qtd: 32, },
    { name: 'Page D', qtd: 35, },
    { name: 'Page E', qtd: 35, },
    { name: 'Page F', qtd: 35, },
    { name: 'Page G', qtd: 40, },
    { name: 'Page M', qtd: 52, },
    { name: 'Page H', qtd: 41, },
    { name: 'Page L', qtd: 50, },
    { name: 'Page I', qtd: 42, },
    { name: 'Page J', qtd: 44, },
    { name: 'Page K', qtd: 48, },
    { name: 'Page T', qtd: 70, },
    { name: 'Page N', qtd: 52, },
    { name: 'Page O', qtd: 55, },
    { name: 'Page P', qtd: 58, },
    { name: 'Page Q', qtd: 60, },
    { name: 'Page R', qtd: 63, },
    { name: 'Page S', qtd: 66, },
];

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
            <div
                className="custom-tooltip"
                style={{
                    border: '1px solid #d88488',
                    backgroundColor: '#fff',
                    padding: '10px',
                    borderRadius: '5px',
                    boxShadow: '1px 1px 2px #d88488',
                }}
            >
                <p className="label" style={{ margin: '0', fontWeight: '700' }}>{`${label} : ${payload[0].value}`}</p>
                <p className="intro" style={{ margin: '0' }}>
                    {getIntroOfPage(label)}
                </p>
                <p className="desc" style={{ margin: '0', borderTop: '1px dashed #f5f5f5' }}>
                    Anything you want can be displayed here.
                </p>
            </div>
        );
    }

    return null;
}

export default function CustomizeTooltipContent() {
    const sortedData = [...data].sort((a, b) => a.qtd - b.qtd);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedData} margin={margin}>
                <XAxis dataKey="name" interval={0} height={60} tick={{ angle: -45, textAnchor: 'end' }} />
                <Label value="Dias de cobertura" angle={-90} position="left" dx={-40} style={{ textAnchor: 'middle' }} />
                <YAxis ticks={[0, 20, 40, 60, 80]} domain={[0, 100]} />
                <CartesianGrid stroke="#e6e6e6" horizontal={true} vertical={false} />
                {/* Linha horizontal personalizada (ex: meta em 60) - lisa e atrás das barras */}
                <ReferenceLine y={60} stroke="#d88488" strokeWidth={1} isFront={false} label={{ value: '', position: 'right', fill: '#E75656' }} />
                <Tooltip content={CustomTooltip} />
                <Bar dataKey="qtd" fill="#212560" barSize={25} />
            </BarChart>
        </ResponsiveContainer>
    );
}