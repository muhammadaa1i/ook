"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

// Schema will be defined inside component to access translation function


const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState(""); // controlled password value to avoid disappearing issues
  const [loginError, setLoginError] = useState<string | null>(null);
  const { t } = useI18n();
  const loginSchema = z.object({
    name: z.string().min(1, t('auth.validation.nameRequired')),
    password: z.string().min(8, t('auth.validation.passwordMin')),
  });
  type FormSchema = z.infer<typeof loginSchema>;
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<FormSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      // Clear any previous errors
      setLoginError(null);
      clearErrors();
      await login(data);
      // Only redirect if login was successful
      router.push("/");
  } catch {
      // Set a local error state for additional feedback
      setLoginError("Неверный логин или пароль");
      // Don't redirect on error - stay on login page
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.orCreate').split(' ').slice(0,1).join(' ')}{" "}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t('auth.register')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>          
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                {t('auth.name')}
              </label>
              <input
                {...register("name", {
                  onChange: () => {
                    // Clear login error when user starts typing
                    if (loginError) setLoginError(null);
                  }
                })}
                type="text"
                autoComplete="username"
                className={cn(
                  "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
                  (errors.name || loginError) &&
                    "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder={t('auth.namePlaceholder')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {t('auth.password')}
              </label>
              <div className="mt-1 relative group">
                {(() => {
                  const passwordReg = register("password");
                  return (
                    <input
                      id="password"
                      {...passwordReg}
                      value={passwordValue}
                      onChange={(e) => {
                        passwordReg.onChange(e);
                        setPasswordValue(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className={cn(
                        "appearance-none relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
                        (errors.password || loginError) &&
                          "border-red-300 focus:border-red-500 focus:ring-red-500"
                      )}
                      placeholder={t('auth.passwordInputPlaceholder')}
                    />
                  );
                })()}
                <button
                  type="button"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md z-20"
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 pointer-events-none" />
                  ) : (
                    <Eye className="h-5 w-5 pointer-events-none" />
                  )}
                  <span className="sr-only">{showPassword ? t('auth.hidePassword') : t('auth.showPassword')}</span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('auth.loginProgress')}
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
