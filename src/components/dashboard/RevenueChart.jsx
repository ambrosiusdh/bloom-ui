import React from 'react';
import {
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const RevenueChart = ({ data, filter, onFilterChange }) => {
    const primaryColor = '#A72828'; // maroon-600

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Dynamic Y-Axis Formatter
    const formatYAxis = (value) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}rb`;
        }
        return value;
    };

    return (
        <Paper className="dashboard__chart p-6 rounded-xl shadow-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Typography variant="h6" className="font-bold text-gray-800">
                        Grafik Pendapatan
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                        Tren pendapatan penjualan Anda
                    </Typography>
                </div>
                <FormControl size="small" className="w-40">
                    <InputLabel>Periode</InputLabel>
                    <Select
                        value={filter}
                        label="Periode"
                        onChange={onFilterChange}
                    >
                        <MenuItem value="week">7 Hari Terakhir</MenuItem>
                        <MenuItem value="month">Bulan Ini</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <div className="flex-grow min-h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={formatYAxis}
                        />
                        <Tooltip
                            formatter={(value) => [formatCurrency(value), 'Pendapatan']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={primaryColor}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Paper>
    );
};

export default RevenueChart;
