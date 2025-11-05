import { useState, useEffect } from "react";
import { useAuth, api } from "@/App";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Calendar, Plus, LogOut, ShoppingBag, Bell, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // New event form
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("BUSY");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events");
      setEvents(response.data);
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/events", {
        title,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        status,
      });
      toast.success("Event created successfully!");
      setDialogOpen(false);
      setTitle("");
      setStartTime("");
      setEndTime("");
      setStatus("BUSY");
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create event");
    }
  };

  const handleUpdateStatus = async (eventId, newStatus) => {
    try {
      await api.put(`/events/${eventId}`, { status: newStatus });
      toast.success(`Event marked as ${newStatus.toLowerCase()}`);
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${eventId}`);
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/events/${editingEvent.id}`, {
        title: editingEvent.title,
        start_time: new Date(editingEvent.start_time).toISOString(),
        end_time: new Date(editingEvent.end_time).toISOString(),
        status: editingEvent.status,
      });
      toast.success("Event updated successfully!");
      setEditDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const openEditDialog = (event) => {
    setEditingEvent({
      ...event,
      start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
    });
    setEditDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">SlotSwapper</h1>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/marketplace")}
                data-testid="marketplace-nav-button"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Marketplace
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/notifications")}
                data-testid="notifications-nav-button"
              >
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900" data-testid="user-name">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Calendar</h2>
            <p className="text-gray-600 mt-1">Manage your schedule and time slots</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" data-testid="create-event-button">
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-event-dialog">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Team Meeting"
                    required
                    data-testid="event-title-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    data-testid="event-start-time-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    data-testid="event-end-time-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="event-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUSY" data-testid="status-busy">Busy</SelectItem>
                      <SelectItem value="SWAPPABLE" data-testid="status-swappable">Swappable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" data-testid="create-event-submit-button">
                  Create Event
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No events yet</p>
            <p className="text-gray-500 mt-2">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
              .map((event) => (
                <div
                  key={event.id}
                  className={`time-slot ${event.status.toLowerCase().replace('_', '-')} p-6 rounded-lg shadow-sm fade-in`}
                  data-testid={`event-${event.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900" data-testid={`event-title-${event.id}`}>
                          {event.title}
                        </h3>
                        <span className={`status-badge ${event.status.toLowerCase().replace('_', '-')}`} data-testid={`event-status-${event.id}`}>
                          {event.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span data-testid={`event-start-${event.id}`}>
                          {format(new Date(event.start_time), "MMM dd, yyyy 'at' h:mm a")}
                        </span>
                        <span>→</span>
                        <span data-testid={`event-end-${event.id}`}>
                          {format(new Date(event.end_time), "h:mm a")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(event)}
                        data-testid={`edit-event-${event.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {event.status === "BUSY" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(event.id, "SWAPPABLE")}
                          data-testid={`make-swappable-${event.id}`}
                        >
                          Make Swappable
                        </Button>
                      )}
                      {event.status === "SWAPPABLE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(event.id, "BUSY")}
                          data-testid={`make-busy-${event.id}`}
                        >
                          Mark as Busy
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        data-testid={`delete-event-${event.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="edit-event-dialog">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input
                  id="edit-title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  required
                  data-testid="edit-event-title-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="datetime-local"
                  value={editingEvent.start_time}
                  onChange={(e) => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                  required
                  data-testid="edit-event-start-time-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="datetime-local"
                  value={editingEvent.end_time}
                  onChange={(e) => setEditingEvent({ ...editingEvent, end_time: e.target.value })}
                  required
                  data-testid="edit-event-end-time-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingEvent.status}
                  onValueChange={(value) => setEditingEvent({ ...editingEvent, status: value })}
                >
                  <SelectTrigger data-testid="edit-event-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUSY">Busy</SelectItem>
                    <SelectItem value="SWAPPABLE">Swappable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" data-testid="edit-event-submit-button">
                Update Event
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
