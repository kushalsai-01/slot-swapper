import { useState } from "react";
import { useAuth, api } from "@/App";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, ArrowRight } from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/signup", {
        name,
        email,
        password,
        timezone,
      });
      login(response.data.token, response.data.user);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">SlotSwapper</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-md">
            Join thousands of users who are optimizing their schedules through
            peer-to-peer slot swapping. Manage your time better, together.
          </p>
        </div>
        <div className="text-white/80 text-sm">
          © 2025 SlotSwapper. Built for ServiceHive.
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <Clock className="w-10 h-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">SlotSwapper</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
            <p className="mt-2 text-gray-600">Join SlotSwapper today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="signup-form">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="signup-name-input"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="signup-email-input"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)>
                required
                minLength={6}
                data-testid="signup-password-input"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                data-testid="signup-timezone-input"
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
              data-testid="signup-submit-button"
            >
              {loading ? "Creating account..." : "Create account"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
                data-testid="login-link"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
