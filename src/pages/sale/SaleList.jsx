import {
    useEffect,
    useState
} from "react"

import {
    endOfDay,
    subWeeks
} from "date-fns"
import { enqueueSnackbar } from "notistack"

import {
    Link,
    useSearchParams
} from "react-router-dom"

import {
    Button,
    IconButton,
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
    SearchIcon,
    SquareArrowOutUpRightIcon
} from "lucide-react"

import {
    useBreadcrumbStore,
    useSaleStore
} from "@stores/index.js"

import { formatDate } from "@utils/date-utils.js"
import { debounce } from "@utils/general-utils.js"

import BloomDateRangePicker from "@components/_ui/BloomDateRangePicker.jsx"

const INITIAL_FILTER_DATE = {
    startDate: subWeeks(Date.now(), 1),
    endDate: endOfDay(Date.now()),
    key: 'selection'
}

export default function SaleList() {
    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const saleList = useSaleStore(state => state.saleList);
    const salePaging = useSaleStore(state => state.salePaging);
    const getSaleList = useSaleStore(state => state.getSaleList);

    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState('');
    const [selectedFilterKey, setSelectedFilterKey] = useState('code');
    const filterKeyData = {
        "code": "Kode Penjualan",
        "createdBy": "Dibuat oleh"
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
        setSelectedFilterKey('code');
        setFilterDate({ ...INITIAL_FILTER_DATE })
    }

    const filterSaleList = async (page = currentPage) => {
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

        await getSaleList(payload)
        setLoadingTable(false);
    }

    const handleItemPerPageChange = (e) => {
        setItemPerPage(e.target.value)
        setCurrentPage(1)
    };

    const handlePageChange = (e, value) => {
        setCurrentPage(value);
    }

    const fetchSaleList = async () => {
        setSearchParams({
            page: currentPage,
            itemPerPage: itemPerPage,
            q: filters,
            key: selectedFilterKey
        })
        await filterSaleList();
    }

    useEffect(() => {
        debounce(fetchSaleList, 'fetchSaleList', 500)
    }, [itemPerPage, filters, filterDate, currentPage]);

    useEffect(() => {
        setFilters('');
    }, [selectedFilterKey]);

    useEffect(() => {
        setBreadcrumbs(['Riwayat Penjualan'])
        const filterQueryParameterList = ['q', 'key', 'page', 'itemPerPage']
        if (filterQueryParameterList.some(key => searchParams.has(key))) {
            setSelectedFilterKey(searchParams.get('key') || 'sku');
            setFilters(searchParams.get('q') || '');
            setItemPerPage(Number(searchParams.get('itemPerPage')) || 10)
            setCurrentPage(Number(searchParams.get('page')) || 1)
        }
    }, []);

    return (
        <div className="sale-list">
            <div className="sale-list__header mb-4 flex justify-between items-center">
                <h2 className="sale-list__header-title font-bold text-2xl">Riwayat Penjualan</h2>
            </div>

            <div className="
                sale-list__filter
                card
                mb-4
                flex
                items-center
                gap-2"
            >
                <TextField
                    select
                    className="sale-list__filter-key basis-1/6"
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
                    className="sale-list__filter-value basis-1/3"
                    label={ `Filter by ${ filterKeyData[selectedFilterKey] }` }
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
                    className="sale-list__filter-clear"
                    variant="text"
                    onClick={ handleFilterClear }
                >
                    Hapus filter
                </Button>
            </div>

            <div className="sale-list__content sl-content bg-white rounded-lg shadow-lg pb-2">
                <div className="sl-content__pagination px-4 py-2 flex justify-between items-center">
                    <h3 className="sl-content__pagination-title text-xl font-bold">Daftar penjualan</h3>

                    <div className="sl-content__pagination-inputs flex gap-2 items-center">
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
                            count={ salePaging?.totalPages }
                            onChange={ handlePageChange }
                        />
                    </div>
                </div>

                <TableContainer
                    component={ Paper }
                    elevation={ 0 }
                    className="sl-content__table"
                >
                    <Table>
                        <TableHead className="sl-content__table-header bg-gray-100">
                            <TableRow className="text-xs font-semibold tracking-wider">
                                <TableCell className="whitespace-nowrap">Kode Penjualan</TableCell>
                                <TableCell className="whitespace-nowrap">Dibuat oleh</TableCell>
                                <TableCell className="whitespace-nowrap">Dibuat pada</TableCell>
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
                                : saleList?.length
                                    ? saleList?.map(((sale, index) => {
                                        const isLastRow = index === saleList.length - 1
                                        const tableCellClass = isLastRow ? '!border-b-0' : ''
                                        return (
                                            <TableRow
                                                key={ sale.code }
                                                className="sl-content__table-row"
                                            >
                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap w-full` }>
                                                    <Link
                                                        to={ `/sales/${ encodeURIComponent(sale.code) }` }
                                                        className="table-action__detail flex items-start gap-0.5"
                                                    >
                                                        { sale.code }
                                                        <SquareArrowOutUpRightIcon
                                                            className="sl-content__table-link w-3.5 h-3.5"
                                                        />
                                                    </Link>
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { sale.createdBy || 'SYSTEM' }
                                                </TableCell>

                                                <TableCell className={ `${ tableCellClass } whitespace-nowrap` }>
                                                    { formatDate(sale.createdAt) }
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