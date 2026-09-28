import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Alert,
    AlertTitle,
    Button,
    TextField
} from "@mui/material";
import {
    CornerDownRight,
    PackageCheck,
    ShieldCheck,
    ShoppingCart
} from "lucide-react";

import { useAuthStore } from "@stores/index.js";
import checkoutImage from '@/assets/login/checkout.webp';
import inventoryImage from '@/assets/login/inventory.webp';
import receivingImage from '@/assets/login/receiving.webp';

import './Login.scss';

const LOGIN_FAILURE_MESSAGE = 'Nama pengguna atau kata sandi salah. Periksa kembali lalu coba lagi.';
const DEFAULT_REDIRECT_TARGET = '/dashboard';
const SESSION_CHECK_FAILURE_MESSAGE = 'Sesi masuk belum dapat diperiksa. Periksa koneksi lalu coba lagi.';

const getLocationTarget = location => {
    const stateTarget = location.state?.from;
    const queryTarget = new URLSearchParams(location.search).get('redirect');

    if (typeof stateTarget === 'string') {
        return stateTarget;
    }

    if (stateTarget?.pathname) {
        return `${ stateTarget.pathname }${ stateTarget.search || '' }${ stateTarget.hash || '' }`;
    }

    return queryTarget;
};

export const getRedirectTarget = (location, origin = window.location.origin) => {
    const target = getLocationTarget(location);

    if (typeof target !== 'string' || !target.startsWith('/')) {
        return DEFAULT_REDIRECT_TARGET;
    }

    try {
        const resolvedTarget = new URL(target, origin);

        if (resolvedTarget.origin !== origin || resolvedTarget.pathname === '/login') {
            return DEFAULT_REDIRECT_TARGET;
        }

        return `${ resolvedTarget.pathname }${ resolvedTarget.search }${ resolvedTarget.hash }`;
    } catch {
        return DEFAULT_REDIRECT_TARGET;
    }
};

export default function Login() {
    const currentUser = useAuthStore(state => state.currentUser);
    const doLogin = useAuthStore(state => state.doLogin);
    const getCurrentUser = useAuthStore(state => state.getCurrentUser);
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        username: '',
        password: ''
    })
    const [isInvalidForm, setIsInvalidForm] = useState({
        username: false,
        password: false
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const errorAlertRef = useRef(null);
    const passwordInputRef = useRef(null);
    const sessionAlertRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const usernameInputRef = useRef(null);

    const redirectTarget = useMemo(() => getRedirectTarget(location), [location]);
    const isSessionExpired = new URLSearchParams(location.search).get('reason') === 'session-expired';
    const hasProtectedReturn = Boolean(getLocationTarget(location));

    const handleChange = event => {
        const { name, value } = event.target;

        setForm(currentForm => ({
            ...currentForm,
            [name]: value
        }));
        setIsInvalidForm(currentInvalidForm => ({
            ...currentInvalidForm,
            [name]: false
        }));
        setErrorMessage('');
    };

    const handleSubmit = async event => {
        event.preventDefault();

        if (submitInProgressRef.current) {
            return;
        }

        const invalidFields = {
            username: !form.username.trim(),
            password: !form.password.trim()
        };

        if (invalidFields.username || invalidFields.password) {
            setIsInvalidForm(invalidFields);

            if (invalidFields.username) {
                usernameInputRef.current?.focus();
            } else {
                passwordInputRef.current?.focus();
            }

            return;
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);
        setErrorMessage('');

        const payload = {
            data: {
                ...form
            }
        };

        try {
            const response = await doLogin(payload, { useLoader: true });

            if (response?.code !== 200) {
                setErrorMessage(LOGIN_FAILURE_MESSAGE);
                return;
            }

            const currentSession = await getCurrentUser();

            if (!currentSession) {
                setErrorMessage(SESSION_CHECK_FAILURE_MESSAGE);
            }
        } catch (error) {
            setErrorMessage(error?.category === 'authentication'
                ? LOGIN_FAILURE_MESSAGE
                : error?.message || 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            submitInProgressRef.current = false;
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (currentUser?.username) {
            navigate(redirectTarget, {
                replace: true,
                state: { focusPageHeading: true }
            });
        }
    }, [currentUser, navigate, redirectTarget]);

    useEffect(() => {
        if (errorMessage) {
            errorAlertRef.current?.focus();
        }
    }, [errorMessage]);

    useEffect(() => {
        if (isSessionExpired && !errorMessage) {
            sessionAlertRef.current?.focus();
        }
    }, [errorMessage, isSessionExpired]);

    return (
        <main className="login">
            <section className="login__brand" aria-label="Tentang Bloom">
                <div className="login__mosaic">
                    <div className="login__story">
                        <div className="login__brand-lockup">
                            <div className="login__brand-mark" aria-hidden="true">B</div>
                            <span>Bloom</span>
                        </div>
                        <div>
                            <h1>Operasional toko dalam satu alur</h1>
                            <p>Kelola penjualan, persediaan, pembelian, dan kas dari satu tempat.</p>
                        </div>
                        <div className="login__brand-list" aria-label="Kemampuan utama">
                            <div className="login__brand-item">
                                <ShoppingCart aria-hidden="true" />
                                <span>Kasir yang cepat dan tetap menjaga konteks transaksi</span>
                            </div>
                            <div className="login__brand-item">
                                <PackageCheck aria-hidden="true" />
                                <span>Stok dan penerimaan yang dapat ditelusuri</span>
                            </div>
                            <div className="login__brand-item">
                                <ShieldCheck aria-hidden="true" />
                                <span>Akses menggunakan sesi akun toko</span>
                            </div>
                        </div>
                    </div>

                    <figure className="login__visual login__visual--checkout">
                        <img
                            src={ checkoutImage }
                            alt=""
                            fetchPriority="high"
                        />
                        <figcaption>Kasir</figcaption>
                    </figure>

                    <figure className="login__visual login__visual--inventory">
                        <img
                            src={ inventoryImage }
                            alt=""
                            loading="lazy"
                        />
                        <figcaption>Persediaan</figcaption>
                    </figure>

                    <figure className="login__visual login__visual--receiving">
                        <img
                            src={ receivingImage }
                            alt=""
                            loading="lazy"
                        />
                        <figcaption>Penerimaan</figcaption>
                    </figure>

                    <div className="login__accent" aria-hidden="true">
                        <span>Satu toko</span>
                        <strong>Satu kendali</strong>
                    </div>
                </div>
            </section>

            <section className="login__form-panel">
                <form
                    className="login__card"
                    aria-busy={ isSubmitting }
                    noValidate
                    onSubmit={ handleSubmit }
                >
                    <div className="login__header">
                        <h1>Masuk ke Bloom</h1>
                        <p>Gunakan akun yang diberikan pengelola toko.</p>
                    </div>

                    { isSessionExpired && (
                        <Alert
                            ref={ sessionAlertRef }
                            severity="warning"
                            tabIndex={ -1 }
                        >
                            <AlertTitle>Sesi telah berakhir</AlertTitle>
                            Masuk kembali untuk melanjutkan. Tidak ada transaksi yang dikirim ulang.
                        </Alert>
                    ) }

                    { errorMessage && (
                        <Alert
                            ref={ errorAlertRef }
                            severity="error"
                            tabIndex={ -1 }
                        >
                            <AlertTitle>Tidak dapat masuk</AlertTitle>
                            { errorMessage }
                        </Alert>
                    ) }

                    <div className="login__return-context">
                        <CornerDownRight aria-hidden="true" />
                        <div>
                            <strong>Tujuan setelah masuk</strong>
                            <span>
                                { hasProtectedReturn
                                    ? 'Setelah masuk, Anda kembali ke halaman yang tadi diminta.'
                                    : 'Setelah masuk, Anda menuju Dashboard.' }
                            </span>
                        </div>
                    </div>

                    <TextField
                        className="login__field"
                        autoComplete="username"
                        label="Nama pengguna"
                        name="username"
                        error={ isInvalidForm.username }
                        helperText={ isInvalidForm.username ? 'Nama pengguna wajib diisi.' : undefined }
                        inputRef={ usernameInputRef }
                        slotProps={ {
                            htmlInput: {
                                readOnly: isSubmitting
                            }
                        } }
                        value={ form.username }
                        onChange={ handleChange }
                    />

                    <TextField
                        className="login__field"
                        autoComplete="current-password"
                        label="Kata sandi"
                        type="password"
                        name="password"
                        error={ isInvalidForm.password }
                        helperText={ isInvalidForm.password ? 'Kata sandi wajib diisi.' : undefined }
                        inputRef={ passwordInputRef }
                        slotProps={ {
                            htmlInput: {
                                readOnly: isSubmitting
                            }
                        } }
                        value={ form.password }
                        onChange={ handleChange }
                    />

                    <Button
                        className="login__submit"
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={ isSubmitting }
                        aria-busy={ isSubmitting }
                    >
                        { isSubmitting
                            ? 'Sedang masuk…'
                            : isSessionExpired
                                ? 'Masuk dan lanjutkan'
                                : 'Masuk' }
                    </Button>

                    <p className="login__help">
                        Kegagalan tidak menghapus isian. Setelah berhasil, fokus berpindah ke judul halaman tujuan.
                    </p>
                </form>
            </section>
        </main>
    );
}
