import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, CardContent, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';

import expenseApi from '@api/expense.js';
import ExpenseRecord from '@components/expense/ExpenseRecord.jsx';
import ExpenseVoidDialog from '@components/expense/ExpenseVoidDialog.jsx';
import useExpenseVoidStore from '@stores/modules/expense-void.js';
import { canVoidExpense, expenseVoidEligibility } from '@utils/expense-utils.js';

const sizes = [10, 25, 50];

export default function ExpenseHistory() {
    const reversal = useExpenseVoidStore();
    const headingRef = useRef(null);
    const triggerRef = useRef(null);
    const [params, setParams] = useSearchParams();
    const rawPage = params.get('page');
    const page = /^\d+$/.test(rawPage || '') && Number(rawPage) > 0 && Number(rawPage) <= 2147483647 ? Number(rawPage) : 1;
    const size = sizes.includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
    const query = `page=${ page }&size=${ size }`;
    const canonical = params.toString() === query;
    const [retry, setRetry] = useState(0);
    const [state, setState] = useState({
        status: 'loading',
        query: '',
        rows: [],
        pages: 0
    });
    const loading = state.status === 'loading' || state.query !== query;
    useEffect(() => {
        if (params.toString() !== query) {
            setParams(query, { replace: true });
        }
    }, [params, query, setParams]);
    useEffect(() => {
        if (!canonical) {
            return;
        }
        let active = true;
        setState({
            status: 'loading',
            query,
            rows: [],
            pages: 0
        });
        expenseApi.getExpenseList({
            page,
            size
        }).then(({ data: response }) => {
            const data = response?.data;
            if (!Array.isArray(data?.content) || !Number.isInteger(data.totalPages)) {
                throw new Error('Invalid page');
            }
            if (!active) {
                return;
            }
            if (page > Math.max(1, data.totalPages)) {
                setParams({
                    page: String(Math.max(1, data.totalPages)),
                    size: String(size)
                }, { replace: true });
                return;
            }
            setState({
                status: 'ready',
                query,
                rows: data.content,
                pages: data.totalPages
            });
        }).catch(() => {
            if (active) {
                setState({
                    status: 'error',
                    query,
                    rows: [],
                    pages: 0
                });
            }
        });
        return () => {
            active = false;
        };
    }, [page, size, query, canonical, retry, reversal.historyRevision, setParams]);

    return (
        <Stack spacing={ 3 }>
            <Stack direction={ {
                xs: 'column',
                sm: 'row'
            } }
            spacing={ 2 }
            justifyContent="space-between">
                <Typography component="h1" variant="h4" tabIndex={ -1 } ref={ headingRef }>Riwayat pengeluaran</Typography>
                <Button component={ Link } to="/expenses/new" variant="contained">Catat pengeluaran</Button>
            </Stack>
            <ExpenseVoidDialog onExited={ () => (triggerRef.current?.isConnected ? triggerRef.current : headingRef.current)?.focus() }/>
            <Typography>Pengeluaran seluruh sesi, terbaru terlebih dahulu. Waktu mengikuti zona waktu perangkat.</Typography>
            <Stack direction={ {
                xs: 'column',
                sm: 'row'
            } }
            spacing={ 2 }>
                <TextField select
                    label="Data per halaman"
                    value={ size }
                    sx={ { minWidth: 170 } }
                    onChange={ event => setParams({
                        page: '1',
                        size: String(event.target.value)
                    }) }>
                    { sizes.map(value => <MenuItem key={ value } value={ value }>{ value }</MenuItem>) }
                </TextField>
                <Button disabled={ loading } onClick={ () => setRetry(value => value + 1) }>Muat ulang riwayat</Button>
            </Stack>
            { loading ? <Typography role="status">Memuat pengeluaran...</Typography>
                : state.status === 'error' ? <Alert severity="error">Riwayat pengeluaran gagal dimuat. Coba muat ulang riwayat.</Alert>
                    : !state.rows.length ? <Typography role="status">Belum ada pengeluaran. Gunakan Catat pengeluaran untuk memulai.</Typography>
                        : <Stack component="section" spacing={ 2 } aria-label="Daftar pengeluaran">
                            { state.rows.map(record => <Card key={ record.id }><CardContent>
                                <ExpenseRecord record={ record } />
                                <Typography variant="body2">{ expenseVoidEligibility(record) }</Typography>
                                { canVoidExpense(record) && <Button disabled={ !!reversal.record }
                                    onClick={ event => {
                                        triggerRef.current = event.currentTarget;
                                        reversal.begin(record);
                                    } }>Batalkan pengeluaran #{ record.id }</Button> }
                            </CardContent></Card>) }
                        </Stack> }
            <Pagination page={ page }
                count={ Math.max(page, state.pages, 1) }
                disabled={ loading || state.status === 'error' || !state.pages }
                aria-label="Halaman riwayat pengeluaran"
                sx={ { '& ul': { flexWrap: 'wrap' } } }
                getItemAriaLabel={ (type, value) => type === 'page' ? `Halaman ${ value }` : type === 'next' ? 'Halaman berikutnya' : 'Halaman sebelumnya' }
                onChange={ (_, value) => setParams({
                    page: String(value),
                    size: String(size)
                }) }/>
        </Stack>
    );
}
