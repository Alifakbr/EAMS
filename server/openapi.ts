export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Apex EAMS & Commercial Operations REST API',
    version: '1.0.0',
    description: 'Enterprise Asset Management System (EAMS) commercial operations API for assets, sales quotations, sales orders, equipment rentals, billing, invoices, payments, procurement, and profitability analytics.',
    contact: {
      name: 'Apex Enterprise Architecture Team',
      email: 'api-support@apex-industrial.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary Core API v1 Gateway',
    },
  ],
  paths: {
    '/customers': {
      get: {
        summary: 'List customers',
        description: 'Retrieve paginated and searchable customer list with billing and delivery addresses and outstanding balances.',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by customer name, code, or tax ID' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'ON_HOLD', 'INACTIVE'] } },
        ],
        responses: {
          200: { description: 'Successful operation', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Customer' } } } } },
        },
      },
      post: {
        summary: 'Create new customer',
        description: 'Register a new commercial entity or individual customer profile with credit limit and tax ID.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerInput' } } },
        },
        responses: {
          201: { description: 'Customer created successfully' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/customers/{id}': {
      get: {
        summary: 'Get customer details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer profile returned' }, 404: { description: 'Not found' } },
      },
      patch: {
        summary: 'Update customer profile',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer updated' } },
      },
    },
    '/products': {
      get: {
        summary: 'List products and catalog items',
        description: 'Filter catalog by category, product type (SERIALIZED, QUANTITY_BASED, SERVICE), and stock availability.',
        responses: { 200: { description: 'Product catalog list' } },
      },
      post: {
        summary: 'Add catalog product',
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/products/{id}': {
      patch: {
        summary: 'Update product',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Product updated' } },
      },
    },
    '/assets': {
      get: {
        summary: 'List assets in registry',
        description: 'Retrieve company assets with serialized tracking, maintenance status, rental status, and depreciation.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'RENTED', 'SOLD', 'IN_MAINTENANCE', 'RESERVED', 'DISPOSED'] } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'List of assets' } },
      },
      post: {
        summary: 'Create asset tag',
        responses: { 201: { description: 'Asset registered' } },
      },
    },
    '/quotations': {
      get: {
        summary: 'List sales quotations',
        responses: { 200: { description: 'List of quotations' } },
      },
      post: {
        summary: 'Create sales quotation',
        description: 'Create multi-item quotation with automated decimal-safe tax, discount, and validity dates.',
        responses: { 201: { description: 'Quotation created' } },
      },
    },
    '/quotations/{id}/approve': {
      post: {
        summary: 'Internal quotation approval',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Quotation approved' } },
      },
    },
    '/quotations/{id}/convert-to-order': {
      post: {
        summary: 'Convert quotation to sales order',
        description: 'Converts an approved quotation into a live Sales Order, reserving serialized assets and inventory.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sales order generated' } },
      },
    },
    '/sales-orders': {
      get: {
        summary: 'List sales orders',
        responses: { 200: { description: 'Sales orders list' } },
      },
      post: {
        summary: 'Create direct sales order',
        responses: { 201: { description: 'Order created' } },
      },
    },
    '/sales-orders/{id}/cancel': {
      post: {
        summary: 'Cancel sales order with mandatory reason',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } } } },
        responses: { 200: { description: 'Order cancelled and allocated inventory unlocked' } },
      },
    },
    '/rentals': {
      get: {
        summary: 'List rental contracts and reservations',
        responses: { 200: { description: 'Rental contracts list' } },
      },
      post: {
        summary: 'Create rental contract and reserve equipment',
        description: 'Locks selected serialized assets, preventing overlapping reservations.',
        responses: { 201: { description: 'Rental contract created' } },
      },
    },
    '/rentals/{id}/extend': {
      post: {
        summary: 'Extend rental contract duration',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { newReturnDate: { type: 'string' } }, required: ['newReturnDate'] } } } },
        responses: { 200: { description: 'Contract extended' } },
      },
    },
    '/rentals/{id}/return': {
      post: {
        summary: 'Process rental equipment return and condition inspection',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  returnCondition: { type: 'string', enum: ['EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'DAMAGED'] },
                  damageCharge: { type: 'number' },
                  inspectionNotes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Return inspected and deposit settled' } },
      },
    },
    '/deliveries': {
      get: {
        summary: 'List deliveries and dispatch notes',
        responses: { 200: { description: 'Deliveries list' } },
      },
      post: {
        summary: 'Create delivery order',
        responses: { 201: { description: 'Delivery order created' } },
      },
    },
    '/deliveries/{id}/confirm': {
      post: {
        summary: 'Confirm delivery and customer acceptance',
        description: 'Records digital proof of delivery and updates serialized asset lifecycle ownership.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Delivery confirmed' } },
      },
    },
    '/invoices': {
      get: {
        summary: 'List commercial invoices and credit notes',
        responses: { 200: { description: 'Invoices list' } },
      },
      post: {
        summary: 'Generate invoice from order or contract',
        responses: { 201: { description: 'Invoice generated' } },
      },
    },
    '/invoices/{id}/issue': {
      post: {
        summary: 'Issue invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Invoice issued and immutable' } },
      },
    },
    '/invoices/{id}/credit-notes': {
      post: {
        summary: 'Create credit note against issued invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 201: { description: 'Credit note created' } },
      },
    },
    '/payments': {
      get: {
        summary: 'List payments',
        responses: { 200: { description: 'Payments list' } },
      },
      post: {
        summary: 'Record payment and allocate to invoices',
        description: 'Records customer payment and reduces outstanding invoice balances transactionally.',
        responses: { 201: { description: 'Payment recorded and allocated' } },
      },
    },
    '/payments/{id}/refund': {
      post: {
        summary: 'Process payment refund',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Payment refunded' } },
      },
    },
    '/reports/sales': {
      get: {
        summary: 'Sales profitability and breakdown report',
        responses: { 200: { description: 'Sales report metrics' } },
      },
    },
    '/reports/rentals': {
      get: {
        summary: 'Rental fleet utilization and lease revenue report',
        responses: { 200: { description: 'Rental report metrics' } },
      },
    },
    '/reports/accounts-receivable': {
      get: {
        summary: 'Accounts receivable aging and balance report',
        responses: { 200: { description: 'AR report metrics' } },
      },
    },
    '/reports/asset-profitability': {
      get: {
        summary: 'Asset lifecycle profitability and operational return report',
        responses: { 200: { description: 'Asset profitability metrics' } },
      },
    },
  },
  components: {
    schemas: {
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerCode: { type: 'string' },
          name: { type: 'string' },
          taxId: { type: 'string' },
          outstandingBalance: { type: 'number' },
          creditLimit: { type: 'number' },
        },
      },
      CustomerInput: {
        type: 'object',
        required: ['name', 'type', 'taxId'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['COMPANY', 'INDIVIDUAL'] },
          taxId: { type: 'string' },
          creditLimit: { type: 'number' },
          paymentTermsDays: { type: 'number' },
        },
      },
    },
  },
};
