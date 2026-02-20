// src/components/signUp/NameScreen.jsx
"use client";
import { useState } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";

export default function NameScreen({ firstName, lastName, onNext, onBack, onFirstNameChange, onLastNameChange, error }) {

  const [localFirstName, setLocalFirstName] = useState(firstName || "");
  const [localLastName, setLocalLastName] = useState(lastName || "");

  const isValid = localFirstName.trim() !== "" && localLastName.trim() !== ""; // Basic validation for non-empty fields
  const loading = false; // Assuming no loading state is passed; adjust if needed

  return (
    <>
      <div className="text-start">
        <label htmlFor="firstName" className="mb-[9px] inline-block text-base font-normal text-[#000000]">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          placeholder="Your name"
          value={localFirstName}
          onChange={(e) => {
            setLocalFirstName(e.target.value);
            onFirstNameChange(e);
          }}
          className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
        />
        
        <label htmlFor="lastName" className="mb-[9px] inline-block text-base font-normal text-[#000000] mt-4">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          placeholder="Your name"
          value={localLastName}
          onChange={(e) => {
            setLocalLastName(e.target.value);
            onLastNameChange(e);
          }}
          className="email-input w-full px-4 py-4.5 bg-[#F4F4F4] border-0 text-[#00000080] text-base font-normal placeholder:text-[#00000080] rounded-[6px] shadow-none focus:outline-none focus:ring-0  focus:border-0"
        />
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      </div>
      <div className="mt-6">
        <Button
          onClick={onNext}
          variant="primary"
          fullWidth
          disabled={!isValid || loading}
          className={`!rounded-[6px] lg:h-[60px] h-[46px] ${!isValid || loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Loading..." : "Next"}
        </Button>
      </div>
    </>
  );
}