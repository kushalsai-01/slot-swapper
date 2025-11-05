import { useState, useEffect } from "react";
import { useAuth, api } from "@/App";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, ArrowLeft, ShoppingBag, RefreshCw, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [mySwappableSlots, setMySwappableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMySlot, setSelectedMySlot] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, myEventsRes] = await Promise.all([
        api.get("/swappable-slots"),
        api.get("/events"),
      ]);
      setSlots(slotsRes.data);
      setMySwappableSlots(myEventsRes.data.filter((e) => e.status === "SWAPPABLE"));
    } catch (error) {
      toast.error("Failed to fetch slots");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = (slot) => {
    if (mySwappableSlots.length === 0) {
      toast.error("You need to have at least one swappable slot to request a swap");
      return;
    }
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (!selectedMySlot) {
      toast.error("Please select one of your slots");
      return;
    }

    try {
      await api.post("/swap-request", {
        my_slot_id: selectedMySlot,
        their_slot_id: selectedSlot.id,
      });
      toast.success("Swap request sent successfully!");
      setDialogOpen(false);
      setSelectedSlot(null);
      setSelectedMySlot(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send swap request");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                data-testid="back-to-dashboard-button"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={fetchData}
              data-testid="refresh-marketplace-button"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Available Slots</h2>
          <p className="text-gray-600 mt-1">
            Browse and request swaps from other users' available time slots
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading available slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No available slots</p>
            <p className="text-gray-500 mt-2">
              Check back later for swappable time slots from other users
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {slots
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
              .map((slot) => (
                <div
                  key={slot.id}
                  className="time-slot swappable p-6 rounded-lg shadow-sm fade-in"
                  data-testid={`marketplace-slot-${slot.id}`}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid={`slot-title-${slot.id}`}>
                      {slot.title}
                    </h3>
                    <p className="text-sm text-gray-600" data-testid={`slot-owner-${slot.id}`}>
                      Offered by: <span className="font-semibold">{slot.user_name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <span data-testid={`slot-start-${slot.id}`}>
                      {format(new Date(slot.start_time), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                    <span>→</span>
                    <span data-testid={`slot-end-${slot.id}`}>
                      {format(new Date(slot.end_time), "h:mm a")}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleRequestSwap(slot)}
                    className="w-full"
                    data-testid={`request-swap-${slot.id}`}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Request Swap
                  </Button>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Swap Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="swap-dialog">
          <DialogHeader>
            <DialogTitle>Select Your Slot to Swap</DialogTitle>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">You're requesting:</p>
                <h3 className="font-semibold text-lg" data-testid="swap-dialog-target-title">{selectedSlot.title}</h3>
                <p className="text-sm text-gray-600" data-testid="swap-dialog-target-time">
                  {format(new Date(selectedSlot.start_time), "MMM dd, yyyy 'at' h:mm a")} →{" "}
                  {format(new Date(selectedSlot.end_time), "h:mm a")}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Select one of your swappable slots to offer:
                </p>

                {mySwappableSlots.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">
                    You don't have any swappable slots
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {mySwappableSlots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedMySlot(slot.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedMySlot === slot.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        data-testid={`my-slot-${slot.id}`}
                      >
                        <h4 className="font-semibold">{slot.title}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(slot.start_time), "MMM dd, yyyy 'at' h:mm a")} →{" "}
                          {format(new Date(slot.end_time), "h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedSlot(null);
                    setSelectedMySlot(null);
                  }}
                  className="flex-1"
                  data-testid="cancel-swap-button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSwap}
                  disabled={!selectedMySlot}
                  className="flex-1"
                  data-testid="confirm-swap-button"
                >
                  Confirm Swap Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
