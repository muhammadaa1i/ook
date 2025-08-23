import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const LoadingSpinner = ({
  size = "medium",
  className,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    ></div>
  );
};

// Loading animation for product cards
export const ProductCardLoading = () => (
  <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
    <div className="text-center">
      <LoadingSpinner size="large" className="mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Загрузка товаров...</p>
    </div>
  </div>
);

// Loading animation for tables
export const TableLoading = () => (
  <div className="flex items-center justify-center h-32">
    <div className="text-center">
      <LoadingSpinner size="large" className="mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Загрузка данных...</p>
    </div>
  </div>
);

// Loading animation for profile
export const ProfileLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <LoadingSpinner size="large" className="mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Загрузка профиля...</p>
    </div>
  </div>
);

// Main loading animation for full page
export const PageLoading = ({
  message = "Загрузка...",
}: {
  message?: string;
}) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <LoadingSpinner size="large" className="mx-auto mb-4" />
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  </div>
);

// Grid loading animation for catalog
export const GridLoading = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardLoading key={i} />
    ))}
  </div>
);

export { LoadingSpinner };
