import { Button, TextField } from "@mui/material";
import { useState } from "react";

export function Login() {
    const [form, setForm] = useState({
        username: '',
        password: ''
    })

    const [isInvalidForm, setIsInvalidForm] = useState({
        username: false,
        password: false
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsInvalidForm({
            username: !form.username,
            password: !form.password
        })

        console.log('submit')
        console.log(e)
        console.log(form)
    }

    return (
        <div className="login w-full h-screen flex items-center justify-center bg-white text-black">
            <form
                className="login__content shadow-lg rounded border border-gray p-4 w-1/2 flex flex-col gap-4"
                onSubmit={ handleSubmit }
            >
                <div className="login__header mb-2">
                    <h1 className="login__header-title text-4xl">Login</h1>
                </div>

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
                        type="submit">
                        Log in
                    </Button>
                </div>
            </form>
        </div>
    )
}