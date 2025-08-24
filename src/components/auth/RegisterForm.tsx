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

// Schema defined inside component with translations


const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const { t } = useI18n();
  const registerSchema = z
    .object({
      name: z.string().min(1, t('auth.validation.nameRequired')),
      surname: z.string().min(1, t('auth.validation.surnameRequired')),
      phone_number: z
        .string()
        .min(1, t('auth.validation.phoneRequired'))
        .regex(/^\+\d{10,15}$/, t('auth.validation.phoneFormat')),
      password: z.string().min(8, t('auth.validation.passwordMin')),
      confirm_password: z.string().min(8, t('auth.validation.confirmPasswordMin')),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t('auth.validation.passwordsMismatch'),
      path: ['confirm_password'],
    });
  type FormSchema = z.infer<typeof registerSchema>;
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      await registerUser(data);
      router.push("/");
    } catch {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.register')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.orLogin').split(' ').slice(0,1).join(' ')}{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t('auth.login')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('auth.name')}
                </label>
                <input
                  {...register("name")}
                  type="text"
                  autoComplete="given-name"
                  className={cn(
                    "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
                    errors.name &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder={t('auth.name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="surname"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('auth.validation.surnameRequired').split(' ')[0]}
                </label>
                <input
                  {...register("surname")}
                  type="text"
                  autoComplete="family-name"
                  className={cn(
                    "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
                    errors.surname &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder={t('auth.validation.surnameRequired').split(' ')[0]}
                />
                {errors.surname && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.surname.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700"
              >
                {t('auth.phone')}
              </label>
              <input
                {...register("phone_number")}
                type="tel"
                autoComplete="tel"
                className={cn(
                  "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
                  errors.phone_number &&
                    "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder={t('auth.phonePlaceholder')}
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone_number.message}
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
              <div className="mt-1 relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={cn(
                    "appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
                    errors.password &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="mt-1 relative">
                <input
                  {...register("confirm_password")}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={cn(
                    "appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm",
                    errors.confirm_password &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>
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
                  {t('auth.registerProgress')}
                </>
              ) : (
                t('auth.register')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
