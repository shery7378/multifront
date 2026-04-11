// src/components/signUp/NameScreen.jsx
"use client";
import { useState } from "react";
import ResponsiveText from "../UI/ResponsiveText";
import Button from "../UI/Button";
import Input from "../UI/Input";

export default function NameScreen({ firstName, lastName, onNext, onBack, onFirstNameChange, onLastNameChange, error }) {

  const [localFirstName, setLocalFirstName] = useState(firstName || "");
  const [localLastName, setLocalLastName] = useState(lastName || "");

  const isValid = localFirstName.trim() !== "" && localLastName.trim() !== ""; // Basic validation for non-empty fields
  const loading = false; // Assuming no loading state is passed; adjust if needed

  return (
    <>
      <div className="text-start">
        <Input
          label="First Name"
          name="firstName"
          placeholder="Your name"
          value={localFirstName}
          onChange={(e) => {
            setLocalFirstName(e.target.value);
            onFirstNameChange(e);
          }}
          error={error && error.toLowerCase().includes('first') ? error : ''}
          inputClassName="h-14"
        />
        
        <Input
          label="Last Name"
          name="lastName"
          placeholder="Your name"
          value={localLastName}
          onChange={(e) => {
            setLocalLastName(e.target.value);
            onLastNameChange(e);
          }}
          className="mt-4"
          error={error && error.toLowerCase().includes('last') ? error : ''}
          inputClassName="h-14"
        />
        {error && !error.toLowerCase().includes('first') && !error.toLowerCase().includes('last') && (
          <p className="text-red-500 text-xs mb-2 mt-2">{error}</p>
        )}
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