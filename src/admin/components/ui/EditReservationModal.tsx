import { Button } from "@/user/components/ui/button";
import { Input } from "@/user/components/ui/input";
import { motion } from "framer-motion";
import { ReservationType } from "@/user/lib/types/reservations";
import { useEffect } from "react";
import { useState } from "react";

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationType | null;
  onSave: (updatedReservation: ReservationType) => void;
}

export default function EditReservationModal({
  isOpen,
  onClose,
  reservation,
  onSave,
}: EditReservationModalProps) {
  const [updatedReservation, setUpdatedReservation] = useState<ReservationType | null>(reservation);

  useEffect(() => {
    setUpdatedReservation(reservation);
  }, [reservation]);

  if (!isOpen || !updatedReservation) return null;

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
        <h2 className="text-xl font-bold mb-4">Edit Reservation</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(updatedReservation);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <Input
              type="date"
              value={updatedReservation.date}
              onChange={(e) =>
                setUpdatedReservation({ ...updatedReservation, date: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <Input
              type="time"
              value={updatedReservation.time}
              onChange={(e) =>
                setUpdatedReservation({ ...updatedReservation, time: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comments</label>
            <Input
              value={updatedReservation.comments || ""}
              onChange={(e) =>
                setUpdatedReservation({ ...updatedReservation, comments: e.target.value })
              }
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

