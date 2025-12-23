//src/app/pick-up/page.jsx

// Metadata for SEO (used by Next.js to inject <title> and <meta>)
export const metadata = {
  title: 'Pick Up | My Site',
  description: 'Browse the latest items in our store.',
};

// Main Order Page Component
import PickUpMap from '@/components/PickUpMap';

export default function PickUpPage() {
  return (
    <div className="">
      {/* map */}
      <div>
        {/* I want to show a simple map on whole screen just for time being */}
        <PickUpMap />
      </div>
    </div>
  );
}