import { formatInr } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { receiptsApi, localIsoDate } from '@/lib/api';
import { FeatureCarousel } from '@/components/FeatureCarousel';
import { FilePlus, History, Receipt, IndianRupee, Clock, FileText } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const today = localIsoDate();
  const { data: stats, isError } = useQuery({ queryKey: ['dashboard', today], queryFn: () => receiptsApi.dashboard(today) });
  const show = (value?: number | string) => (stats ? value : isError ? '—' : '…');

  const statCards = [
    { title: 'Total Receipts', value: show(stats?.total_receipts), icon: Receipt },
    { title: "Today's Receipts", value: show(stats?.todays_receipt), icon: FileText },
    { title: 'Total Amount', value: show(stats && formatInr(stats.total_amount)), icon: IndianRupee },
    { title: 'Pending Receipts', value: show(stats?.pending_receipts), icon: Clock, clickable: true },
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
          <Card
            key={stat.title}
            className={`hover-scale ${stat.clickable ? 'cursor-pointer' : ''}`}
            onClick={stat.clickable ? () => navigate('/history?status=pending') : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.clickable && (
                <p className="text-xs text-primary mt-1">Click to view →</p>
              )}
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
        <Card className="cursor-pointer hover-scale" onClick={() => navigate('/saved')}>
          <CardContent className="flex items-center gap-4 p-6">
            <Receipt className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">Saved Receipts</h3>
              <p className="text-sm text-muted-foreground">View and manage saved receipts</p>
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
      </div>
    </div>
  );
}
