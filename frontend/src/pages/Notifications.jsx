import { useState, useEffect } from "react";
import { useAuth, api } from "@/App";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Bell, RefreshCw, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get("/swap-requests/incoming"),
        api.get("/swap-requests/outgoing"),
      ]);
      setIncomingRequests(incomingRes.data);
      setOutgoingRequests(outgoingRes.data);
    } catch (error) {
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, accepted) => {
    try {
      await api.post(`/swap-response/${requestId}`, { accepted });
      toast.success(accepted ? "Swap accepted!" : "Swap rejected");
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to respond to swap");
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
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={fetchRequests}
              data-testid="refresh-notifications-button"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Incoming Requests */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Incoming Requests</h2>
              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No incoming swap requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white p-6 rounded-lg shadow-sm border-2 border-yellow-200 fade-in"
                      data-testid={`incoming-request-${request.id}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-semibold" data-testid={`requester-name-${request.id}`}>
                              {request.requester_name}
                            </span>{" "}
                            wants to swap:
                          </p>
                        </div>
                        <span className="status-badge pending" data-testid={`request-status-${request.id}`}>Pending</span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-semibold">They offer:</p>
                          <h3 className="font-semibold text-lg" data-testid={`requester-slot-title-${request.id}`}>
                            {request.requester_slot?.title}
                          </h3>
                          <p className="text-sm text-gray-600" data-testid={`requester-slot-time-${request.id}`}>
                            {request.requester_slot &&
                              format(
                                new Date(request.requester_slot.start_time),
                                "MMM dd, yyyy 'at' h:mm a"
                              )}{" "}
                            →{" "}
                            {request.requester_slot &&
                              format(new Date(request.requester_slot.end_time), "h:mm a")}
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-semibold">For your:</p>
                          <h3 className="font-semibold text-lg" data-testid={`target-slot-title-${request.id}`}>
                            {request.target_slot?.title}
                          </h3>
                          <p className="text-sm text-gray-600" data-testid={`target-slot-time-${request.id}`}>
                            {request.target_slot &&
                              format(
                                new Date(request.target_slot.start_time),
                                "MMM dd, yyyy 'at' h:mm a"
                              )}{" "}
                            →{" "}
                            {request.target_slot &&
                              format(new Date(request.target_slot.end_time), "h:mm a")}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleResponse(request.id, true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          data-testid={`accept-swap-${request.id}`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Swap
                        </Button>
                        <Button
                          onClick={() => handleResponse(request.id, false)}
                          variant="outline"
                          className="flex-1"
                          data-testid={`reject-swap-${request.id}`}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Outgoing Requests</h2>
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No outgoing swap requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white p-6 rounded-lg shadow-sm border fade-in"
                      data-testid={`outgoing-request-${request.id}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Swap request sent to{" "}
                            <span className="font-semibold" data-testid={`target-user-name-${request.id}`}>
                              {request.target_user_name}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`status-badge ${request.status.toLowerCase()}`}
                          data-testid={`outgoing-status-${request.id}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-semibold">You offered:</p>
                          <h3 className="font-semibold text-lg" data-testid={`outgoing-requester-slot-title-${request.id}`}>
                            {request.requester_slot?.title}
                          </h3>
                          <p className="text-sm text-gray-600" data-testid={`outgoing-requester-slot-time-${request.id}`}>
                            {request.requester_slot &&
                              format(
                                new Date(request.requester_slot.start_time),
                                "MMM dd, yyyy 'at' h:mm a"
                              )}{" "}
                            →{" "}
                            {request.requester_slot &&
                              format(new Date(request.requester_slot.end_time), "h:mm a")}
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-semibold">For their:</p>
                          <h3 className="font-semibold text-lg" data-testid={`outgoing-target-slot-title-${request.id}`}>
                            {request.target_slot?.title}
                          </h3>
                          <p className="text-sm text-gray-600" data-testid={`outgoing-target-slot-time-${request.id}`}>
                            {request.target_slot &&
                              format(
                                new Date(request.target_slot.start_time),
                                "MMM dd, yyyy 'at' h:mm a"
                              )}{" "}
                            →{" "}
                            {request.target_slot &&
                              format(new Date(request.target_slot.end_time), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
