import { motion } from "framer-motion";
import logo from "@/assets/images/favicon-dabablane.svg";

const Loader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: 1, 
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative">
        <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
      </motion.div>
    </div>
  );
};

export default Loader; 