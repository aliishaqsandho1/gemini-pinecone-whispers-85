
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, User, UserCheck } from "lucide-react";

interface CustomerSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelection: (scope: 'all' | 'single' | 'multiple') => void;
}

export const CustomerSelectionModal = ({ 
  open, 
  onOpenChange, 
  onSelection 
}: CustomerSelectionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            Select Customer Scope
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Choose which customers to include in your PDF export
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-blue-300"
            onClick={() => onSelection('all')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">All Customers</h3>
                  <p className="text-sm text-gray-600">Export data for all customers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-green-300"
            onClick={() => onSelection('single')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Single Customer</h3>
                  <p className="text-sm text-gray-600">Export data for one customer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-purple-300"
            onClick={() => onSelection('multiple')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Multiple Customers</h3>
                  <p className="text-sm text-gray-600">Select specific customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
