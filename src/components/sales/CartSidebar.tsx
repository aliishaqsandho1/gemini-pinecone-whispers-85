
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ShoppingCart, User, X, Plus, Minus, UserPlus, Edit2, CreditCard, ChevronRight, ChevronLeft, Truck } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { suppliersApi } from '@/services/api';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  unit: string;
  adjustedPrice?: number; // For price negotiations
  isOutsourced?: boolean;
  supplierId?: number;
  supplierName?: string;
  outsourcingCost?: number;
}

interface CartSidebarProps {
  cart: CartItem[];
  selectedCustomer: any;
  customers: any[];
  orderStatus: string;
  paymentMethod: string;
  isCustomerDialogOpen: boolean;
  isQuickCustomerOpen: boolean;
  isCollapsed?: boolean;
  onSetSelectedCustomer: (customer: any) => void;
  onSetIsCustomerDialogOpen: (open: boolean) => void;
  onSetIsQuickCustomerOpen: (open: boolean) => void;
  onSetOrderStatus: (status: string) => void;
  onSetPaymentMethod: (method: string) => void;
  onUpdateCartQuantity: (productId: number, quantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onCheckout: () => void;
  onUpdateItemPrice?: (productId: number, newPrice: number) => void;
  onUpdateItemOutsourcing?: (productId: number, outsourcingData: { isOutsourced: boolean; supplierId?: number; supplierName?: string; outsourcingCost?: number }) => void;
  onToggleCollapse?: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  selectedCustomer,
  customers,
  orderStatus,
  paymentMethod,
  isCustomerDialogOpen,
  isQuickCustomerOpen,
  isCollapsed = false,
  onSetSelectedCustomer,
  onSetIsCustomerDialogOpen,
  onSetIsQuickCustomerOpen,
  onSetOrderStatus,
  onSetPaymentMethod,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onCheckout,
  onUpdateItemPrice,
  onUpdateItemOutsourcing,
  onToggleCollapse
}) => {
  const [priceEditingItem, setPriceEditingItem] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [isOutsourcingModalOpen, setIsOutsourcingModalOpen] = useState(false);
  const [outsourcingItemId, setOutsourcingItemId] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>("");
  const [outsourcingCost, setOutsourcingCost] = useState<string>("");

  // Fetch suppliers for outsourcing
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => suppliersApi.getAll({ limit: 100 }),
    enabled: isOutsourcingModalOpen,
  });

  const suppliers = suppliersData?.data?.suppliers || [];
  const filteredSuppliers = suppliers.filter((supplier: any) =>
    supplier.name?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const finalPrice = item.adjustedPrice || item.price;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const handlePriceEdit = (item: CartItem) => {
    setPriceEditingItem(item.productId);
    setTempPrice((item.adjustedPrice || item.price).toString());
  };

  const handlePriceSave = (productId: number) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice > 0 && onUpdateItemPrice) {
      onUpdateItemPrice(productId, newPrice);
    }
    setPriceEditingItem(null);
    setTempPrice("");
  };

  const handlePriceCancel = () => {
    setPriceEditingItem(null);
    setTempPrice("");
  };

  const handleOutsourcingOpen = (productId: number) => {
    const item = cart.find(i => i.productId === productId);
    setOutsourcingItemId(productId);
    if (item?.isOutsourced) {
      setSelectedSupplier(item.supplierId ? { id: item.supplierId, name: item.supplierName } : null);
      setOutsourcingCost(item.outsourcingCost?.toString() || "");
    } else {
      setSelectedSupplier(null);
      setOutsourcingCost("");
    }
    setIsOutsourcingModalOpen(true);
  };

  const handleOutsourcingSave = () => {
    if (!outsourcingItemId || !onUpdateItemOutsourcing) return;
    
    if (selectedSupplier && outsourcingCost) {
      onUpdateItemOutsourcing(outsourcingItemId, {
        isOutsourced: true,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        outsourcingCost: parseFloat(outsourcingCost)
      });
    } else {
      onUpdateItemOutsourcing(outsourcingItemId, {
        isOutsourced: false
      });
    }
    
    setIsOutsourcingModalOpen(false);
    setOutsourcingItemId(null);
    setSelectedSupplier(null);
    setOutsourcingCost("");
    setSupplierSearchTerm("");
  };

  const handleOutsourcingCancel = () => {
    setIsOutsourcingModalOpen(false);
    setOutsourcingItemId(null);
    setSelectedSupplier(null);
    setOutsourcingCost("");
    setSupplierSearchTerm("");
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Collapsed state - show only toggle button and cart count
  if (isCollapsed) {
    return (
      <div className="w-14 bg-card border-l border-border shadow-lg flex flex-col h-screen fixed right-0 top-0 z-40 sm:relative">
        <div className="p-2 border-b border-border bg-muted/50 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full h-8 p-0 hover:bg-accent"
            title="Expand Cart"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-2">
          <div className="relative mb-4">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            {cart.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600">
                {cart.length}
              </Badge>
            )}
          </div>

          {cart.length > 0 && (
            <div className="text-center">
              <div className="text-xs font-medium text-foreground mb-1">
                PKR {getCartTotal().toLocaleString()}
              </div>
              <Button
                onClick={onCheckout}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-8 px-2 text-xs rotate-90 whitespace-nowrap"
                style={{ writingMode: 'vertical-rl' }}
              >
                Pay
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-64 bg-card border-l border-border shadow-lg flex flex-col h-screen
      fixed right-0 top-0 z-40
      max-w-full
      sm:relative sm:w-64 sm:max-w-xs"
      style={{
        width: '100vw',
        maxWidth: 320,
      }}
    >
      <div className="flex-1 min-h-0 flex flex-col bg-card">
        {/* Toggle Button */}
        <div className="p-2 border-b border-border bg-muted/50 flex-shrink-0 flex justify-between items-center">
          <h3 className="font-medium text-card-foreground text-sm">Cart ({cart.length})</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-6 w-6 p-0 hover:bg-accent"
            title="Collapse Cart"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Customer, Payment, Order Status */}
        <div className="p-1 border-b border-border bg-muted/50 flex-shrink-0">

          {selectedCustomer ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-2 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">{selectedCustomer.name}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">{selectedCustomer.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetSelectedCustomer(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded-lg">

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetIsCustomerDialogOpen(true)}
                  className="flex-1 text-xs h-7 bg-background"
                >
                  Search customer...
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetIsQuickCustomerOpen(true)}
                  className="px-2 h-7 bg-background"
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="p-1 border-b border-border bg-muted/50 flex-shrink-0">
          <div className="space-y-2">

            <Select value={paymentMethod} onValueChange={onSetPaymentMethod}>
              <SelectTrigger className="h-8 text-xs bg-background border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-1 border-b border-border bg-muted/50 flex-shrink-0">
          <div className="space-y-2">

            <Select value={orderStatus} onValueChange={onSetOrderStatus}>
              <SelectTrigger className="h-8 text-xs bg-background border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cart Section - SCROLLABLE AREA */}
        <div className="flex-1  flex flex-col bg-card custom-scrollbar overflow-y-auto">
          <div className="p-3 border-b border-border flex-shrink-0 sticky top-0 z-20 bg-card">
            <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" />
              Items ({cart.length})
            </h3>
          </div>
          <div className="space-y-3 px-3 pt-5 pb-20 h-full overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[200px]">
                <div className="text-center py-8">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Cart is empty</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="bg-muted/50 border border-border p-2 rounded-lg mb-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-xs text-card-foreground">{item.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          Original: PKR {item.price.toLocaleString()} / {item.unit}
                        </p>
                        {item.adjustedPrice && item.adjustedPrice !== item.price && (
                          <Badge variant="secondary" className="text-xs">Negotiated</Badge>
                        )}
                        {item.isOutsourced && (
                          <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-300">
                            <Truck className="h-2 w-2 mr-1" />
                            Outsourced
                          </Badge>
                        )}
                      </div>
                      {item.isOutsourced && item.supplierName && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Supplier: {item.supplierName} • Cost: PKR {item.outsourcingCost?.toLocaleString()} per {item.unit}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFromCart(item.productId)}
                      className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Price editing section */}
                  <div className="mb-2">
                    {priceEditingItem === item.productId ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="h-6 text-xs flex-1"
                          placeholder="New price"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePriceSave(item.productId)}
                          className="h-6 w-6 p-0 bg-green-600 text-white"
                        >
                          ✓
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePriceCancel}
                          className="h-6 w-6 p-0 bg-red-600 text-white"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">
                            PKR {(item.adjustedPrice || item.price).toLocaleString()} / {item.unit}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePriceEdit(item)}
                            className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                            title="Negotiate price"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateCartQuantity(item.productId, item.quantity - 0.25)}
                        className="h-6 w-6 p-0 bg-background"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-14 text-center text-xs font-medium text-card-foreground">{item.quantity} {item.unit}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateCartQuantity(item.productId, item.quantity + 0.25)}
                        className="h-6 w-6 p-0 bg-background"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold text-blue-600 text-xs">
                      PKR {((item.adjustedPrice || item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Outsourcing Button */}
                  <div className="mt-2 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOutsourcingOpen(item.productId)}
                      className={`h-6 text-xs px-2 ${
                        item.isOutsourced 
                          ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40" 
                          : "bg-background hover:bg-muted"
                      }`}
                      title={item.isOutsourced ? "Edit outsourcing" : "Set as outsourced"}
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      {item.isOutsourced ? "Edit Outsourcing" : "Outsource"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FIXED CHECKOUT SECTION - ALWAYS VISIBLE */}
      {cart.length > 0 && (
        <div className="p-3 border-t border-border bg-card flex-shrink-0 sticky bottom-0 z-50 w-full">
          <div className="space-y-2 mb-3">
            <div>
              <div className="flex justify-between font-bold">
                <span className="text-sm text-card-foreground">Total:</span>
                <span className="text-green-600 text-sm">PKR {getCartTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={onCheckout}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-10 text-sm font-medium"
            size="lg"
          >
            Complete Sale ({paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'credit' ? 'Credit' : 'Card'})
          </Button>
        </div>
      )}

      {/* Customer Selection Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={onSetIsCustomerDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search customers..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="mb-4 bg-background border-input"
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors bg-card"
                    onClick={() => {
                      onSetSelectedCustomer(customer);
                      onSetIsCustomerDialogOpen(false);
                      setCustomerSearchTerm("");
                    }}
                  >
                    <p className="font-medium text-card-foreground">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    {customer.email && (
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No customers found</p>
                  {customerSearchTerm && (
                    <p className="text-xs">Try a different search term</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Outsourcing Modal */}
      <Dialog open={isOutsourcingModalOpen} onOpenChange={setIsOutsourcingModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Product Outsourcing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Configure outsourcing details for this product
            </div>
            
            <div className="space-y-3">
              <Label>Select Supplier</Label>
              <Input
                placeholder="Search suppliers..."
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                className="bg-background border-input"
              />
              
              {supplierSearchTerm && (
                <div className="max-h-40 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          selectedSupplier?.id === supplier.id
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300"
                            : "hover:bg-muted/50 border-border"
                        }`}
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setSupplierSearchTerm(supplier.name);
                        }}
                      >
                        <p className="font-medium text-sm">{supplier.name}</p>
                        {supplier.contactPerson && (
                          <p className="text-xs text-muted-foreground">{supplier.contactPerson}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2 text-muted-foreground text-sm">
                      No suppliers found
                    </div>
                  )}
                </div>
              )}
              
              {selectedSupplier && !supplierSearchTerm && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 rounded">
                  <p className="font-medium text-sm">{selectedSupplier.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSupplier(null);
                      setSupplierSearchTerm("");
                    }}
                    className="h-4 w-4 p-0 mt-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Outsourcing Cost per Unit (PKR)</Label>
              <Input
                type="number"
                placeholder="Enter cost per unit"
                value={outsourcingCost}
                onChange={(e) => setOutsourcingCost(e.target.value)}
                className="bg-background border-input"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleOutsourcingCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOutsourcingSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={selectedSupplier && outsourcingCost ? false : true}
              >
                {selectedSupplier && outsourcingCost ? "Save Outsourcing" : "Remove Outsourcing"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
