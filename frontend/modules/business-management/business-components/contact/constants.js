import { useEffect, useMemo, useState } from "react";
import { fetchPublicSettings } from "../../../../src/services/api/publicSettings";

export const CONTACT_SETTING_KEYS = {
  address: "site.address",
  email: "site.contact.email",
  phone: "site.contact.phone",
  description: "site.description",
  logo: "site.logo",
  name: "site.name",
};

export const fallbackContactDetails = {
  address: "",
  email: "info@digitalaela.com",
  phone: "+971 545454982",
  description: "Learn, Earn, and Grow",
  logo: "",
  name: "Digital AELA",
};

export const supportNote =
  "We respond to all enquiries within 24 hours. Priority support is available for enrolled learners and corporate partners.";

const getSettingValue = (settings, key, fallback = "") => {
  const setting = settings.find((item) => item.key === key);
  const value = setting?.value;
  return value === undefined || value === null || value === "" ? fallback : value;
};

export const normalizePhoneForHref = (phone = "") => {
  const trimmedPhone = String(phone).trim();
  if (!trimmedPhone) return "";
  const hasPlus = trimmedPhone.startsWith("+");
  const digits = trimmedPhone.replace(/\D/g, "");
  return digits ? `${hasPlus ? "+" : ""}${digits}` : "";
};

export const normalizePhoneForWhatsApp = (phone = "") =>
  String(phone).replace(/\D/g, "");

export const getContactDetailsFromSettings = (settings = []) => ({
  address: getSettingValue(
    settings,
    CONTACT_SETTING_KEYS.address,
    fallbackContactDetails.address
  ),
  email: getSettingValue(
    settings,
    CONTACT_SETTING_KEYS.email,
    fallbackContactDetails.email
  ),
  phone: getSettingValue(
    settings,
    CONTACT_SETTING_KEYS.phone,
    fallbackContactDetails.phone
  ),
  description: getSettingValue(
    settings,
    CONTACT_SETTING_KEYS.description,
    fallbackContactDetails.description
  ),
  logo: getSettingValue(
    settings,
    CONTACT_SETTING_KEYS.logo,
    fallbackContactDetails.logo
  ),
  name: getSettingValue(
    settings,
    CONTACT_SETTING_KEYS.name,
    fallbackContactDetails.name
  ),
});

export const fetchDynamicContactDetails = async () => {
  const response = await fetchPublicSettings({ category: "general" });
  return getContactDetailsFromSettings(response?.settings?.general || []);
};

export const buildSupportItems = (contactDetails = fallbackContactDetails) => {
  const details = { ...fallbackContactDetails, ...contactDetails };
  const phoneHref = normalizePhoneForHref(details.phone);
  const whatsappPhone = normalizePhoneForWhatsApp(details.phone);
  const whatsappMessage = encodeURIComponent(`Hello ${details.name}!`);

  return [
    {
      icon: "Call",
      title: "Call our support",
      description: details.phone,
      subtext: "Sunday - Saturday | 9:00 AM - 9:00 PM (Gulf Standard Time)",
      href: phoneHref ? `tel:${phoneHref}` : undefined,
    },
    {
      icon: "WA",
      title: "WhatsApp Advisor",
      description: "Chat instantly with our team",
      href: whatsappPhone
        ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
        : undefined,
    },
    {
      icon: "Mail",
      title: "Email",
      description: details.email,
      href: details.email ? `mailto:${details.email}` : undefined,
    },
    ...(details.address
      ? [
          {
            icon: "Map",
            title: "Office Address",
            description: details.address,
          },
        ]
      : []),
  ];
};

export const defaultSupportItems = buildSupportItems(fallbackContactDetails);

export const useDynamicContactDetails = () => {
  const [contactDetails, setContactDetails] = useState(fallbackContactDetails);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadContactDetails = async () => {
      try {
        const details = await fetchDynamicContactDetails();
        if (isMounted) {
          setContactDetails(details);
        }
      } catch (error) {
        console.error("Failed to load dynamic contact details:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContactDetails();

    return () => {
      isMounted = false;
    };
  }, []);

  const supportItems = useMemo(
    () => buildSupportItems(contactDetails),
    [contactDetails]
  );

  return {
    contactDetails,
    supportItems,
    supportNote,
    isLoading,
  };
};
