import { useEffect, useState } from "react";
import { Alert, TextField } from "@mui/material";

export function ItemCreate() {
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {

    }, []);

    return (
        <div className="item-create">
            <div className="item-create__header mb-4">
                <h2 className="item-create__header-title font-bold text-2xl">
                    Data Barang - Buat baru
                </h2>
            </div>

            <form className="item-create__form rounded-lg bg-white shadow-lg p-4 w-2/3">
                { errorMessage && (
                    <Alert severity="error">{ errorMessage }</Alert>
                ) }

                <div className="item-create__form-item">
                    <div className="item-create__form-item-name">
                        Nama:
                    </div>

                    <div className="item-create__form-item-value">
                        <TextField
                            className="item-create__form-item-value-input"
                            size="small"
                            variant="outlined"
                            fullWidth
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}