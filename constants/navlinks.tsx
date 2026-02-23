import {
  IconArticle,
  IconBolt,
  IconBriefcase2,
  IconMail,
  IconMessage2,
  IconTarget,
  IconFileText,
} from "@tabler/icons-react";

export const navlinks = [
  {
    url: "/",
    label: "Home",
    icon: IconBolt,
  },
  {
    url: "/dashboard/goals",
    label: "Goals",
    icon: IconTarget,
  },
  {
    url: "/dashboard/examples",
    label: "Examples",
    icon: IconFileText,
  },
  {
    url: "/about",
    label: "About",
    icon: IconMessage2,
  },
  {
    url: "/projects",
    label: "Projects",
    icon: IconBriefcase2,
  },
  {
    url: "/blog",
    label: "Articles",
    icon: IconArticle,
  },
  {
    url: "/contact",
    label: "Contact",
    icon: IconMail,
  },
];
