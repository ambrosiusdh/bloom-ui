import {
    useEffect,
    useState
} from "react"

import {
    endOfDay,
    subWeeks
} from "date-fns"

import {
    Link,
    useSearchParams
} from "react-router-dom"

import {
    Button,
    MenuItem,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from "@mui/material"

import {
    Plus,
    SquareArrowOutUpRightIcon
} from "lucide-react"

import {
    useBreadcrumbStore,
    useStockAdjustmentStore
} from "@stores/index.js"

import { formatDate } from "@utils/date-utils.js"
import { debounce } from "@utils/general-utils.js"

import BloomDateRangePicker from "@components/_ui/BloomDateRangePicker.jsx"

const INITIAL_FILTER_DATE = {
    startDate: subWeeks(Date.now(), 1),
    endDate: endOfDay(Date.now()),
    key: 'selection'
}

export default function StockAdjustmentList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const stockAdjustmentList = useStockAdjustmentStore(state => state.stockAdjustmentList);
    const stockAdjustmentPaging = useStockAdjustmentStore(state => state.stockAdjustmentPaging);
    const getStockAdjustmentList = useStockAdjustmentStore(state => state.getStockAdjustmentList);

    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState('');
    const [selectedFilterKey, setSelectedFilterKey] = useState('stockAdjustmentCode');
    const filterKeyData = {
        "stockAdjustmentCode": "No. Referensi",
        "reason": "Alasan"
    }
    const [filterDate, setFilterDate] = useState({ ...INITIAL_FILTER_DATE })
    const [currentPage, setCurrentPage] = useState(1);
    const [itemPerPage, setItemPerPage] = useState(10);
    const itemPerPageOptions = [5, 10, 25, 50]
    const [isLoadingTable, setLoadingTable] = useState(false);

    const handleFilterKeyChange = e => {
        setSelectedFilterKey(e.target.value);
    }
    const handleFilterChange = e => {
        setFilters(e.target.value);
        setCurrentPage(1)
    }
    const handleFilterDateChange = dateRange => {
        setFilterDate(dateRange)
        setCurrentPage(1)
    }
    const handleFilterClear = () => {
        setFilters('')
        setSelectedFilterKey('stockAdjustmentCode');
        setFilterDate({ ...INITIAL_FILTER_DATE })
    }

    const filterStockAdjustmentList = async (page = currentPage) => {
        setLoadingTable(true);
        setCurrentPage(page);
        const payload = {
            params: {
                page,
                size: itemPerPage,
                [selectedFilterKey]: filters,
                startDate: filterDate.startDate,
                endDate: filterDate.endDate
            }
        }

        await getStockAdjustmentList(payload)
        setLoadingTable(false);
    }

    const handleItemPerPageChange = (e) => {
        setItemPerPage(e.target.value)
        setCurrentPage(1)
    };

    const handlePageChange = (e, value) => {
        setCurrentPage(value);
    }

    const fetchStockAdjustmentList = async () => {
        setSearchParams({
            page: currentPage,
            itemPerPage: itemPerPage,
            q: filters,
            key: selectedFilterKey
        })
        await filterStockAdjustmentList();
    }

    useEffect(() => {
        debounce(fetchStockAdjustmentList, 'fetchStockAdjustmentList', 500)
    }, [itemPerPage, filters, filterDate, currentPage]);

    useEffect(() => {
        setFilters('');
    }, [selectedFilterKey]);

    useEffect(() => {
        setBreadcrumbs(['Penyesuaian Stok'])
        const filterQueryParameterList = ['q', 'key', 'page', 'itemPerPage']
        if (filterQueryParameterList.some(key => searchParams.has(key))) {
            setSelectedFilterKey(searchParams.get('key') || 'stockAdjustmentCode');
            setFilters(searchParams.get('q') || '');
            setItemPerPage(Number(searchParams.get('itemPerPage')) || 10)
            setCurrentPage(Number(searchParams.get('page')) || 1)
        }
    }, []);

    return (
        <div className="stock-adjustment-list">
            <div className="stock-adjustment-list__header mb-4 flex justify-between items-center">
                <h2 className="stock-adjustment-list__header-title font-bold text-2xl">Riwayat Penyesuaian Stok</h2>

                <div className="stock-adjustment-list__header-action">
                    <Link
                        to="/stock-adjustments/new"
                        className="stock-adjustment-list__header-action-create"
                    >
                        <Button
                            variant="contained"
                            endIcon={ <Plus className="w-5" /> }>
                            Buat Penyesuaian
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="
                stock-adjustment-list__filter
                card
                mb-4
                flex
                items-center
                gap-2"
            >
                <TextField
                    select
                    className="stock-adjustment-list__filter-key basis-1/6"
                    label="Filter by"
                    variant="outlined"
                    size="small"
                    value={ selectedFilterKey }
                    onChange={ handleFilterKeyChange }
                >
                    { Object.keys(filterKeyData).map(filterKey => (
                        <MenuItem key={ filterKey } value={ filterKey }>
                            { filterKeyData[filterKey] }
                        </MenuItem>
                    )) }
                </TextField>

                <TextField
                    className="stock-adjustment-list__filter-value basis-1/3"
                    label={ `Filter by ${filterKeyData[selectedFilterKey]}` }
                    variant="outlined"
                    size="small"
                    value={ filters }
                    onChange={ handleFilterChange }
                />

                <BloomDateRangePicker
                    ranges={ filterDate }
                    label="Tanggal pembuatan"
                    onChange={ handleFilterDateChange }
                />

                <Button
                    className="stock-adjustment-list__filter-clear"
                    variant="text"
                    onClick={ handleFilterClear }
                >
                    Hapus filter
                </Button>
            </div>

            <div className="stock-adjustment-list__content gr-content bg-white rounded-lg shadow-lg pb-2">
                <div className="gr-content__pagination px-4 py-2 flex justify-between items-center">
                    <h3 className="gr-content__pagination-title text-xl font-bold">Daftar Penyesuaian</h3>

                    <div className="gr-content__pagination-inputs flex gap-2 items-center">
                        <span className="text-sm text-gray-700">Data per halaman:</span>
                        <TextField
                            select
                            value={ itemPerPage }
                            onChange={ handleItemPerPageChange }
                            size="small"
                            className="w-20 mr-2"
                        >
                            { itemPerPageOptions.map(option => (
                                <MenuItem key={ option } value={ option }>
                                    { option }
                                </MenuItem>
                            )) }
                        </TextField>
                        <Pagination
                            page={ currentPage }
                            count={ stockAdjustmentPaging?.totalPages }
                            onChange={ handlePageChange }
                        />
                    </div>
                </div>

                <TableContainer
                    component={ Paper }
                    elevation={ 0 }
                    className="gr-content__table"
                >
                    <Table>
                        <TableHead className="gr-content__table-header bg-gray-100">
                            <TableRow className="text-xs font-semibold tracking-wider">
                                <TableCell className="whitespace-nowrap">No. Referensi</TableCell>
                                <TableCell className="whitespace-nowrap">Alasan</TableCell>
                                <TableCell className="whitespace-nowrap">Dibuat Oleh</TableCell>
                                <TableCell className="whitespace-nowrap">Tanggal</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            { isLoadingTable
                                ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan="5"
                                            className="!border-b-0 !text-center italic !text-gray-500"
                                        >
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                )
                                : stockAdjustmentList?.length
                                    ? stockAdjustmentList?.map(((adjustment, index) => {
                                        const isLastRow = index === stockAdjustmentList.length - 1
                                        const tableCellClass = isLastRow ? '!border-b-0' : ''
                                        return (
                                            <TableRow
                                                key={ adjustment.stockAdjustmentCode }
                                                className="gr-content__table-row"
                                            >
                                                <TableCell className={ `${tableCellClass} whitespace-nowrap w-full` }>
                                                    <Link
                                                        to={ `/stock-adjustments/${encodeURIComponent(adjustment.stockAdjustmentCode)}` }
                                                        className="table-action__detail flex items-start gap-0.5"
                                                    >
                                                        { adjustment.stockAdjustmentCode }
                                                        <SquareArrowOutUpRightIcon
                                                            className="gr-content__table-link w-3.5 h-3.5"
                                                        />
                                                    </Link>
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { adjustment.reason || '-' }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { adjustment.createdBy || 'SYSTEM' }
                                                </TableCell>

                                                <TableCell className={ `${tableCellClass} whitespace-nowrap` }>
                                                    { formatDate(adjustment.createdDate) }
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }))
                                    : (
                                        <TableRow>
                                            <TableCell
                                                className="!border-b-0 !text-center italic !text-gray-500"
                                                colSpan="5"
                                            >
                                                Data tidak ditemukan
                                            </TableCell>
                                        </TableRow>
                                    )
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
