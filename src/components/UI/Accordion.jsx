//src/components/UI/Accordion.jsx
"use client";

import React, { useState } from "react";
import IconButton from "./IconButton";
import { FaCartShopping, FaChevronDown, FaChevronUp } from "react-icons/fa6";

const Accordion = ({
    title,
    children,
    icon = FaCartShopping,
    iconProps = {},
    showIcon = true,
    subheading = "",
    showSubheading = false,
    chevronColor = "text-oxford-blue",
    baseClasses = "mt-4 bg-white rounded-lg shadow",
    buttonClasses = "flex justify-between items-center w-full p-4",
    iconButtonClasses = "w-8 h-8 border !cursor-auto hover:!bg-transparent hover:!border-gray-200 hover:!shadow-none focus:!ring-0 focus:!outline-none focus:!border-gray-200",
    titleClasses = "font-semibold text-sm text-oxford-blue",
    subheadingClasses = "text-xs text-gray-500",
    chevronClasses = "text-oxford-blue",
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={baseClasses}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClasses}
            >
                <div className="flex flex-row gap-2 items-center text-start">
                    {showIcon && (
                        <IconButton
                            icon={icon}
                            iconClasses="!w-4 !h-4"
                            className={iconButtonClasses}
                            {...iconProps}
                        />
                    )}
                    <div className="grid">
                        <span className={titleClasses}>{title}</span>
                        {showSubheading && <span className={subheadingClasses}>{subheading}</span>}
                    </div>
                </div>
                <span className={`${chevronClasses} ${chevronColor}`}>
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px]" : "max-h-0"}`}
            >
                {isOpen && <div className="p-4">{children}</div>}
            </div>
        </div>
    );
};

export default Accordion;

// Example 1: Basic Usage with Default Settings
{/* <Accordion title="Cart Summary (1 item)">
    <p>This is the content of the accordion. It can contain any information you want!</p>
</Accordion> */}

// Example 2: Custom Icon and No Icon Option
{/* <Accordion title="User Profile" icon={FaUser}>
    <p>User details go here.</p>
</Accordion> */}

{/* <Accordion title="Settings" showIcon={false}>
    <p>Configuration options here.</p>
</Accordion> */}

// Example 3: Custom Styling and Chevron Color

{/* <Accordion
    title="Notifications"
    icon={FaBell}
    chevronColor="text-vivid-red"
    baseClasses="mt-4 bg-gray-100 rounded-lg shadow-lg"
    buttonClasses="flex justify-between items-center w-full p-6 bg-gray-200"
    titleClasses="font-bold text-md text-gray-800"
>
    <p>Notification content here.</p>
</Accordion> */}

// Example 4: Dynamic Content with Integration

{/* <Accordion title="Shopping Bag" icon={FaShoppingBag}>
    <ul>
        {items.map((item) => (
            <li key={item.id} className="py-2 border-b">
                {item.name} - {item.price}
            </li>
        ))}
    </ul>
</Accordion> */}

// Example 5: Custom Icon with Props and Subheading
{/* <Accordion
    title="User Profile"
    icon={FaUser}
    iconProps={{ className: "!text-vivid-red" }}
    showIcon={true}
    subheading="Last updated: June 16, 2025"
    showSubheading={true}
    subheadingClasses="text-xs text-gray-600"
>
    <p>User details go here.</p>
</Accordion> */}

// Example 6: Custom Icon Props and Styled Subheading
{/* <Accordion
    title="Notifications"
    icon={FaBell}
    iconProps={{ className: "!w-4 !h-4 !text-yellow-500" }}
    subheading="New alerts available"
    showSubheading={true}
    chevronColor="text-yellow-500"
    baseClasses="mt-4 bg-gray-100 rounded-lg shadow-lg"
    buttonClasses="flex justify-between items-center w-full p-6 bg-gray-200"
    titleClasses="font-bold text-md text-gray-800"
    subheadingClasses="text-sm text-gray-400 italic"
>
    <p>Notification content here.</p>
</Accordion> */}