import {
    useEffect,
    useRef,
    useState
} from "react";
import {
    useNavigate,
    useParams
} from "react-router-dom";
import {
    Alert,
    Button,
    CircularProgress,
    TextField
} from "@mui/material";

import { API_DOMAIN_ERROR_CODE } from "@api/error-contract.js";
import {
    useBreadcrumbStore,
    useItemCategoryStore
} from "@stores/index.js";

const FIELD_VALIDATION = {
    code: {
        required: 'Kode kategori wajib diisi.',
        maxLength: 100,
        maxLengthMessage: 'Kode kategori maksimal 100 karakter.'
    },
    name: {
        required: 'Nama kategori wajib diisi.',
        maxLength: 255,
        maxLengthMessage: 'Nama kategori maksimal 255 karakter.'
    }
};

const EMPTY_ERRORS = { code: '', name: '' };
const EMPTY_FORM_DATA = { name: '', code: '', description: '' };

const getFieldValidationMessage = (name, value) => {
    const rule = FIELD_VALIDATION[name];
    if (!rule) {
        return '';
    }

    if (!value?.trim()) {
        return rule.required;
    }

    return value.length > rule.maxLength ? rule.maxLengthMessage : '';
};

const getBackendValidationMessage = detail => {
    if (detail.message === 'must not be blank') {
        return FIELD_VALIDATION[detail.field].required;
    }

    return detail.message || `${ detail.field } tidak valid.`;
};

export default function ItemCategoryUpsert() {
    const navigate = useNavigate();

    const setBreadcrumbs = useBreadcrumbStore(state => state.setBreadcrumbs);
    const getItemCategoryDetails = useItemCategoryStore(state => state.getItemCategoryDetails);
    const createItemCategory = useItemCategoryStore(state => state.createItemCategory);
    const updateItemCategory = useItemCategoryStore(state => state.updateItemCategory);

    const {
        code
    } = useParams()
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoadingDetails, setIsLoadingDetails] = useState(Boolean(code));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [detailRefreshVersion, setDetailRefreshVersion] = useState(0);
    const [loadedCode, setLoadedCode] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM_DATA)
    const [errorData, setErrorData] = useState(EMPTY_ERRORS)
    const codeInputRef = useRef(null);
    const errorAlertRef = useRef(null);
    const isMountedRef = useRef(false);
    const nameInputRef = useRef(null);
    const pendingFieldFocusRef = useRef('');
    const submissionRequestRef = useRef(0);
    const submitInProgressRef = useRef(false);
    const currentRouteCodeRef = useRef(code);
    currentRouteCodeRef.current = code;

    const handleFormChange = (e) => {
        setFormData(previous => ({ ...previous, [e.target.name]: e.target.value }));
        setErrorData(previous => ({ ...previous, [e.target.name]: '' }));
        setErrorMessage('');
    }

    const validateField = name => {
        const message = getFieldValidationMessage(name, formData[name]);
        setErrorData(previous => ({ ...previous, [name]: message }));
        return message;
    }

    const submitUpsertItem = async event => {
        event.preventDefault();
        if (submitInProgressRef.current) {
            return;
        }

        const nextErrors = {
            code: code ? '' : getFieldValidationMessage('code', formData.code),
            name: getFieldValidationMessage('name', formData.name)
        };
        setErrorData(nextErrors);

        if (nextErrors.code || nextErrors.name) {
            (nextErrors.name ? nameInputRef : codeInputRef).current?.focus();
            return;
        }

        submitInProgressRef.current = true;
        pendingFieldFocusRef.current = '';
        setIsSubmitting(true);
        setErrorMessage('');
        const submissionId = ++submissionRequestRef.current;
        const submittedCode = code;
        const submittedFormData = { ...formData };
        const payload = {
            data: submittedCode
                ? { name: submittedFormData.name, description: submittedFormData.description }
                : submittedFormData
        }
        const isCurrentSubmission = () => isMountedRef.current
            && submissionRequestRef.current === submissionId
            && currentRouteCodeRef.current === submittedCode;

        try {
            if (submittedCode) {
                await updateItemCategory(submittedCode, payload)
            } else {
                await createItemCategory(payload)
            }

            if (!isCurrentSubmission()) {
                return;
            }

            const params = new URLSearchParams({
                message: submittedCode
                    ? `Kategori [${ submittedCode }] berhasil diperbarui.`
                    : `Kategori [${ submittedFormData.code }] berhasil dibuat.`,
                messageType: 'success'
            })
            navigate(`/item-categories?${ params.toString() }`)
        } catch (error) {
            if (!isCurrentSubmission()) {
                return;
            }

            let firstInvalidField = '';
            if (error?.validationErrors?.length) {
                const backendErrors = { ...EMPTY_ERRORS };
                error.validationErrors.forEach(detail => {
                    if (detail.field in backendErrors) {
                        backendErrors[detail.field] = getBackendValidationMessage(detail);
                    }
                });
                setErrorData(backendErrors);
                firstInvalidField = ['name', 'code'].find(field => backendErrors[field]) || '';
            }

            if (firstInvalidField) {
                setErrorMessage('');
                pendingFieldFocusRef.current = firstInvalidField;
                return;
            }

            if (error?.domainCode === API_DOMAIN_ERROR_CODE.ITEM_CATEGORY_ALREADY_EXISTS) {
                setErrorMessage(`Kode kategori [${ submittedFormData.code }] sudah digunakan. Gunakan kode lain.`)
            } else if (error?.category === 'not_found') {
                setErrorMessage('Kategori ini tidak lagi tersedia. Kembali ke daftar dan muat ulang data.')
            } else {
                setErrorMessage(error?.message || 'Kategori gagal disimpan. Silakan coba lagi.')
            }
        } finally {
            if (submissionRequestRef.current === submissionId
                && currentRouteCodeRef.current === submittedCode) {
                submitInProgressRef.current = false;
                setIsSubmitting(false);
            }
        }
    }

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            pendingFieldFocusRef.current = '';
            submissionRequestRef.current += 1;
        };
    }, []);

    useEffect(() => {
        pendingFieldFocusRef.current = '';
        submissionRequestRef.current += 1;
        submitInProgressRef.current = false;
        setIsSubmitting(false);
    }, [code]);

    useEffect(() => {
        if (!code) {
            setIsLoadingDetails(false);
            setLoadedCode(null);
            setErrorMessage('');
            setErrorData({ ...EMPTY_ERRORS });
            setFormData({ ...EMPTY_FORM_DATA });
            setBreadcrumbs([{ to: '/item-categories', label: 'Kategori Barang' }, 'Buat baru']);
            return
        }

        const controller = new AbortController();
        setIsLoadingDetails(true);
        setLoadedCode(null);
        setErrorMessage('');
        setErrorData({ ...EMPTY_ERRORS });
        setFormData({ ...EMPTY_FORM_DATA });
        setBreadcrumbs([{ to: '/item-categories', label: 'Kategori Barang' }, code]);

        const loadItemCategoryDetails = async () => {
            try {
                const { data } = await getItemCategoryDetails(code, { signal: controller.signal })
                if (!controller.signal.aborted) {
                    setFormData({
                        name: data.name,
                        code: data.code,
                        description: data.description || ''
                    })
                    setLoadedCode(code)
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setErrorMessage(error?.message || 'Kategori gagal dimuat. Silakan coba lagi.')
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingDetails(false);
                }
            }
        };

        loadItemCategoryDetails();
        return () => controller.abort();
    }, [code, detailRefreshVersion]);

    useEffect(() => {
        if (errorMessage) {
            errorAlertRef.current?.focus();
        }
    }, [errorMessage]);

    useEffect(() => {
        const field = pendingFieldFocusRef.current;
        if (isSubmitting || !field || !errorData[field]) {
            return;
        }

        pendingFieldFocusRef.current = '';
        (field === 'name' ? nameInputRef : codeInputRef).current?.focus();
    }, [isSubmitting, errorData]);

    return (
        <div className="item-create">
            <div className="item-category-upsert__header mb-4">
                <h2 className="item-category-upsert__header-title font-bold text-2xl">
                    { code ? `Ubah kategori: [${ code }]` : 'Buat kategori baru' }
                </h2>
            </div>

            { errorMessage && (
                <Alert
                    ref={ errorAlertRef }
                    severity="error"
                    tabIndex={ -1 }
                    className="mb-4 max-w-3xl"
                    action={ code && !formData.code && !isSubmitting ? (
                        <Button
                            color="inherit"
                            onClick={ () => setDetailRefreshVersion(previous => previous + 1) }
                        >
                            Coba lagi
                        </Button>
                    ) : undefined }
                >
                    { errorMessage }
                </Alert>
            ) }

            { isLoadingDetails || (code && loadedCode !== code && !errorMessage) ? (
                <div
                    className="card p-8 w-full max-w-3xl flex items-center justify-center gap-3"
                    role="status"
                >
                    <CircularProgress size={ 24 } />
                    Memuat kategori...
                </div>
            ) : (!code || loadedCode === code) && (
                <form
                    className="item-category-upsert__form card p-4 w-full max-w-3xl"
                    onSubmit={ submitUpsertItem }
                    noValidate
                >
                    <div className="item-category-upsert__form-row flex flex-wrap items-start gap-4 mb-4">
                        <div className="item-category-upsert__form-item flex-1 min-w-60">

                        <div className="item-category-upsert__form-item-value">
                            <TextField
                                className="item-category-upsert__form-item-value-input"
                                label="Nama kategori"
                                name="name"
                                value={ formData.name }
                                variant="outlined"
                                size="small"
                                placeholder="Nama kategori"
                                fullWidth
                                error={ !!errorData.name }
                                helperText={ errorData.name }
                                inputRef={ nameInputRef }
                                disabled={ isSubmitting }
                                onChange={ handleFormChange }
                                onBlur={ () => validateField('name') }
                            />
                        </div>
                    </div>

                    <div className="item-category-upsert__form-item flex-1 min-w-60">

                        <div className="item-category-upsert__form-item-value">
                            {
                                code
                                ? <div>
                                    <span>Kode kategori: </span>
                                    <strong className="item-category-upsert__form-item-value-text">{ code }</strong>
                                </div>
                                : <TextField
                                    className="item-category-upsert__form-item-value-input"
                                    label="Kode kategori"
                                    name="code"
                                    value={ formData.code }
                                    variant="outlined"
                                    size="small"
                                    placeholder="Kode kategori"
                                    fullWidth
                                    error={ !!errorData.code }
                                    helperText={ errorData.code }
                                    inputRef={ codeInputRef }
                                    disabled={ isSubmitting }
                                    onChange={ handleFormChange }
                                    onBlur={ () => validateField('code') }
                                />
                            }
                        </div>
                    </div>
                </div>

                <div className="item-category-upsert__form-row mb-4">
                    <div className="item-category-upsert__form-item">
                        <div className="item-category-upsert__form-item-value">
                            <TextField
                                className="item-category-upsert__form-item-value-input scrollbar-thin"
                                label="Deskripsi kategori"
                                multiline
                                name="description"
                                value={ formData.description }
                                rows="4"
                                variant="outlined"
                                size="small"
                                placeholder="Deskripsi kategori"
                                onChange={ handleFormChange }
                                disabled={ isSubmitting }
                                fullWidth
                            />
                        </div>
                    </div>
                </div>

                <div className="item-category-upsert__form-action">
                    <Button
                        className="item-category-upsert__form-submit"
                        variant="contained"
                        type="submit"
                        disabled={ isSubmitting }
                        aria-busy={ isSubmitting }
                    >
                        { isSubmitting
                            ? 'Menyimpan...'
                            : code ? 'Simpan perubahan' : 'Buat kategori' }
                    </Button>
                </div>
            </form>
            ) }
        </div>
    )
}
