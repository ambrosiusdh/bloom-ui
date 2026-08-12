import React from 'react';
import {
    Paper,
    Typography
} from '@mui/material';
import PropTypes from 'prop-types';
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

            <div className="flex-grow min-w-0 min-h-[300px] w-full relative">
                { data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-gray-500">
                        <Typography>
                            Belum ada data kategori penjualan.
                        </Typography>
                    </div>
                ) : (
                    <>
                        <ul className="sr-only">
                            { data.map(category => (
                                <li key={ category.name }>
                                    { category.name }: { category.value }
                                </li>
                            )) }
                        </ul>
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={ 0 }
                    minHeight={ 300 }
                    initialDimension={ { width: 1, height: 300 } }
                >
                    <PieChart>
                        <Pie
                            data={ data }
                            cx="50%"
                            cy="50%"
                            innerRadius={ 60 }
                            outerRadius={ 80 }
                            paddingAngle={ 5 }
                            dataKey="value"
                        >
                            { data.map((entry, index) => (
                                <Cell key={ `cell-${index}` } fill={ COLORS[index % COLORS.length] } />
                            )) }
                        </Pie>
                        <Tooltip
                            contentStyle={ { borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={ 36 }
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
                    </>
                ) }
            </div>
        </Paper>
    );
};

TopCategories.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired
    })).isRequired
};

export default TopCategories;
