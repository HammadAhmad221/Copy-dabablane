import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PaymentLoadingProps {
  message?: string;
}

const PaymentLoading = ({ message = "Préparation du paiement... Veuillez patienter" }: PaymentLoadingProps) => {
  return (
    <div className="animate-fadeIn rounded-xl bg-white flex flex-col items-center justify-center">
      <motion.div
        animate={{ 
          rotate: 360
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
        className="text-[#E66C61] mb-4"
      >
        <Loader2 size={48} />
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600 text-center">
        Vous allez être redirigé vers la page de paiement sécurisée. Merci de ne pas fermer cette fenêtre.
      </p>
    </div>
  );
};

export default PaymentLoading; 