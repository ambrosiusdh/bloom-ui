import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSaleStore, useBreadcrumbStore } from '@stores/index.js';
import { Button, Alert } from '@mui/material';
import { Printer, ArrowLeft } from 'lucide-react';
import SaleInfoCard from '@components/sale/SaleInfoCard';
import SaleItemsTable from '@components/sale/SaleItemsTable';

const SaleDetail = () => {
    const { code } = useParams();
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getSaleDetails = useSaleStore(state => state.getSaleDetails);
    const saleDetails = useSaleStore(state => state.saleDetails);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!code) return;

            try {
                // Decode the transaction code as it might be URL encoded
                const decodedCode = decodeURIComponent(code);
                setBreadcrumbs([{ to: '/sales', label: 'Riwayat Penjualan' }, decodedCode]);
                await getSaleDetails(decodedCode, { useLoader: true });
            } catch (err) {
                setError(err.message || 'Gagal memuat detail penjualan');
            }
        };

        fetchDetails();
    }, [code, setBreadcrumbs, getSaleDetails]);

    const handlePrint = () => {
        window.print();
    };

    if (error) {
        return (
            <div className="p-4">
                <Alert severity="error">{error}</Alert>
                <Button
                    component={Link}
                    to="/sales"
                    startIcon={<ArrowLeft />}
                    className="mt-4"
                >
                    Kembali ke Daftar
                </Button>
            </div>
        );
    }

    return (
        <div className="sale-detail space-y-6 pb-8">
            <div className="flex justify-between items-center print:hidden">
                <Button
                    component={Link}
                    to="/sales"
                    startIcon={<ArrowLeft />}
                    variant="text"
                    color="inherit"
                >
                    Kembali
                </Button>
                <Button
                    variant="contained"
                    startIcon={<Printer />}
                    onClick={handlePrint}
                >
                    Cetak Invoice
                </Button>
            </div>

            <SaleInfoCard sale={saleDetails} />

            <SaleItemsTable items={saleDetails?.saleItems} />
        </div>
    );
};

export default SaleDetail;