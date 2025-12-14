import { useEffect, useState } from 'react';

import { useParams, Link } from 'react-router-dom';

import { Button, Alert } from '@mui/material';

import { ArrowLeft } from 'lucide-react';

import { useGoodsReceiptStore, useBreadcrumbStore } from '@stores/index.js';

import GoodsReceiptInfoCard from '@components/goods-receipt/GoodsReceiptInfoCard.jsx';
import GoodsReceiptItemsTable from '@components/goods-receipt/GoodsReceiptItemsTable.jsx';

const GoodsReceiptDetail = () => {
    const { code } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getGoodsReceiptDetails = useGoodsReceiptStore(state => state.getGoodsReceiptDetails);
    const goodsReceiptDetails = useGoodsReceiptStore(state => state.goodsReceiptDetails);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!code) return;

            try {
                const decodedCode = decodeURIComponent(code);
                setBreadcrumbs([
                    { to: '/goods-receipts', label: 'Penerimaan Barang' },
                    decodedCode
                ]);
                const params = {
                    code: decodedCode
                }
                await getGoodsReceiptDetails({ params }, { useLoader: true });
            } catch (err) {
                setError(err.message || 'Gagal memuat detail penerimaan barang');
            }
        };

        fetchDetails();
    }, [code, setBreadcrumbs, getGoodsReceiptDetails]);

    if (error) {
        return (
            <div className="p-4">
                <Alert severity="error">{ error }</Alert>
                <Button
                    component={ Link }
                    to="/goods-receipts"
                    startIcon={ <ArrowLeft /> }
                    className="mt-4"
                >
                    Kembali ke Daftar
                </Button>
            </div>
        );
    }

    return (
        <div className="goods-receipt-detail space-y-6 pb-8">
            <div className="flex justify-between items-center print:hidden">
                <Button
                    component={ Link }
                    to="/goods-receipts"
                    startIcon={ <ArrowLeft /> }
                    variant="text"
                    color="inherit"
                >
                    Kembali
                </Button>
            </div>

            <GoodsReceiptInfoCard receipt={ goodsReceiptDetails } />

            <GoodsReceiptItemsTable goodsReceiptItems={ goodsReceiptDetails?.items } />
        </div>
    );
};

export default GoodsReceiptDetail;
