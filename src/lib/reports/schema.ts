
export type ReportFieldUrl = {
    id: string; // "jobs.job_id"
    label: string; // "Job ID"
    type: 'string' | 'number' | 'date' | 'boolean' | 'datetime';
    sql: string; // "jobs.job_id" or "CONCAT(...)"
};

export type ReportEntity = {
    id: string; // "jobs"
    label: string; // "Jobs"
    table: string; // "jobs"
    pk: string; // "job_id"
    fields: ReportFieldUrl[];
    joins?: string[]; // List of tables to LEFT JOIN automatically
};

export const REPORT_SCHEMA: Record<string, ReportEntity> = {
    jobs: {
        id: 'jobs',
        label: 'Jobs',
        table: 'jobs',
        pk: 'job_id',
        joins: [
            'LEFT JOIN customer ON jobs.customer_id = customer.customer_id',
            'LEFT JOIN company ON jobs.company_id = company.company_id',
            'LEFT JOIN jobtype ON jobs.job_type_id = jobtype.job_type_id',
            'LEFT JOIN job_status ON jobs.job_status_id = job_status.job_status_id',
            'LEFT JOIN bintype ON jobs.bin_type_id = bintype.bin_type_id',
            'LEFT JOIN users ON jobs.assigned_to = users.user_id',
        ],
        fields: [
            { id: 'jobs.job_id', label: 'Job ID', type: 'number', sql: 'jobs.job_id' },
            { id: 'jobs.job_date', label: 'Job Date', type: 'date', sql: 'jobs.job_date' },
            { id: 'jobs.job_datetime', label: 'Job Date Time', type: 'datetime', sql: 'jobs.job_datetime' },
            { id: 'jobs.jobs_notes', label: 'Job Notes', type: 'string', sql: 'jobs.jobs_notes' },
            { id: 'customer.customer_name', label: 'Customer Name', type: 'string', sql: 'customer.customer_name' },
            { id: 'company.company_name', label: 'Company Name', type: 'string', sql: 'company.company_name' },
            { id: 'jobtype.job_type_name', label: 'Job Type', type: 'string', sql: 'jobtype.job_type_name' },
            { id: 'job_status.job_status_name', label: 'Status', type: 'string', sql: 'job_status.job_status_name' },
            { id: 'users.name', label: 'Assigned Driver', type: 'string', sql: "CONCAT(users.first_name, ' ', users.last_name)" },
            { id: 'jobs.address', label: 'Site Address', type: 'string', sql: 'jobs.address' },
            { id: 'jobs.postcode', label: 'Postcode', type: 'string', sql: 'jobs.postcode' },
            { id: 'jobs.city', label: 'City', type: 'string', sql: 'jobs.city' },
        ]
    },
    customers: {
        id: 'customers',
        label: 'Customers',
        table: 'customer',
        pk: 'customer_id',
        joins: [
            'LEFT JOIN company ON customer.company_id = company.company_id',
            'LEFT JOIN users ON customer.assigned_to = users.user_id',
        ],
        fields: [
            { id: 'customer.customer_id', label: 'Customer ID', type: 'number', sql: 'customer.customer_id' },
            { id: 'customer.customer_name', label: 'Customer Name', type: 'string', sql: 'customer.customer_name' },
            { id: 'customer.contact_name', label: 'Contact Name', type: 'string', sql: 'customer.contact_name' },
            { id: 'customer.email', label: 'Email', type: 'string', sql: 'customer.email' },
            { id: 'customer.phone_number', label: 'Phone', type: 'string', sql: 'customer.phone_number' },
            { id: 'company.company_name', label: 'Company', type: 'string', sql: 'company.company_name' },
            { id: 'customer.address', label: 'Address', type: 'string', sql: 'customer.address' },
            { id: 'customer.postcode', label: 'Postcode', type: 'string', sql: 'customer.postcode' },
        ]
    },
    bins: {
        id: 'bins',
        label: 'Bins',
        table: 'bins',
        pk: 'bin_id',
        joins: [
            'LEFT JOIN bintype ON bins.bin_type_id = bintype.bin_type_id',
            'LEFT JOIN customer ON bins.customer_id = customer.customer_id',
            'LEFT JOIN bin_status ON bins.bin_status_id = bin_status.bin_status_id',
        ],
        fields: [
            { id: 'bins.bin_number', label: 'Bin Number', type: 'string', sql: 'bins.bin_number' },
            { id: 'bintype.bin_name', label: 'Bin Type', type: 'string', sql: 'bintype.bin_name' },
            { id: 'customer.customer_name', label: 'Customer', type: 'string', sql: 'customer.customer_name' },
            { id: 'bin_status.label', label: 'Status', type: 'string', sql: 'bin_status.label' },
            { id: 'bins.last_service_date', label: 'Last Service', type: 'date', sql: 'bins.last_service_date' }
        ]
    },
    inventory: {
        id: 'inventory',
        label: 'Inventory',
        table: 'inventory',
        pk: 'id',
        joins: [
            'LEFT JOIN supplier ON inventory.supplier_id = supplier.id',
            'LEFT JOIN stock_category ON inventory.category_id = stock_category.id',
        ],
        fields: [
            { id: 'inventory.item_name', label: 'Item Name', type: 'string', sql: 'inventory.item_name' },
            { id: 'inventory.sku', label: 'SKU', type: 'string', sql: 'inventory.sku' },
            { id: 'inventory.quantity', label: 'Quantity', type: 'number', sql: 'inventory.quantity' },
            { id: 'stock_category.name', label: 'Category', type: 'string', sql: 'stock_category.name' },
            { id: 'supplier.name', label: 'Supplier', type: 'string', sql: 'supplier.name' },
            { id: 'inventory.cost_price', label: 'Cost Price', type: 'number', sql: 'inventory.cost_price' },
        ]
    }
};
