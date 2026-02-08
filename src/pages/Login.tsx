import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, loginAsDemo } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate('/');
    } else {
      toast({ title: 'Login failed', description: 'Invalid email or password.', variant: 'destructive' });
    }
  };

  const handleDemo = () => {
    loginAsDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
              <Receipt className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to Quick Receipt</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox checked={remember} onCheckedChange={v => setRemember(!!v)} id="remember" />
                <Label htmlFor="remember" className="text-sm cursor-pointer">Remember me</Label>
              </div>
              <button type="button" className="text-sm text-primary hover:underline">Forgot password?</button>
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleDemo}>
              Try Demo Access
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
