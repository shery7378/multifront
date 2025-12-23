//src/components/PickupDrawer.jsx
'use client';
import RightDrawer from '@/components/UI/RightDrawer';
import PickUpMap from '@/components/PickUpMap';

export default function PickupDrawer({
    isOpen,
    onClose,
    initialOpenState = false,
    storageKey = 'pickup_drawer_state',
    width = 300,
    swipeToOpen = true,
    onToggle,
}) {
    const handleToggle = (newState) => {
        if (!newState) onClose(); // Close drawer when toggled off
        if (onToggle) onToggle(newState);
    };

    return (
        <RightDrawer
            initialOpenState={initialOpenState}
            storageKey={storageKey}
            position="right"
            width={width}
            swipeToOpen={swipeToOpen}
            onToggle={handleToggle}
        >
            <PickUpMap />
        </RightDrawer>
    );
}