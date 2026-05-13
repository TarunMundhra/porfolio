"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavStore } from "@/store/useNavStore";
import AboutPage from "./AboutPage";
import ProjectsPage from "./ProjectsPage";
import ExperiencePage from "./ExperiencePage";
import ContactPage from "./ContactPage";

const pageComponents = {
  about: AboutPage,
  projects: ProjectsPage,
  experience: ExperiencePage,
  contact: ContactPage,
};

export default function PageTransition() {
  const { currentPage } = useNavStore();
  const PageComponent = pageComponents[currentPage];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        <PageComponent />
      </motion.div>
    </AnimatePresence>
  );
}
