// Mock data for the demo

export interface MasterOrder {
  id: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  wooStatus: 'processing' | 'completed' | 'on-hold' | 'cancelled' | 'refunded';
  shipmentCarrier: string | null;
  trackingNumber: string | null;
  shipmentDate: string | null;
  shipmentStatus: 'not-shipped' | 'label-created' | 'in-transit' | 'delivered' | 'returned';
  inventoryStatus: 'in-stock' | 'reserved' | 'allocated' | 'out-of-stock' | 'backordered';
  operationalStatus: 'awaiting-stock' | 'packing' | 'ready-to-ship' | 'shipped' | 'delivered' | 'exception';
  supportStatus: string;
  exceptionFlag: boolean;
  exceptionReason?: string;
  sourceFile: string;
  lastUpdated: string;
  notes: string[];
}

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
}

export interface InventoryItem {
  sku: string;
  productName: string;
  category: string;
  stockOnHand: number;
  reservedStock: number;
  availableStock: number;
  incomingStock: number;
  damagedStock: number;
  reorderThreshold: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved' | 'backordered';
  lastUpdated: string;
  warehouseLocation: string;
}

export interface ExceptionRecord {
  id: string;
  orderId: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detectedAt: string;
  resolved: boolean;
}

export const mockOrders: MasterOrder[] = [
  {
    id: '1', orderId: 'WOO-10421', orderDate: '2026-03-01', customerName: 'Sarah Mitchell',
    customerEmail: 'sarah.m@email.com', items: [{ sku: 'VIT-C-500', name: 'Vitamin C 500mg', quantity: 2 }],
    wooStatus: 'processing', shipmentCarrier: 'USPS', trackingNumber: '9400111899223456789012',
    shipmentDate: '2026-03-02', shipmentStatus: 'in-transit', inventoryStatus: 'allocated',
    operationalStatus: 'shipped', supportStatus: 'Shipment in transit via USPS',
    exceptionFlag: false, sourceFile: 'woo_export_mar01.csv', lastUpdated: '2026-03-02T14:30:00Z', notes: []
  },
  {
    id: '2', orderId: 'WOO-10422', orderDate: '2026-03-01', customerName: 'James Porter',
    customerEmail: 'jporter@email.com', items: [{ sku: 'OMEGA-3-120', name: 'Omega 3 Fish Oil 120ct', quantity: 1 }, { sku: 'ZNC-50', name: 'Zinc 50mg', quantity: 3 }],
    wooStatus: 'processing', shipmentCarrier: null, trackingNumber: null,
    shipmentDate: null, shipmentStatus: 'not-shipped', inventoryStatus: 'out-of-stock',
    operationalStatus: 'awaiting-stock', supportStatus: 'Delayed — awaiting stock allocation',
    exceptionFlag: true, exceptionReason: 'OMEGA-3-120 out of stock', sourceFile: 'woo_export_mar01.csv', lastUpdated: '2026-03-03T09:00:00Z', notes: ['Vendor ETA: March 8']
  },
  {
    id: '3', orderId: 'WOO-10423', orderDate: '2026-03-02', customerName: 'Linda Chen',
    customerEmail: 'lchen@email.com', items: [{ sku: 'MAG-400', name: 'Magnesium 400mg', quantity: 1 }],
    wooStatus: 'completed', shipmentCarrier: 'UPS', trackingNumber: '1Z999AA10123456784',
    shipmentDate: '2026-03-03', shipmentStatus: 'delivered', inventoryStatus: 'allocated',
    operationalStatus: 'delivered', supportStatus: 'Delivered',
    exceptionFlag: false, sourceFile: 'woo_export_mar02.csv', lastUpdated: '2026-03-04T11:00:00Z', notes: []
  },
  {
    id: '4', orderId: 'WOO-10424', orderDate: '2026-03-02', customerName: 'Marcus Brown',
    customerEmail: 'mbrown@email.com', items: [{ sku: 'VIT-D-1000', name: 'Vitamin D3 1000IU', quantity: 2 }],
    wooStatus: 'completed', shipmentCarrier: null, trackingNumber: null,
    shipmentDate: null, shipmentStatus: 'not-shipped', inventoryStatus: 'in-stock',
    operationalStatus: 'exception', supportStatus: 'Under review — marked complete but not shipped',
    exceptionFlag: true, exceptionReason: 'Completed in Woo but no shipment record', sourceFile: 'woo_export_mar02.csv', lastUpdated: '2026-03-04T08:00:00Z', notes: []
  },
  {
    id: '5', orderId: 'WOO-10425', orderDate: '2026-03-03', customerName: 'Amy Rodriguez',
    customerEmail: 'amy.r@email.com', items: [{ sku: 'PROB-60', name: 'Probiotic 60 Billion CFU', quantity: 1 }],
    wooStatus: 'processing', shipmentCarrier: 'USPS', trackingNumber: null,
    shipmentDate: null, shipmentStatus: 'label-created', inventoryStatus: 'reserved',
    operationalStatus: 'packing', supportStatus: 'Preparing shipment',
    exceptionFlag: false, sourceFile: 'woo_export_mar03.csv', lastUpdated: '2026-03-04T10:00:00Z', notes: []
  },
  {
    id: '6', orderId: 'WOO-10426', orderDate: '2026-03-03', customerName: 'David Kim',
    customerEmail: 'dkim@email.com', items: [{ sku: 'VIT-C-500', name: 'Vitamin C 500mg', quantity: 5 }],
    wooStatus: 'on-hold', shipmentCarrier: null, trackingNumber: null,
    shipmentDate: null, shipmentStatus: 'not-shipped', inventoryStatus: 'in-stock',
    operationalStatus: 'awaiting-stock', supportStatus: 'On hold — pending payment confirmation',
    exceptionFlag: false, sourceFile: 'woo_export_mar03.csv', lastUpdated: '2026-03-04T07:00:00Z', notes: []
  },
  {
    id: '7', orderId: 'WOO-10427', orderDate: '2026-03-04', customerName: 'Rachel Green',
    customerEmail: 'rgreen@email.com', items: [{ sku: 'IRON-65', name: 'Iron 65mg', quantity: 2 }, { sku: 'VIT-B12-1000', name: 'Vitamin B12 1000mcg', quantity: 1 }],
    wooStatus: 'processing', shipmentCarrier: 'FedEx', trackingNumber: '794644790132',
    shipmentDate: '2026-03-05', shipmentStatus: 'in-transit', inventoryStatus: 'allocated',
    operationalStatus: 'shipped', supportStatus: 'Shipped via FedEx',
    exceptionFlag: false, sourceFile: 'woo_export_mar04.csv', lastUpdated: '2026-03-05T16:00:00Z', notes: []
  },
  {
    id: '8', orderId: 'WOO-10428', orderDate: '2026-03-04', customerName: 'Tom Wallace',
    customerEmail: 'twallace@email.com', items: [{ sku: 'OMEGA-3-120', name: 'Omega 3 Fish Oil 120ct', quantity: 2 }],
    wooStatus: 'processing', shipmentCarrier: null, trackingNumber: null,
    shipmentDate: null, shipmentStatus: 'not-shipped', inventoryStatus: 'backordered',
    operationalStatus: 'awaiting-stock', supportStatus: 'Backordered — estimated restock March 8',
    exceptionFlag: true, exceptionReason: 'SKU backordered, no restock ETA confirmed', sourceFile: 'woo_export_mar04.csv', lastUpdated: '2026-03-05T09:00:00Z', notes: []
  },
];

export const mockInventory: InventoryItem[] = [
  { sku: 'VIT-C-500', productName: 'Vitamin C 500mg', category: 'Vitamins', stockOnHand: 342, reservedStock: 7, availableStock: 335, incomingStock: 500, damagedStock: 0, reorderThreshold: 100, status: 'in-stock', lastUpdated: '2026-03-05', warehouseLocation: 'A-12' },
  { sku: 'OMEGA-3-120', productName: 'Omega 3 Fish Oil 120ct', category: 'Supplements', stockOnHand: 0, reservedStock: 0, availableStock: 0, incomingStock: 200, damagedStock: 0, reorderThreshold: 50, status: 'out-of-stock', lastUpdated: '2026-03-05', warehouseLocation: 'B-03' },
  { sku: 'ZNC-50', productName: 'Zinc 50mg', category: 'Minerals', stockOnHand: 89, reservedStock: 3, availableStock: 86, incomingStock: 0, damagedStock: 2, reorderThreshold: 75, status: 'low-stock', lastUpdated: '2026-03-05', warehouseLocation: 'A-08' },
  { sku: 'MAG-400', productName: 'Magnesium 400mg', category: 'Minerals', stockOnHand: 210, reservedStock: 0, availableStock: 210, incomingStock: 0, damagedStock: 0, reorderThreshold: 50, status: 'in-stock', lastUpdated: '2026-03-04', warehouseLocation: 'A-15' },
  { sku: 'VIT-D-1000', productName: 'Vitamin D3 1000IU', category: 'Vitamins', stockOnHand: 445, reservedStock: 0, availableStock: 445, incomingStock: 0, damagedStock: 5, reorderThreshold: 100, status: 'in-stock', lastUpdated: '2026-03-05', warehouseLocation: 'A-03' },
  { sku: 'PROB-60', productName: 'Probiotic 60 Billion CFU', category: 'Probiotics', stockOnHand: 67, reservedStock: 1, availableStock: 66, incomingStock: 150, damagedStock: 0, reorderThreshold: 40, status: 'in-stock', lastUpdated: '2026-03-05', warehouseLocation: 'C-01' },
  { sku: 'IRON-65', productName: 'Iron 65mg', category: 'Minerals', stockOnHand: 28, reservedStock: 2, availableStock: 26, incomingStock: 0, damagedStock: 0, reorderThreshold: 30, status: 'low-stock', lastUpdated: '2026-03-05', warehouseLocation: 'B-07' },
  { sku: 'VIT-B12-1000', productName: 'Vitamin B12 1000mcg', category: 'Vitamins', stockOnHand: 156, reservedStock: 1, availableStock: 155, incomingStock: 0, damagedStock: 0, reorderThreshold: 50, status: 'in-stock', lastUpdated: '2026-03-04', warehouseLocation: 'A-06' },
  { sku: 'COLG-TYPE2', productName: 'Collagen Type II', category: 'Supplements', stockOnHand: 12, reservedStock: 0, availableStock: 12, incomingStock: 100, damagedStock: 0, reorderThreshold: 25, status: 'low-stock', lastUpdated: '2026-03-03', warehouseLocation: 'C-04' },
  { sku: 'TURM-500', productName: 'Turmeric Curcumin 500mg', category: 'Supplements', stockOnHand: 0, reservedStock: 0, availableStock: 0, incomingStock: 0, damagedStock: 0, reorderThreshold: 60, status: 'out-of-stock', lastUpdated: '2026-03-01', warehouseLocation: 'B-11' },
];

export const mockExceptions: ExceptionRecord[] = [
  { id: 'EXC-001', orderId: 'WOO-10422', type: 'Stock Unavailable', severity: 'high', description: 'OMEGA-3-120 out of stock — order cannot be fulfilled', detectedAt: '2026-03-03T09:00:00Z', resolved: false },
  { id: 'EXC-002', orderId: 'WOO-10424', type: 'Status Mismatch', severity: 'critical', description: 'Order marked completed in WooCommerce but no shipment record exists', detectedAt: '2026-03-04T08:00:00Z', resolved: false },
  { id: 'EXC-003', orderId: 'WOO-10428', type: 'Backorder', severity: 'medium', description: 'SKU OMEGA-3-120 backordered — no confirmed restock date', detectedAt: '2026-03-05T09:00:00Z', resolved: false },
  { id: 'EXC-004', orderId: 'WOO-10415', type: 'Missing Tracking', severity: 'low', description: 'Shipment created 5 days ago but tracking not scanning', detectedAt: '2026-03-02T12:00:00Z', resolved: true },
];

export const kpiData = {
  totalOrders: 847,
  totalShipments: 792,
  totalSKUs: 156,
  stockOnHand: 14280,
  ordersMatched: 768,
  ordersUnmatched: 79,
  shipmentsUnmatched: 24,
  backlogOrders: 43,
  awaitingShipment: 31,
  delayedByStock: 18,
  ordersShipped: 724,
  missingTracking: 12,
  exceptions: 7,
  lowStockItems: 14,
  outOfStockItems: 5,
};
