//src/components/FAQSection.jsx
"use client";
import React, { useState } from "react";
import ResponsiveText from "./UI/ResponsiveText";
import IconButton from "./UI/IconButton";
import { FaMinus, FaPlus } from "react-icons/fa";

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "Can I order McDonald's® - High Street North delivery in London with Multikonnekt?",
            answer: "You'll receive instant email or SMS alerts the moment a new review is posted—keeping you in control, wherever you are.",
        },
        {
            question: "Is McDonald's® - High Street North delivery available near me?",
            answer: "To check if McDonald's® - High Street North delivery is available in your area, please enter your postcode on the McDonald's® website or app. Delivery availability depends on your location and the restaurant's delivery radius.",
        },
        {
            question: "How do I order McDonald's® - High Street North delivery online in London?",
            answer: "You can order McDonald's® - High Street North delivery online through the McDonald's® app or website. Alternatively, you can use third-party delivery services like Uber Eats, Deliveroo, or Just Eat. Simply search for McDonald's® - High Street North, select your items, and place your order.",
        },
        {
            question: "Where can I find McDonald's® - High Street North online menu prices?",
            answer: "You can find the online menu prices for McDonald's® - High Street North on the official McDonald's® website or app. Additionally, third-party delivery platforms like Uber Eats, Deliveroo, or Just Eat will display the menu and prices when you select the High Street North location.",
        },
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full mx-auto ">
            <ResponsiveText as="h2" minSize="0.5rem" maxSize="1.375rem" className="font-semibold text-oxford-blue">
                Frequently Asked Questions
            </ResponsiveText>
            {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 py-2">
                    <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full text-left flex  text-[0.2rem] justify-between items-center py-2 gap-3 focus:outline-none"
                    >
                        <ResponsiveText as="span" minSize="7.34px" maxSize="16px" className="font-medium text-oxford-blue">
                            {faq.question}
                        </ResponsiveText>

                        <IconButton
                            className=" "
                            icon={openIndex === index ? FaMinus : FaPlus} 
                            iconClasses={openIndex === index ? '!text-black !w-3 !h-3' : ' !w-3 !h-3'}
                        />

                    </button>
                    {openIndex === index && (
                        <ResponsiveText as="p" minSize="0.8rem" maxSize="1.1rem" className="mt-2">
                            {faq.answer}
                        </ResponsiveText>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FAQSection;