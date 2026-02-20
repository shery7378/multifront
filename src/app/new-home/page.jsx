import Topheader from '@/components/new-design/Topheader';
import DesktopNavNew from '@/components/new-design/DesktopNavNew';
import OrderCutoffBar from '@/components/new-design/OrderCutoffBar';
import ShopCategory from '@/components/new-design/ShopCategory';
import Stocksection from '@/components/new-design/Stocksection';
import Filters from '@/components/new-design/Filters';
import TrendingNearYou from '@/components/new-design/TrendingNearYou';
import WarrantyCards from '@/components/new-design/WarrantyCards';
import Footer from '@/components/Footer';
import NearStoreSection from '@/components/new-design/NearStoreSection';

export default function NewHomePage() {
    return (
        <div>
            <Topheader />
            <DesktopNavNew />
            <OrderCutoffBar />
            <Stocksection />
            <Filters />
            <ShopCategory />
            <TrendingNearYou />
            <NearStoreSection />

            <WarrantyCards />
            <Footer />
        </div>
    );
}