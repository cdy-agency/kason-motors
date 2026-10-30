import { cookies } from "next/headers";
import Navbar from "@/components/landingPage/Navbar";
import Hero from "@/components/landingPage/Hero";
import SearchSection from "@/components/landingPage/SearchSection";
import BrowseByType from "@/components/landingPage/BrowseByType";
import FeaturedCars from "@/components/landingPage/FeaturedCars";
import WhyChooseUs from "@/components/landingPage/WhyChooseUs";
import LatestBlogNews from "@/components/landingPage/LatestBlogNews";
import Testimonials from "@/components/landingPage/Testimonials";
import Footer from "@/components/landingPage/Footer";
import ContactPopup from "@/components/landingPage/ContactPopup";
import { getProfileByUserId } from "@/lib/profiles";
import { verifyAuthToken } from "@/lib/auth/token";
import { AUTH_COOKIE_NAME } from "@/lib/auth/token";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  let user = null;
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      const profile = await getProfileByUserId(payload!.sub);
      if (profile) {
        user = {
          fullName: profile.full_name ?? "",
          email: profile.email,
          role: profile.role,
        };
      }
    } catch {
      // invalid/expired token — treat as guest
    }
  }

  return (
    <main>
      <Navbar user={user} />
      <Hero />
      <SearchSection />
      <BrowseByType />
      <FeaturedCars />
      <WhyChooseUs />
      <LatestBlogNews />
      <Testimonials />
      <Footer />
      <ContactPopup />
    </main>
  );
}
