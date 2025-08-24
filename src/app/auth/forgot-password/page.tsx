"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().min(1, "Имя пользователя обязательно"),
    new_password: z.string().min(6, "Минимум 6 символов"),
    confirm_new_password: z.string().min(6, "Подтвердите пароль"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Пароли не совпадают",
    path: ["confirm_new_password"],
  });

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      new_password: "",
      confirm_new_password: "",
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword({ 
        name: data.name, 
        password: data.new_password, 
        confirm_password: data.confirm_new_password 
      });
      // Redirect to login after successful password reset
      window.location.href = "/auth/login";
    } catch {
      // Error handling is done in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Восстановление пароля
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введите имя пользователя и новый пароль
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Имя пользователя
              </label>
              <input
                type="text"
                {...form.register("name")}
                className={cn(
                  "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                  form.formState.errors.name && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                placeholder="user123"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Новый пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...form.register("new_password")}
                  autoComplete="new-password"
                  className={cn(
                    "mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                    form.formState.errors.new_password && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="Минимум 6 символов"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {form.formState.errors.new_password && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.new_password.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Подтверждение пароля
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...form.register("confirm_new_password")}
                  autoComplete="new-password"
                  className={cn(
                    "mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                    form.formState.errors.confirm_new_password && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {form.formState.errors.confirm_new_password && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.confirm_new_password.message}</p>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={form.formState.isSubmitting || isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.formState.isSubmitting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                Сохранение...
              </>
            ) : (
              "Сменить пароль"
            )}
          </button>
          
          <div className="text-center text-sm">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
              Вернуться ко входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
