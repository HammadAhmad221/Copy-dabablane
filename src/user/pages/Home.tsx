import CategoriesSection from "@/user/components/home/CategoriesSection";
import FeaturedBlane from "@/user/components/home/FeaturedBlane";
import { useHome } from "@/user/lib/hooks/useHome";
import HeroBanner from "@/user/components/home/HeroBanner";
import { convertBlanes, convertCategories } from "@/user/lib/utils/home";
import { Blane } from "@/user/lib/types/blane";
import { Suspense, lazy, memo } from "react";
import Loader from "@/user/components/ui/Loader";
import BlanesSection from "@/user/components/home/BlanesSection";
import { isBlaneExpired } from "@/user/lib/utils/blane";

// Lazy load components not needed for initial render
const LazyDynamicBanner = lazy(() => import("@/user/components/home/DynamicBanner"));

// Extract error component to reduce nesting and improve reusability
const ErrorMessage = memo(({ 
  title, 
  message, 
  buttonText, 
  onRetry, 
  bgColor = "bg-red-50", 
  titleColor = "text-red-600" 
}: {
  title: string;
  message: string;
  buttonText: string;
  onRetry: () => void;
  bgColor?: string;
  titleColor?: string;
}) => (
  <div className="text-center p-6 rounded-lg max-w-lg mx-auto" style={{backgroundColor: bgColor}}>
    <h2 className={`text-xl font-semibold ${titleColor} mb-2`}>{title}</h2>
    <p className="text-gray-700 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
    >
      {buttonText}
    </button>
  </div>
));

const Home = () => {
  const { data: response, isLoading, isError, retryFetch } = useHome();

  if (isLoading) return <Loader />;

  if (isError) {
    return (
      <ErrorMessage
        title="Connection Error"
        message={isError.message || "We couldn't connect to the server. Please check your internet connection."}
        buttonText="Try Again"
        onRetry={retryFetch}
      />
    );
  }

  if (!response?.success || !response?.data) {
    return (
      <ErrorMessage
        title="No Data Available"
        message="We couldn't load the content at this time."
        buttonText="Refresh Data"
        onRetry={retryFetch}
        bgColor="bg-yellow-50"
        titleColor="text-yellow-600"
      />
    );
  }

  const { categories, new_blanes, popular_blanes, featured_blane, banner } = response.data;
  
  // Filter out expired Blanes
  const nonExpiredNewBlanes = convertBlanes(new_blanes).filter(blane => !isBlaneExpired(blane.expiration_date));
  const nonExpiredFeaturedBlanes = convertBlanes(featured_blane).filter(blane => !isBlaneExpired(blane.expiration_date));
  
  return (
    <main className="bg-gray-50">
      {/* Hero Banner - Full width */}
      <HeroBanner banner={banner} />
      
      <div className="max-w-[1440px] mx-auto px-4">
        {/* Main Content */}
        <CategoriesSection categories={convertCategories(categories)} />
        {nonExpiredFeaturedBlanes.length > 0 && <FeaturedBlane blanes={nonExpiredFeaturedBlanes as unknown as Blane[]} />}
        <BlanesSection
          title="Nouveaux Blanes" 
          blanes={nonExpiredNewBlanes as unknown as Blane[]} 
          linkUrl="/catalogue" 
          isPriority={true}
        />
      </div>

      {/* Lower priority below-the-fold content */}
      <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
        {/* Dynamic Banner - Full width */}
        <LazyDynamicBanner banner={banner} />
        
        <div className="max-w-[1440px] mx-auto px-4">
          <BlanesSection
            title="Blanes Populaires" 
            blanes={convertBlanes(popular_blanes) as unknown as Blane[]} 
            linkUrl="/catalogue" 
          />
        </div>
      </Suspense>
    </main>
  );
};

export default memo(Home);
