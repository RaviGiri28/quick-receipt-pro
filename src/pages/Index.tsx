import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getStats } from '@/lib/storage';
import { FeatureCarousel } from '@/components/FeatureCarousel';
import { FilePlus, History, Receipt, IndianRupee, Users, FileText } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = getStats();

  const statCards = [
    { title: 'Total Receipts', value: stats.total, icon: Receipt },
    { title: "Today's Receipts", value: stats.today, icon: FileText },
    { title: 'Total Amount', value: `₹${stats.totalAmount.toLocaleString('en-IN')}`, icon: IndianRupee },
    { title: 'Active Accounts', value: stats.accounts, icon: Users },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Quick Receipt</p>
        </div>
        <Button onClick={() => navigate('/create')} className="gap-2">
          <FilePlus className="h-4 w-4" /> New Receipt
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <Card key={stat.title} className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Carousel */}
      <FeatureCarousel />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover-scale" onClick={() => navigate('/create')}>
          <CardContent className="flex items-center gap-4 p-6">
            <FilePlus className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">Create Receipt</h3>
              <p className="text-sm text-muted-foreground">Generate a new transaction receipt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover-scale" onClick={() => navigate('/history')}>
          <CardContent className="flex items-center gap-4 p-6">
            <History className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">View History</h3>
              <p className="text-sm text-muted-foreground">Search and filter past receipts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover-scale" onClick={() => navigate('/settings')}>
          <CardContent className="flex items-center gap-4 p-6">
            <Receipt className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">Customize</h3>
              <p className="text-sm text-muted-foreground">Adjust receipt settings and layout</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
