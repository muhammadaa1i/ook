"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

// Schema will be built inside component to access t()

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const profileSchema = z
    .object({
      name: z.string().min(1, t('auth.validation.nameRequired')),
      surname: z.string().min(1, t('auth.validation.surnameRequired')),
      phone_number: z
        .string()
        .min(1, t('auth.validation.phoneRequired'))
        .regex(/^\+\d{10,15}$/, t('auth.validation.phoneFormat')),
      current_password: z.string().optional(),
      new_password: z.string().optional(),
      confirm_new_password: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.new_password || data.confirm_new_password) {
          return !!data.current_password && data.current_password.length >= 8;
        }
        return true;
      },
      {
        message: t('profilePage.validation.currentPasswordRequired'),
        path: ['current_password'],
      }
    )
    .refine(
      (data) => {
        if (data.new_password) {
          return data.new_password.length >= 8;
        }
        return true;
      },
      {
        message: t('profilePage.validation.newPasswordMin'),
        path: ['new_password'],
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
        message: t('auth.validation.passwordsMismatch'),
        path: ['confirm_new_password'],
      }
    );

  type ProfileFormData = z.infer<typeof profileSchema>;
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


  const onSubmit = async (data: ProfileFormData) => {
    try {
      const isPasswordChange = Boolean(
        (data.current_password && data.current_password.trim()) ||
        (data.new_password && data.new_password.trim()) ||
        (data.confirm_new_password && data.confirm_new_password.trim())
      );

      if (isPasswordChange) {
        const current = data.current_password?.trim() || '';
        const next = data.new_password?.trim() || '';
        const confirm = data.confirm_new_password?.trim() || '';
        // Require all three fields
        if (!current || !next || !confirm) {
          toast.error(t('profilePage.validation.allPasswordFieldsRequired'));
          return;
        }
        if (next.length < 8) {
          toast.error(t('profilePage.validation.newPasswordMin'));
          return;
        }
        if (next !== confirm) {
          toast.error(t('auth.validation.passwordsMismatch'));
          return;
        }
      }

      // If user is trying to change password, verify the current password against backend first
      if (isPasswordChange) {
        if (!data.current_password || data.current_password.trim().length === 0) {
          toast.error(t('profilePage.validation.currentPasswordRequired'));
          return;
        }

        // Verify current password by attempting a login with the existing username
        // Use direct fetch to avoid mutating auth cookies/state
        const base = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_DIRECT_URL || "https://oyoqkiyim.duckdns.org").replace(/\/$/, "");
        const verifyResp = await fetch(base + "/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user?.name ?? "", password: data.current_password })
        });

        if (!verifyResp.ok) {
          // Incorrect current password — block any update
          toast.error(t('auth.toasts.loginInvalid'));
          return;
        }
      }

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

      // Attach password-related fields only when changing password and after verification
      if (isPasswordChange && data.new_password && data.confirm_new_password) {
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
  toast.success(t('profilePage.toasts.updateSuccess'));

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
  axiosError.response?.data?.detail || t('profilePage.toasts.updateError');
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
          <div className="flex items-center justify-between flex-wrap gap-2 max-[460px]:justify-center max-[460px]:gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('profilePage.title')}</h1>
                <p className="text-sm text-gray-600">
                  {user.is_admin ? t('profilePage.roleAdmin') : t('profilePage.roleUser')}
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span>{t('common.edit')}</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t('profilePage.basicInfo')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.name')}
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
                    {t('auth.validation.surnameRequired').replace(' обязательна','')}
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
                  {t('profilePage.phoneNumber')}
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
                {t('profilePage.passwordChangeOptional')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profilePage.currentPassword')}
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
                    {t('profilePage.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      {...register("new_password")}
                      type={showPasswords.new ? "text" : "password"}
                      placeholder={t('profilePage.newPasswordPlaceholder')}
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
                    {t('profilePage.confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirm_new_password")}
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder={t('profilePage.confirmNewPasswordPlaceholder')}
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
                <span>{t('common.cancel')}</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? t('profilePage.updating') : t('common.save')}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
