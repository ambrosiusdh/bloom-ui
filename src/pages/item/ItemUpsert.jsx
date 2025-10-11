import {
    useEffect,
    useState
} from "react";

import { enqueueSnackbar } from "notistack"

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    Button,
    InputAdornment,
    MenuItem,
    TextField
} from "@mui/material";

import {
    useBreadcrumbStore,
    useItemCategoryStore,
    useItemStore
} from "@stores/index.js";

import { BloomInputNumber } from "@components/_ui/BloomInputNumber.jsx";

import { GENERIC_ERR_MESSAGE } from "@constants/general.js"

export function ItemUpsert() {
    const navigate = useNavigate();

    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemDetails = useItemStore(state => state.itemDetails);
    const getItemDetails = useItemStore(state => state.getItemDetails);
    const createItem = useItemStore(state => state.createItem);
    const updateItem = useItemStore(state => state.updateItem);
    const itemCategoryList = useItemCategoryStore(state => state.itemCategoryList);
    const getItemCategoryList = useItemCategoryStore(state => state.getItemCategoryList);

    const {
        sku
    } = useParams()
    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        categoryCode: "",
        description: "",
        stockQuantity: 0,
        price: '0'
    })
    const [errorData, setErrorData] = useState({
        name: [],
        price: []
    })
    const getPriceValue = value => {
        const formatter = new Intl.NumberFormat("en-US")
        const price = Number(value.replace(/[^0-9]/g, ""))
        if (price > Number.MAX_SAFE_INTEGER) {
            return formatter.format(Number.MAX_SAFE_INTEGER);
        }

        return formatter.format(price)
    }
    const handleFormChange = (e) => {
        const value = e.target.name === 'price' ? getPriceValue(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    }

    const validateName = () => {
        const error = []
        if (!formData.name.trim()) {
            error.push('Nama barang tidak boleh kosong')
        }

        if (formData.name.length < 1 || formData.name.length > 255) {
            error.push('Nama barang harus diantara 1 ~ 255 karakter')
        }

        setErrorData(prevState => ({ ...prevState, name: error }))
    }

    const validatePrice = () => {
        const error = []
        if (formData.price === 0) {
            error.push('Harga barang tidak boleh 0')
        }

        setErrorData(prevState => ({ ...prevState, price: error }))
    }

    const validateForm = name => {
        switch (name) {
            case "name":
                validateName()
                break
            case "price":
                validatePrice()
                break
            default:
                break
        }
    }
    const isValidUpsertForm = !!(formData.name && formData.categoryCode && Number(formData.price.replace(/[^0-9]/g, "")) > 0);


    const filterItemCategoryList = async () => {
        const payload = {
            params: {
                page: 1,
                size: 2000
            }
        }
        await getItemCategoryList(payload, {
            useLoader: true
        })
    }

    const doGetItemDetails = async () => {
        try {
            const { data } = await getItemDetails(sku, {
                useLoader: true
            })
            setFormData({
                name: data.name,
                categoryCode: data.category.code,
                description: data.description,
                stockQuantity: data.stockQuantity,
                price: getPriceValue(data.price.toString()),
            })
        } catch (error) {
            console.log(error)
        }
    }

    const submitUpsertItem = () => {
        const payload = {
            data: {
                ...formData,
                price: formData.price.replace(/[^0-9]/g, "")
            }
        }

        if (!sku) {
            doCreateItem(payload)
            return
        }

        doUpdateItem(payload)
    }

    const doCreateItem = async payload => {
        try {
            const { data } = await createItem(payload, {
                useLoader: true
            })

            console.log(data)

            const params = new URLSearchParams({
                message: `Sukses! Berhasil membuat barang [${ formData.name }] dengan kode barang: [${ data.sku }]`,
                messageType: 'success'
            })
            navigate(`/items?${ params.toString() }`)
        } catch (error) {
            enqueueSnackbar(JSON.stringify(error?.message) || GENERIC_ERR_MESSAGE, { variant: 'error' })
            console.log(error)
        }
    }

    const doUpdateItem = async payload => {
        try {
            await updateItem(sku, payload, {
                useLoader: true
            })
            const params = new URLSearchParams({
                message: `Sukses! Berhasil memperbarui barang ${ formData.name } dengan kode barang: [${ sku }]`,
                messageType: 'success'
            })
            navigate(`/items?${ params.toString() }`)
        } catch (error) {
            enqueueSnackbar(JSON.stringify(error?.message) || GENERIC_ERR_MESSAGE, { variant: 'error' })
            console.log(error)
        }
    }

    useEffect(() => {
        filterItemCategoryList()
        if (!sku) {
            setBreadcrumbs([{ to: '/items', label: 'Data Barang' }, 'Buat baru']);
            return
        }

        setBreadcrumbs([{ to: '/items', label: 'Data Barang' }, sku]);
        doGetItemDetails()
    }, []);

    return (
        <div className="item-create">
            <div className="item-create__header mb-4">
                <h2 className="item-create__header-title font-bold text-2xl">
                    { sku ? `Ubah ${ sku }` : 'Buat baru' }
                </h2>
            </div>

            <form className="item-create__form card p-4 w-2/3">
                <div className="item-create__form-row flex items-center gap-4 mb-4">
                    <div className="item-create__form-item basis-1/2">
                        <div className="item-create__form-item-name mb-2">
                            Nama barang:
                        </div>

                        <div className="item-create__form-item-value">
                            <TextField
                                className="item-create__form-item-value-input"
                                name="name"
                                value={ formData.name }
                                variant="outlined"
                                size="small"
                                placeholder="Nama barang"
                                fullWidth
                                error={ !!errorData.name.length }
                                helperText={ errorData.name[0] || '' }
                                onChange={ handleFormChange }
                                onBlur={ () => validateForm('name') }
                            />
                        </div>
                    </div>

                    <div className="item-create__form-item basis-1/2">
                        <div className="item-create__form-item-name mb-2">
                            Kategori barang:
                        </div>

                        <div className="item-create__form-item-value">
                            {
                                sku
                                ? <span className="item-create__form-item-value-text font-bold">
                                        [{ itemDetails?.category?.code }] - { itemDetails?.category?.name }
                                </span>
                                : <TextField
                                    select
                                    className="item-list__filter-value"
                                    name="categoryCode"
                                    value={ formData.categoryCode }
                                    variant="outlined"
                                    size="small"
                                    label={ formData.categoryCode ? '' : 'Kategori barang' }
                                    onChange={ handleFormChange }
                                    fullWidth
                                >
                                    {
                                        itemCategoryList?.map(category => (
                                            <MenuItem key={ category.code } value={ category.code }>
                                                [{ category.code }] { category.name }
                                            </MenuItem>
                                        ))
                                    }
                                </TextField>
                            }
                        </div>
                    </div>
                </div>

                <div className="item-create__form-row flex items-center gap-4 mb-4">
                    <div className="item-create__form-item basis-1/2">
                        <div className="item-create__form-item-name mb-2">
                            Harga barang:
                        </div>

                        <div className="item-create__form-item-value">
                            <TextField
                                className="item-create__form-item-value-input"
                                name="price"
                                value={ formData.price }
                                variant="outlined"
                                size="small"
                                placeholder="Harga barang"
                                error={ !!errorData.price.length }
                                helperText={ errorData.price[0] || '' }
                                fullWidth
                                slotProps={ {
                                    input: {
                                        startAdornment: <InputAdornment position="start">Rp.</InputAdornment>,
                                    },
                                } }
                                onChange={ handleFormChange }
                                onBlur={ () => validateForm('price') }
                            />
                        </div>
                    </div>

                    <div className="item-create__form-item basis-1/2">
                        <div className="item-create__form-item-name mb-2">
                            Stok barang:
                        </div>

                        <div className="item-create__form-item-value">
                            <BloomInputNumber
                                value={ formData.stockQuantity }
                                onChange={ newQuantity => setFormData(prevState => ({
                                    ...prevState,
                                    stockQuantity: newQuantity
                                })) }
                                max="9999"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="item-create__form-row mb-4">
                    <div className="item-create__form-item">
                        <div className="item-create__form-item-name mb-2">
                            Deskripsi barang:
                        </div>

                        <div className="item-create__form-item-value">
                            <TextField
                                className="item-create__form-item-value-input scrollbar-thin"
                                multiline
                                name="description"
                                value={ formData.description }
                                rows="4"
                                variant="outlined"
                                size="small"
                                placeholder="Deskripsi barang"
                                onChange={ handleFormChange }
                                fullWidth
                            />
                        </div>
                    </div>
                </div>

                <div className="item-create__form-action">
                    <Button
                        className="item-create__form-submit"
                        variant="contained"
                        disabled={ !isValidUpsertForm }
                        onClick={ submitUpsertItem }
                    >
                        { sku ? 'Ubah' : 'Buat' }
                    </Button>
                </div>
            </form>
        </div>
    )
}