"use client";

import React, { useCallback, useState } from "react";
import Button from "@/components/UI/Button";

export default function PersonaVerifyButton({
  type = "kyb", // 'kyc' or 'kyb'
  referenceId,   // your user/vendor id
  className = "",
  label = "Verify with Persona",
}) {
  const [loading, setLoading] = useState(false);

  const startVerification = useCallback(async () => {
    // Persona JS SDK is not available in this environment.
    // Keep the button but just show a message so the build
    // does not depend on @persona-im/inquiry.
    alert("Online verification is not configured on this server yet.");
  }, [type, referenceId]);

  return (
    <Button onClick={startVerification} disabled={loading} className={className}>
      {loading ? "Starting..." : label}
    </Button>
  );
}
