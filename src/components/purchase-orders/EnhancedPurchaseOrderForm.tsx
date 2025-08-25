
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, X, Package, User, Calendar, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { suppliersApi, productsApi } from "@/services/api";

interface PurchaseOrderFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const EnhancedPurchaseOrderForm = ({ onSubmit, onClose, isLoading }: PurchaseOrderFormProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Fetch suppliers with search
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-search', supplierSearch],
    queryFn: () => suppliersApi.getAll({ 
      search: supplierSearch,
      limit: 50,
      status: 'active'
    }),
    enabled: showSupplierDropdown || supplierSearch.length > 0
  });

  // Fetch products with search
  const { data: productsData } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () => productsApi.getAll({ 
      search: productSearch,
      limit: 50,
      status: 'active'
    }),
    enabled: showProductDropdown || productSearch.length > 0
  });

  const suppliers = suppliersData?.data?.suppliers || suppliersData?.data || [];
  const products = productsData?.data?.products || productsData?.data || [];

  const filteredSuppliers = suppliers.filter((supplier: any) =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addProduct = (product: any) => {
    const existingItem = items.find(item => item.productId === product.id.toString());
    
    if (existingItem) {
      // Increase quantity if product already exists
      updateItemQuantity(product.id.toString(), existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        productId: product.id.toString(),
        productName: product.name,
        quantity: 1,
        unitPrice: product.costPrice || product.price || 0,
        total: product.costPrice || product.price || 0
      };
      setItems([...items, newItem]);
    }
    
    setProductSearch("");
    setShowProductDropdown(false);
    
    toast({
      title: "Product Added",
      description: `${product.name} added to purchase order`,
    });
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(items.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setItems(items.map(item => 
      item.productId === productId 
        ? { ...item, unitPrice: newPrice, total: item.quantity * newPrice }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = () => {
    if (!selectedSupplier) {
      toast({
        title: "Supplier Required",
        description: "Please select a supplier for this purchase order",
        variant: "destructive"
      });
      return;
    }

    if (!expectedDelivery) {
      toast({
        title: "Delivery Date Required",
        description: "Please set an expected delivery date",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one item to the purchase order",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      supplierId: selectedSupplier.id,
      expectedDelivery,
      notes,
      items: items.map(item => ({
        productId: parseInt(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    onSubmit(submitData);
  };

  const nextStep = () => {
    if (step === 1 && !selectedSupplier) {
      toast({
        title: "Supplier Required",
        description: "Please select a supplier to continue",
        variant: "destructive"
      });
      return;
    }
    if (step === 2 && !expectedDelivery) {
      toast({
        title: "Delivery Date Required",
        description: "Please set an expected delivery date",
        variant: "destructive"
      });
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= stepNum 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-12 h-0.5 ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Step 1: Supplier Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search suppliers by name, contact person, or city..."
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                className="pl-10"
              />
              
              {showSupplierDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier: any) => (
                      <div
                        key={supplier.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setSupplierSearch(supplier.name);
                          setShowSupplierDropdown(false);
                        }}
                      >
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-500">
                          {supplier.contactPerson} • {supplier.city}
                        </div>
                        <div className="text-xs text-gray-400">
                          {supplier.phone} • {supplier.email}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No suppliers found
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedSupplier && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{selectedSupplier.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedSupplier.contactPerson} • {selectedSupplier.city}
                      </p>
                    </div>
                    <Badge variant="secondary">Selected</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={nextStep} disabled={!selectedSupplier}>
                Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Order Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expectedDelivery">Expected Delivery Date *</Label>
                <Input
                  id="expectedDelivery"
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Selected Supplier</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {selectedSupplier?.name}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or special instructions..."
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button onClick={nextStep} disabled={!expectedDelivery}>
                Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Add Products */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products by name, SKU, or category..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="pl-10"
              />
              
              {showProductDropdown && productSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product: any) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => addProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku} • {product.category}
                            </div>
                            <div className="text-xs text-gray-400">
                              Cost: Rs. {product.costPrice || product.price} • Stock: {product.stock}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Items */}
            <div className="space-y-2">
              <Label>Selected Items ({items.length})</Label>
              {items.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <Card key={item.productId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productName}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Qty:</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                                className="w-20 h-8"
                                min="1"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Price:</Label>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-24 h-8"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="text-sm font-medium">
                              Total: Rs. {item.total.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items added yet. Search and add products above.
                </div>
              )}
            </div>

            {/* Order Summary */}
            {items.length > 0 && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">
                      Rs. {getTotalAmount().toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || items.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  "Create Purchase Order"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
