import { useLocation } from "wouter";
import LocationSetup from "@/components/location-setup";

export default function LocationSetupPage() {
  const [, setLocation] = useLocation();

  const handleComplete = () => {
    setLocation("/dashboard");
  };

  const handleSkip = () => {
    setLocation("/dashboard");
  };

  return (
    <LocationSetup 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
