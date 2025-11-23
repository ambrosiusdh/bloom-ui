import React from 'react';
import {
    Paper,
    Typography,
    Box
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const TopCategories = ({ data }) => {
    const COLORS = ['#A72828', '#D97706', '#2563EB', '#10B981', '#8B5CF6'];

    return (
        <Paper className="dashboard__top-categories p-6 rounded-xl shadow-md h-full flex flex-col">
            <div className="mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                    Kategori Terlaris
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                    Distribusi penjualan per kategori
                </Typography>
            </div>

            <div className="flex-grow min-h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Paper>
    );
};

export default TopCategories;
