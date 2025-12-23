// src/components/frontHeader/ModalContainer.jsx
'use client';

import PostcodeModal from '@/components/PostcodeModal';
import LocationAllowModal from "@/components/LocationAllowModal";
import EmptyCartModal from '@/components/modals/EmptyCartModal';
import CheckOutModal from '@/components/modals/CheckOutModal';
import EstimatedArrivalModal from '@/components/modals/EstimatedArrivalModal';
import PromotionsModal from '@/components/modals/PromotionsModal';
import StoreAddReviewModal from '@/components/modals/StoreAddReviewModal';
import OrderReceivedModal from '@/components/modals/OrderReceivedModal';

export default function ModalContainer({
  isModalOpen,
  setIsModalOpen,
  postcode,
  handleSavePostcode,
  isCartModalOpen,
  setIsCartModalOpen,
  isCheckOutModalOpen,
  setIsCheckOutModalOpen,
  isEstimatedArrivalOpen,
  setIsEstimatedArrivalOpen,
  isStoreAddReviewOpen,
  setIsStoreAddReviewOpen,
  isOrderReceivedOpen,
  setIsOrderReceivedOpen,
}) {
  return (
    <>
      {/* <PostcodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePostcode}
        /> */}

      <LocationAllowModal
        isOpen={isModalOpen}
        // isOpen={isModalAutoLocationOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePostcode}
      />
      <EmptyCartModal isOpen={isCartModalOpen} onClose={() => setIsCartModalOpen(false)} />
      <CheckOutModal
        isOpen={isCheckOutModalOpen}
        onClose={() => setIsCheckOutModalOpen(false)}
      />
      <EstimatedArrivalModal
        isOpen={isEstimatedArrivalOpen}
        onClose={() => setIsEstimatedArrivalOpen(false)}
      />
      <PromotionsModal />
      <StoreAddReviewModal
        isOpen={isStoreAddReviewOpen}
        onClose={() => setIsStoreAddReviewOpen(false)}
        rating={2}
      />
      <OrderReceivedModal
        isOpen={isOrderReceivedOpen}
        onClose={() => setIsOrderReceivedOpen(false)}
        rating={2}
      />
    </>
  );
}