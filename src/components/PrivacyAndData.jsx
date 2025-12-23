//src/components/PrivacyAndData.jsx
'use client';
import React from 'react';
import IconButton from './UI/IconButton';
import { GoArrowUpRight } from "react-icons/go";
import ResponsiveText from './UI/ResponsiveText';

export default function PrivacyAndData() {
    const privacyItems = [
        {
            title: 'Privacy Center',
            description: 'Take control of your privacy and learn how we protect it.',
            learnMoreLink: '', // Optional link
            icon: GoArrowUpRight, // Optional icon
        },
        {
            title: 'Third-party apps with account access',
            description: 'Once you allow access to third party apps, you`ll see them here',
            learnMoreLink: '/privacy-center', // No link for this item
            icon: undefined, // No icon for this item
        },
    ];

    return (
        <div className="p-4">
            {privacyItems.map((item, index) => (
                <div
                    key={index}
                    className="border-b border-gray-200 py-4 flex justify-between items-center last:border-b-0"
                >
                    <div>
                        <ResponsiveText as="h3" minSize="16px" maxSize="20px" className="text-oxford-blue font-medium">
                            {item.title}
                        </ResponsiveText>
                        <ResponsiveText as="p" minSize="12px" maxSize="14px" className="text-oxford-blue/60 mt-1">
                            {item.description}
                            {item.learnMoreLink && (
                                <a
                                    href={item.learnMoreLink}
                                    className="text-vivid-red text-sm ml-1 underline font-medium hover:no-underline"
                                >
                                    Learn more
                                </a>
                            )}
                        </ResponsiveText>
                    </div>
                    {item.icon && (
                        <IconButton
                            icon={item.icon}
                            iconClasses=""
                            className="min-w-10 min-h-10"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}