import { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { Alert, Button, TextField } from "@mui/material";

import { useAuthStore } from "@stores/index.js";

const LOGIN_FAILURE_MESSAGE = 'Username atau kata sandi salah. Silakan coba lagi.';

const getRedirectTarget = location => {
    const stateTarget = location.state?.from;
    const queryTarget = new URLSearchParams(location.search).get('redirect');
    const target = typeof stateTarget === 'string'
        ? stateTarget
        : stateTarget?.pathname
            ? `${stateTarget.pathname}${stateTarget.search || ''}${stateTarget.hash || ''}`
            : queryTarget;

    return target?.startsWith('/') && !target.startsWith('//') && !target.startsWith('/login')
        ? target
        : '/';
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
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false);
    const errorAlertRef = useRef(null);
    const passwordInputRef = useRef(null);
    const submitInProgressRef = useRef(false);
    const usernameInputRef = useRef(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setIsInvalidForm({ ...isInvalidForm, [e.target.name]: false });
        setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitInProgressRef.current) {
            return;
        }

        if (!form.username || !form.password) {
            const invalidFields = {
                username: !form.username,
                password: !form.password
            };
            setIsInvalidForm(invalidFields)
            if (invalidFields.username) {
                usernameInputRef.current?.focus();
            } else {
                passwordInputRef.current?.focus();
            }
            return
        }

        submitInProgressRef.current = true;
        setIsSubmitting(true);
        setErrorMessage('');
        const payload = {
            data: { ...form }
        }

        try {
            const response = await doLogin(payload, {
                useLoader: true
            })

            if (response?.code !== 200) {
                setErrorMessage(LOGIN_FAILURE_MESSAGE)
                return;
            }

            await getCurrentUser()
        } catch (error) {
            setErrorMessage(error?.category === 'authentication'
                ? LOGIN_FAILURE_MESSAGE
                : error?.message || 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            submitInProgressRef.current = false;
            setIsSubmitting(false);
        }
    }

    useEffect(() => {
        if (currentUser?.username) {
            navigate(getRedirectTarget(location), { replace: true })
        }
    }, [currentUser, location, navigate]);

    useEffect(() => {
        if (errorMessage) {
            errorAlertRef.current?.focus();
        }
    }, [errorMessage]);

    return (
        <div className="login w-full min-h-screen flex items-center justify-center">
            <form
                className="login__content shadow-lg rounded border border-gray p-4 w-1/2 flex flex-col gap-4"
                onSubmit={ handleSubmit }
            >
                <div className="login__header mb-2">
                    <h1 className="login__header-title text-4xl">Login</h1>
                </div>

                { errorMessage && (
                    <Alert
                        ref={ errorAlertRef }
                        severity="error"
                        tabIndex={ -1 }
                    >
                        { errorMessage }
                    </Alert>
                ) }

                <div className="login__content-username">
                    <TextField
                        className="login__content-username-input w-full"
                        label="Username"
                        name="username"
                        error={ isInvalidForm.username }
                        helperText={ isInvalidForm.username ? 'Username wajib diisi.' : undefined }
                        inputRef={ usernameInputRef }
                        value={ form.username }
                        onChange={ handleChange }
                    />
                </div>

                <div className="login__content-password">
                    <TextField
                        className="login__content-password-input w-full"
                        label="Password"
                        type="password"
                        name="password"
                        error={ isInvalidForm.password }
                        helperText={ isInvalidForm.password ? 'Password wajib diisi.' : undefined }
                        inputRef={ passwordInputRef }
                        value={ form.password }
                        onChange={ handleChange }
                    />
                </div>

                <div className="login__content-action">
                    <Button
                        className="login__content-action-submit w-full"
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={ isSubmitting }
                        aria-busy={ isSubmitting }
                    >
                        { isSubmitting ? 'Sedang masuk...' : 'Log in' }
                    </Button>
                </div>
            </form>
        </div>
    )
}
