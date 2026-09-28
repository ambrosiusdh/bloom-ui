import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import { LayoutDashboard, MapPinOff } from 'lucide-react';

export default function NotFound() {
    const headingRef = useRef(null);

    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    return (
        <section className="not-found" aria-labelledby="not-found-title">
            <div className="not-found__content">
                <MapPinOff className="not-found__icon" aria-hidden="true" />
                <h1 id="not-found-title" ref={ headingRef } tabIndex={ -1 }>
                    Halaman tidak ditemukan
                </h1>
                <p>
                    Alamat mungkin sudah berubah atau halaman tidak tersedia. Gunakan Dashboard untuk kembali ke area kerja yang aman.
                </p>
                <Button
                    className="not-found__action"
                    component={ Link }
                    to="/dashboard"
                    variant="contained"
                    startIcon={ <LayoutDashboard aria-hidden="true" /> }
                >
                    Kembali ke Dashboard
                </Button>
            </div>
        </section>
    );
}
