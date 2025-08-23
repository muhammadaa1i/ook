"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

const profileSchema = z
  .object({
    name: z.string().min(1, "Имя обязательно"),
    surname: z.string().min(1, "Фамилия обязательна"),
    phone_number: z
      .string()
      .min(1, "Номер телефона обязателен")
      .regex(
        /^\+\d{10,15}$/,
        "Номер телефона должен начинаться с + и содержать 10-15 цифр"
      ),
    current_password: z.string().optional(),
    new_password: z.string().optional(),
    confirm_new_password: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.new_password || data.confirm_new_password) {
        return data.current_password && data.current_password.length >= 6;
      }
      return true;
    },
    {
      message: "Текущий пароль обязателен для смены пароля",
      path: ["current_password"],
    }
  )
  .refine(
    (data) => {
      if (data.new_password) {
        return data.new_password.length >= 6;
      }
      return true;
    },
    {
      message: "Новый пароль должен содержать минимум 6 символов",
      path: ["new_password"],
    }
  )
  .refine(
    (data) => {
      if (data.new_password || data.confirm_new_password) {
        return data.new_password === data.confirm_new_password;
      }
      return true;
    },
    {
      message: "Пароли не совпадают",
      path: ["confirm_new_password"],
    }
  );

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      surname: user?.surname || "",
      phone_number: user?.phone_number || "",
    },
  });

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        surname: user.surname,
        phone_number: user.phone_number,
      });
    }
  }, [user, reset]);

  const watchedPasswords = watch(["new_password", "confirm_new_password"]);
  const hasPasswordFields = watchedPasswords[0] || watchedPasswords[1];

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Prepare request data
      const updateData: {
        name: string;
        surname: string;
        phone_number: string;
        current_password?: string;
        new_password?: string;
        confirm_new_password?: string;
      } = {
        name: data.name,
        surname: data.surname,
        phone_number: data.phone_number,
      };

      // Add password fields if they are provided
      if (data.current_password && data.new_password) {
        updateData.current_password = data.current_password;
        updateData.new_password = data.new_password;
        updateData.confirm_new_password = data.confirm_new_password;
      }

      const response = await apiClient.put(
        API_ENDPOINTS.USER_PROFILE,
        updateData
      );

      updateUser(response.data);
      setIsEditing(false);
      toast.success("Профиль успешно обновлен!");

      // Reset password fields
      reset({
        ...data,
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message =
        axiosError.response?.data?.detail || "Ошибка обновления профиля";
      toast.error(message);
    }
  };

  const handleCancel = () => {
    if (user) {
      reset({
        name: user.name,
        surname: user.surname,
        phone_number: user.phone_number,
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Мой профиль</h1>
                <p className="text-sm text-gray-600">
                  {user.is_admin ? "Администратор" : "Пользователь"}
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span>Редактировать</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Основная информация
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    disabled={!isEditing}
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      !isEditing && "bg-gray-50 cursor-not-allowed",
                      errors.name &&
                        "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия
                  </label>
                  <input
                    {...register("surname")}
                    type="text"
                    disabled={!isEditing}
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      !isEditing && "bg-gray-50 cursor-not-allowed",
                      errors.surname &&
                        "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.surname && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.surname.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер телефона
                </label>
                <input
                  {...register("phone_number")}
                  type="tel"
                  disabled={!isEditing}
                  className={cn(
                    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    !isEditing && "bg-gray-50 cursor-not-allowed",
                    errors.phone_number &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                />
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone_number.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password Change */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Смена пароля (необязательно)
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текущий пароль
                  </label>
                  <div className="relative">
                    <input
                      {...register("current_password")}
                      type={showPasswords.current ? "text" : "password"}
                      disabled={!isEditing}
                      className={cn(
                        "w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        !isEditing && "bg-gray-50 cursor-not-allowed",
                        errors.current_password &&
                          "border-red-300 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      tabIndex={-1}
                      disabled={!isEditing}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.current_password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      {...register("new_password")}
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Оставьте пустым, если не хотите менять"
                      disabled={!isEditing}
                      className={cn(
                        "w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        !isEditing && "bg-gray-50 cursor-not-allowed",
                        errors.new_password &&
                          "border-red-300 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      tabIndex={-1}
                      disabled={!isEditing}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.new_password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.new_password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подтверждение нового пароля
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirm_new_password")}
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Повторите новый пароль"
                      disabled={!isEditing}
                      className={cn(
                        "w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        !isEditing && "bg-gray-50 cursor-not-allowed",
                        errors.confirm_new_password &&
                          "border-red-300 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      tabIndex={-1}
                      disabled={!isEditing}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_new_password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirm_new_password.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Отменить</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? "Сохранение..." : "Сохранить"}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
