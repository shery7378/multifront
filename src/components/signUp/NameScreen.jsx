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
        <label htmlFor="firstName" className="mb-2 inline-block text-sm font-medium text-gray-700">
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
          className="w-full h-12 px-4 border border-gray-200 rounded-lg bg-gray-100 shadow-sm focus:outline-none focus:ring-0 focus:border-gray-200"
        />
        
        <label htmlFor="lastName" className="mb-2 inline-block text-sm font-medium text-gray-700 mt-4">
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
          className="w-full h-12 px-4 border border-gray-200 rounded-lg bg-gray-100 shadow-sm focus:outline-none focus:ring-0 focus:border-gray-200"
        />
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      </div>
      <div className="mt-6">
        <Button
          onClick={onNext}
          variant="primary"
          fullWidth
          disabled={!isValid || loading}
          className={`h-12 rounded-lg ${!isValid || loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Loading..." : "Next"}
        </Button>
      </div>
    </>
  );
}