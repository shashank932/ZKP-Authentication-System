import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import RoleSelection from "../components/RoleSelection";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef7f4] px-4 py-6 md:px-8 md:py-10">
      <div className="med-hero-shape -left-20 -top-16 h-64 w-64 bg-[#c8efe7]" />
      <div className="med-hero-shape bottom-10 -right-20 h-72 w-72 bg-[#d4f4ed]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2.25rem] border border-[#d4e7e1] bg-white/72 shadow-[0_22px_70px_rgba(12,80,74,0.14)] lg:grid-cols-[1.5fr_1fr]">
          <HeroSection />
          <RoleSelection onSelect={navigate} />
        </div>
      </div>
    </div>
  );
}
