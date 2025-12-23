//src/components/DeliveryOptions.jsx
import React from 'react'
import RadioButton from './UI/RadioButton'
import IconButton from './UI/IconButton'
import { TbDirectionSignFilled } from "react-icons/tb";
import { FaWandMagicSparkles } from 'react-icons/fa6'
import ResponsiveText from './UI/ResponsiveText';
import { useDispatch, useSelector } from 'react-redux';
import { setDeliveryOption } from '@/store/slices/checkoutSlice';

export default function DeliveryOptions() {
    const dispatch = useDispatch();
    const selectedOption = useSelector((state) => state.checkout?.deliveryOption) || null;

    const handleOptionChange = (value) => {
        dispatch(setDeliveryOption(value));
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="my-1">
                <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue mb-4">Delivery Options</ResponsiveText>
            </div>

            <div className="mt-2 space-y-3">
                {/* Priority */}
                <div className="flex items-center px-5 justify-between border border-gray-200 rounded-md h-[60px]">
                    <div className="space-x-2 items-center flex">
                        <span className="w-8 inline-block">
                            <IconButton icon={TbDirectionSignFilled} iconClasses="" className=" rotate-270" />
                        </span>
                        <label htmlFor="priority" className="text-xs text-sonic-silver cursor-pointer">
                            <span className="block font-semibold text-sm text-oxford-blue">Priority</span>
                            10-20 min - Delivered directly to you</label>
                    </div>
                    <RadioButton 
                        name="delivery" 
                        size="lg" 
                        value="priority" 
                        id='priority'
                        checked={selectedOption === 'priority'}
                        onChange={() => handleOptionChange('priority')}
                    />
                </div>
                {/* Standard  */}
                <div className="flex items-center px-5 justify-between border border-gray-200 rounded-md h-[60px]">
                    <div className="space-x-2 items-center flex">
                        <span className="w-8 inline-block">
                            <IconButton icon={FaWandMagicSparkles} iconClasses="!w-4 !h-4" className="" />
                        </span>
                        <label htmlFor="standard" className="text-xs text-sonic-silver cursor-pointer">
                            <span className="block font-semibold text-sm text-oxford-blue">Standard</span>
                            10:20 min</label>
                    </div>
                    <RadioButton 
                        name="delivery" 
                        size="lg" 
                        value="standard" 
                        id='standard'
                        checked={selectedOption === 'standard'}
                        onChange={() => handleOptionChange('standard')}
                    />
                </div>
            </div>
        </div>
    )
}

