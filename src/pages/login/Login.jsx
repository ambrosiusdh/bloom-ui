import { Alert, Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuthStore } from "@stores/index.js";
import { useNavigate } from "react-router-dom";

export function Login() {
    const currentUser = useAuthStore(state => state.currentUser);
    const doLogin = useAuthStore(state => state.doLogin);
    const getCurrentUser = useAuthStore(state => state.getCurrentUser);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: '',
        password: ''
    })
    const [isInvalidForm, setIsInvalidForm] = useState({
        username: false,
        password: false
    });
    const [errorMessage, setErrorMessage] = useState('')

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password) {
            setIsInvalidForm({
                username: !form.username,
                password: !form.password
            })
            return
        }

        const payload = {
            data: { ...form }
        }
        const response = await doLogin(payload, {
            useLoader: true
        })

        if (response.code !== 200) {
            setErrorMessage(response.message)
            return
        }

        await getCurrentUser()
    }

    useEffect(() => {
        console.log(currentUser)
        if (currentUser?.username) {
            navigate('/')
        }
    }, [currentUser]);

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
                    <Alert severity="error">{ errorMessage }</Alert>
                ) }

                <div className="login__content-username">
                    <TextField
                        className="login__content-username-input w-full"
                        label="Username"
                        name="username"
                        error={ isInvalidForm.username }
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
                    >
                        Log in
                    </Button>
                </div>
            </form>
        </div>
    )
}