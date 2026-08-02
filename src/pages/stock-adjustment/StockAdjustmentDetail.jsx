import { useEffect, useState } from 'react';

import { useParams, Link } from 'react-router-dom';

import { Button, Alert } from '@mui/material';

import { ArrowLeft } from 'lucide-react';

import { useStockAdjustmentStore, useBreadcrumbStore } from '@stores/index.js';

import StockAdjustmentInfoCard from '@components/stock-adjustment/StockAdjustmentInfoCard.jsx';
import StockAdjustmentItemsTable from '@components/stock-adjustment/StockAdjustmentItemsTable.jsx';

const StockAdjustmentDetail = () => {
    const { code } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const {
        stockAdjustmentDetails,
        getStockAdjustmentDetails
    } = useStockAdjustmentStore();

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!code) return;

            try {
                const decodedCode = decodeURIComponent(code);
                setBreadcrumbs([
                    { to: '/stock-adjustments', label: 'Penyesuaian Stok' },
                    decodedCode
                ]);

                const params = { code: decodedCode };
                await getStockAdjustmentDetails({ params }, { useLoader: true });
            } catch (err) {
                setError(err.message || 'Gagal memuat detail penyesuaian');
            }
        };

        fetchDetails();
    }, [code, setBreadcrumbs, getStockAdjustmentDetails]);

    if (error) {
        return (
            <div className="p-4">
                <Alert severity="error">{ error }</Alert>
                <Button
                    component={ Link }
                    to="/stock-adjustments"
                    startIcon={ <ArrowLeft /> }
                    className="mt-4"
                >
                    Kembali ke Daftar
                </Button>
            </div>
        );
    }

    return (
        <div className="stock-adjustment-detail space-y-6 pb-8">
            <div className="flex justify-between items-center print:hidden">
                <Button
                    component={ Link }
                    to="//stock-adjustments"
                    startIcon={ <ArrowLeft /> }
                    variant="text"
                    color="inherit"
                >
                    Kembali
                </Button>
            </div>

            <StockAdjustmentInfoCard adjustment={ stockAdjustmentDetails } />

            <StockAdjustmentItemsTable items={ stockAdjustmentDetails?.items } />
        </div>
    );
};

export default StockAdjustmentDetail;
