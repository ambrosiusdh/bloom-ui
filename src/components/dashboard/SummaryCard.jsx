import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const SummaryCard = ({ title, value, icon: Icon }) => {
    // Using tailwind classes for colors based on theme
    const iconBgColor = 'bg-maroon-600/10';
    const iconColor = 'text-maroon-600';

    return (
        <Card className="dashboard__summary-card h-full shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-maroon-600">
            <CardContent className="flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-full ${iconBgColor}`}>
                        <Icon size={24} className={iconColor} />
                    </div>
                </div>
                <div>
                    <Typography variant="h4" component="div" className="font-bold mb-1 text-gray-800">
                        {value}
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                        {title}
                    </Typography>
                </div>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;
