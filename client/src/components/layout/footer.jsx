import { FOOTER_LINKS, SOCIAL_LINKS } from "@/lib/constants";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  const getSocialIcon = (name) => {
    switch (name.toLowerCase()) {
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "youtube":
        return <Youtube className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="px-4 md:px-16 py-8 text-gray-400 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Social Media Links */}
        <div className="flex items-center mb-6">
          {SOCIAL_LINKS.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="mr-4 hover:text-white"
              aria-label={link.name}
            >
              {getSocialIcon(link.icon)}
            </a>
          ))}
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.slice(0, 3).map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:underline">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.slice(3, 6).map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:underline">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.slice(6, 9).map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:underline">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.slice(9).map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:underline">
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Service Code */}
        <div className="text-xs mb-6">
          <button className="border border-gray-600 px-2 py-1 hover:text-white">
            Service Code
          </button>
        </div>

        {/* Copyright */}
        <div className="text-xs">
          <p>© 1997-{new Date().getFullYear()} Netflix, Inc.</p>
        </div>
      </div>
    </footer>
  );
}
