
import { Button } from "@/user/components/ui/button";
import { Input } from "@/user/components/ui/input";
import { motion } from "framer-motion";
import { useState } from "react";
import { useEffect } from "react";
import { OrderType } from "@/user/lib/types/orders";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderType | null;
  onSave: (updatedOrder: OrderType) => void;
}

export default function EditOrderModal({ isOpen, onClose, order, onSave }: EditOrderModalProps) {
  const [updatedOrder, setUpdatedOrder] = useState<OrderType | null>(order);

  useEffect(() => {
    setUpdatedOrder(order);
  }, [order]);

  if (!isOpen || !updatedOrder) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg p-6 w-full max-w-md"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        <h2 className="text-xl font-bold mb-4">Edit Order</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(updatedOrder);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <Input
              type="number"
              value={updatedOrder.quantity}
              onChange={(e) =>
                setUpdatedOrder({ ...updatedOrder, quantity: parseInt(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery Address</label>
            <Input
              value={updatedOrder.delivery_address}
              onChange={(e) =>
                setUpdatedOrder({ ...updatedOrder, delivery_address: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit">Save</Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

