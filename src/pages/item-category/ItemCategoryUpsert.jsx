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
    TextField
} from "@mui/material";

import {
    useBreadcrumbStore,
    useItemCategoryStore
} from "@stores/index.js";

import { GENERIC_ERR_MESSAGE } from "@constants/general.js"

export function ItemCategoryUpsert() {
    const navigate = useNavigate();

    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const itemCategoryDetails = useItemCategoryStore(state => state.itemCategoryDetails);
    const getItemCategoryDetails = useItemCategoryStore(state => state.getItemCategoryDetails);
    const createItemCategory = useItemCategoryStore(state => state.createItemCategory);
    const updateItemCategory = useItemCategoryStore(state => state.updateItemCategory);

    const {
        code
    } = useParams()
    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
    })
    const [errorData, setErrorData] = useState({
        name: [],
        code: []
    })
    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const validateName = () => {
        const error = []
        if (!formData.name.trim()) {
            error.push('Nama kategori tidak boleh kosong')
        }

        if (formData.name.length < 1 || formData.name.length > 255) {
            error.push('Nama kategori harus diantara 1 ~ 255 karakter')
        }

        setErrorData(prevState => ({ ...prevState, name: error }))
    }

    const validateCode = () => {
        const error = []
        if (!formData.code.trim()) {
            error.push('Kode kategori tidak boleh kosong')
        }

        if (formData.code.length < 1 || formData.code.length > 10) {
            error.push('Kode kategori harus diantara 1 ~ 10 karakter')
        }

        setErrorData(prevState => ({ ...prevState, code: error }))
    }

    const validateForm = name => {
        switch (name) {
            case "name":
                validateName()
                break
            case "code":
                validateCode()
                break
            default:
                break
        }
    }
    const isValidUpsertForm = !errorData.name.length && !errorData.code.length;

    const doGetItemCategoryDetails = async () => {
        try {
            const { data } = await getItemCategoryDetails(code, {
                useLoader: true
            })
            setFormData({
                name: data.name,
                code: data.code,
                description: data.description
            })
        } catch (error) {
            console.log(error)
        }
    }

    const submitUpsertItem = () => {
        const payload = {
            data: {
                ...formData
            }
        }

        if (!code) {
            doCreateItemCategory(payload)
            return
        }

        doUpdateItemCategory(payload)
    }

    const doCreateItemCategory = async payload => {
        try {
            const response = await createItemCategory(payload, {
                useLoader: true
            })

            console.log(response)
            const params = new URLSearchParams({
                message: `Sukses! Berhasil membuat kategori barang [${ formData.name }] dengan kode barang: [${ formData.code }]`,
                messageType: 'success'
            })
            navigate(`/item-categories?${ params.toString() }`)
        } catch (error) {
            enqueueSnackbar(JSON.stringify(error?.message) || GENERIC_ERR_MESSAGE, { variant: 'error' })
            console.log(error)
        }
    }

    const doUpdateItemCategory = async payload => {
        try {
            await updateItemCategory(code, payload, {
                useLoader: true
            })
            const params = new URLSearchParams({
                message: `Sukses! Berhasil memperbarui kategori barang ${ formData.name } dengan kode kategori: [${ code }]`,
                messageType: 'success'
            })
            navigate(`/item-categories?${ params.toString() }`)
        } catch (error) {
            enqueueSnackbar(JSON.stringify(error?.message) || GENERIC_ERR_MESSAGE, { variant: 'error' })
            console.log(error)
        }
    }

    useEffect(() => {
        if (!code) {
            setBreadcrumbs([{ to: '/item-categories', label: 'Kategori Barang' }, 'Buat baru']);
            return
        }

        setBreadcrumbs([{ to: '/item-categories', label: 'Kategori Barang' }, code]);
        doGetItemCategoryDetails()
    }, []);

    return (
        <div className="item-create">
            <div className="item-category-upsert__header mb-4">
                <h2 className="item-category-upsert__header-title font-bold text-2xl">
                    { code ? `Ubah kategori: [${ code }]` : 'Buat kategori baru' }
                </h2>
            </div>

            <form className="item-category-upsert__form card p-4 w-2/3">
                <div className="item-category-upsert__form-row flex items-center gap-4 mb-4">
                    <div className="item-category-upsert__form-item basis-1/2">
                        <div className="item-category-upsert__form-item-name mb-2">
                            Nama kategori:
                        </div>

                        <div className="item-category-upsert__form-item-value">
                            <TextField
                                className="item-category-upsert__form-item-value-input"
                                name="name"
                                value={ formData.name }
                                variant="outlined"
                                size="small"
                                placeholder="Nama kategori"
                                fullWidth
                                error={ !!errorData.name.length }
                                helperText={ errorData.name[0] || '' }
                                onChange={ handleFormChange }
                                onBlur={ () => validateForm('name') }
                            />
                        </div>
                    </div>

                    <div className="item-category-upsert__form-item basis-1/2">
                        <div className="item-category-upsert__form-item-name mb-2">
                            Kode kategori:
                        </div>

                        <div className="item-category-upsert__form-item-value">
                            {
                                code
                                ? <span className="item-category-upsert__form-item-value-text font-bold">
                                        { code }
                                </span>
                                : <TextField
                                    className="item-category-upsert__form-item-value-input"
                                    name="code"
                                    value={ formData.code }
                                    variant="outlined"
                                    size="small"
                                    placeholder="Kode kategori"
                                    fullWidth
                                    disabled={ !!code }
                                    error={ !!errorData.code.length }
                                    helperText={ errorData.code[0] || '' }
                                    onChange={ handleFormChange }
                                    onBlur={ () => validateForm('code') }
                                />
                            }
                        </div>
                    </div>
                </div>

                <div className="item-category-upsert__form-row mb-4">
                    <div className="item-category-upsert__form-item">
                        <div className="item-category-upsert__form-item-name mb-2">
                            Deskripsi kategori:
                        </div>

                        <div className="item-category-upsert__form-item-value">
                            <TextField
                                className="item-category-upsert__form-item-value-input scrollbar-thin"
                                multiline
                                name="description"
                                value={ formData.description }
                                rows="4"
                                variant="outlined"
                                size="small"
                                placeholder="Deskripsi kategori"
                                onChange={ handleFormChange }
                                fullWidth
                            />
                        </div>
                    </div>
                </div>

                <div className="item-category-upsert__form-action">
                    <Button
                        className="item-category-upsert__form-submit"
                        variant="contained"
                        disabled={ !isValidUpsertForm }
                        onClick={ submitUpsertItem }
                    >
                        Buat
                    </Button>
                </div>
            </form>
        </div>
    )
}