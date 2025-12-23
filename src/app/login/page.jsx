// src/app/login/page.jsx
"use client";

import LoginForm from "@/components/forms/LoginForm";
import { useLogin } from "@/controller/loginController";

export default function LoginPage() {
  const { email, password, response, error, setEmail, setPassword, handleLogin } = useLogin();

  return (
    <>
      <div className="">
        <LoginForm
          email={email}
          password={password}
          onEmailChange={(e) => setEmail(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onSubmit={handleLogin}
          error={error}
        />
        {response && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
            <h2 className="font-semibold">Login Successful</h2>
            <pre className="mt-2 text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
